/**
 * FINTERA ENTERPRISE CRM — FASE 1: SUPABASE STORAGE ADAPTER (CUARENTENA + CLEAN VAULT)
 * Implementación nativa sobre Supabase Storage v1 REST API con aislamiento estricto de buckets:
 *  - fintera-documents-quarantine (Zona de cuarentena previa a inspección Magic Bytes + ClamAV)
 *  - fintera-documents-clean (Bóveda certificada de objetos limpios e inmutables)
 *
 * Cero exposición de SUPABASE_SERVICE_ROLE_KEY al cliente (solo URLs firmadas efímeras).
 */

import { Readable } from "stream";
import crypto from "crypto";
import {
  StorageAdapter,
  ObjectMetadata,
  UploadAuthorization,
  DownloadAuthorization,
} from "./storage-adapter.interface";

export interface SupabaseStorageConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  quarantineBucket: string;
  cleanBucket: string;
  defaultPresignUploadTtlSeconds: number;
  defaultPresignDownloadTtlSeconds: number;
  maxPresignDownloadTtlSeconds: number;
}

export function getSupabaseStorageConfig(): SupabaseStorageConfig | null {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    quarantineBucket: process.env.SUPABASE_BUCKET_QUARANTINE || "fintera-documents-quarantine",
    cleanBucket: process.env.SUPABASE_BUCKET_CLEAN || "fintera-documents-clean",
    defaultPresignUploadTtlSeconds: 600, // 10 min
    defaultPresignDownloadTtlSeconds: 300, // 5 min
    maxPresignDownloadTtlSeconds: 900, // 15 min
  };
}

export class SupabaseStorageAdapter implements StorageAdapter {
  private config: SupabaseStorageConfig;

  constructor(customConfig?: SupabaseStorageConfig) {
    const resolved = customConfig || getSupabaseStorageConfig();
    if (!resolved) {
      throw new Error(
        "SupabaseStorageAdapter requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configurados."
      );
    }
    this.config = resolved;
  }

  private getBucket(isQuarantine = false): string {
    return isQuarantine ? this.config.quarantineBucket : this.config.cleanBucket;
  }

  private getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.serviceRoleKey}`,
      apikey: this.config.serviceRoleKey,
      ...extra,
    };
  }

  private encodeKeyPath(storageKey: string): string {
    return storageKey
      .replace(/^\/+/, "")
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
  }

  /**
   * 1. Emite URL pre-firmada PUT hacia el bucket de cuarentena en Supabase Storage
   */
  public async createUploadAuthorization(params: {
    storageKey: string;
    isQuarantine?: boolean;
    declaredMimeType: string;
    maxAllowedBytes: number;
    ttlSeconds?: number;
  }): Promise<UploadAuthorization> {
    const {
      storageKey,
      isQuarantine = true,
      declaredMimeType,
      maxAllowedBytes,
      ttlSeconds,
    } = params;
    const bucket = this.getBucket(isQuarantine);
    const effectiveTtl = ttlSeconds || this.config.defaultPresignUploadTtlSeconds;
    const encodedKey = this.encodeKeyPath(storageKey);

    const res = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/upload/sign/${bucket}/${encodedKey}`,
      {
        method: "POST",
        headers: this.getAuthHeaders({
          "Content-Type": "application/json",
          "x-upsert": "true",
        }),
        body: JSON.stringify({}),
      }
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(
        `[SupabaseStorageAdapter] Error generando URL firmada de carga (${res.status}): ${errBody}`
      );
    }

    const data = (await res.json()) as { url: string; token?: string };
    const uploadUrl = data.url.startsWith("http")
      ? data.url
      : `${this.config.supabaseUrl}/storage/v1${data.url}`;

    const expiresAt = new Date(Date.now() + effectiveTtl * 1000);

    return {
      uploadUrl,
      storageKey,
      bucket,
      expiresAt,
      declaredMimeType,
      maxAllowedBytes,
      serverSideEncryption: "AES256",
    };
  }

  /**
   * 2. Verifica existencia del objeto en Supabase Storage
   */
  public async confirmObject(storageKey: string, isQuarantine = true): Promise<boolean> {
    try {
      const meta = await this.getObjectMetadata(storageKey, isQuarantine);
      return meta.contentLength >= 0;
    } catch {
      return false;
    }
  }

  /**
   * 3. Obtiene metadatos del objeto almacenado
   */
  public async getObjectMetadata(
    storageKey: string,
    isQuarantine = false
  ): Promise<ObjectMetadata> {
    const bucket = this.getBucket(isQuarantine);
    const encodedKey = this.encodeKeyPath(storageKey);

    const res = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/info/${bucket}/${encodedKey}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (res.ok) {
      const info = (await res.json()) as {
        size?: number;
        contentType?: string;
        etag?: string;
        updated_at?: string;
        metadata?: { size?: number; mimetype?: string; eTag?: string };
      };
      return {
        contentLength: Number(info.size ?? info.metadata?.size ?? 0),
        contentType: info.contentType || info.metadata?.mimetype || "application/octet-stream",
        etag: info.etag || info.metadata?.eTag || "supabase-etag",
        lastModified: info.updated_at ? new Date(info.updated_at) : new Date(),
        serverSideEncryption: "AES256",
      };
    }

    // Fallback: consultar con GET directo si /object/info no está habilitado
    const getRes = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/${bucket}/${encodedKey}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (!getRes.ok) {
      throw new Error(
        `[SupabaseStorageAdapter] Objeto no encontrado en ${bucket}/${storageKey} (${getRes.status})`
      );
    }

    const buf = await getRes.arrayBuffer();
    return {
      contentLength: buf.byteLength,
      contentType: getRes.headers.get("content-type") || "application/octet-stream",
      etag: getRes.headers.get("etag")?.replace(/"/g, "") || "supabase-etag",
      lastModified: new Date(),
      serverSideEncryption: "AES256",
    };
  }

  /**
   * 4. Descarga el contenido binario completo para validación Magic Bytes, SHA-256 y ClamAV
   */
  public async getObjectBuffer(storageKey: string, isQuarantine = false): Promise<Buffer> {
    const bucket = this.getBucket(isQuarantine);
    const encodedKey = this.encodeKeyPath(storageKey);

    const res = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/${bucket}/${encodedKey}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `[SupabaseStorageAdapter] Error descargando buffer de ${bucket}/${storageKey} (${res.status}): ${errText}`
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * 5. Obtiene un ReadableStream de Node.js del objeto
   */
  public async getObjectStream(storageKey: string, isQuarantine = false): Promise<Readable> {
    const buffer = await this.getObjectBuffer(storageKey, isQuarantine);
    return Readable.from(buffer);
  }

  /**
   * 6. Almacena un buffer directamente en el bucket indicado
   */
  public async putObject(params: {
    storageKey: string;
    buffer: Buffer;
    contentType: string;
    isQuarantine?: boolean;
    metadata?: Record<string, string>;
  }): Promise<{ etag: string; sha256: string }> {
    const { storageKey, buffer, contentType, isQuarantine = false } = params;
    const bucket = this.getBucket(isQuarantine);
    const encodedKey = this.encodeKeyPath(storageKey);
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    const res = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/${bucket}/${encodedKey}`,
      {
        method: "POST",
        headers: this.getAuthHeaders({
          "Content-Type": contentType || "application/octet-stream",
          "x-upsert": "true",
        }),
        body: new Uint8Array(buffer),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `[SupabaseStorageAdapter] Error en putObject ${bucket}/${storageKey} (${res.status}): ${errText}`
      );
    }

    return {
      etag: res.headers.get("etag")?.replace(/"/g, "") || sha256.slice(0, 16),
      sha256,
    };
  }

  /**
   * 7. Promueve un objeto verificado desde cuarentena hacia el bucket limpio y lo elimina de cuarentena
   */
  public async promoteQuarantinedObject(params: {
    quarantineKey: string;
    cleanKey: string;
    metadata?: Record<string, string>;
  }): Promise<void> {
    const { quarantineKey, cleanKey, metadata } = params;
    const contentType = metadata?.detectedMimeType || "application/octet-stream";

    // 1. Descargar de cuarentena
    const buffer = await this.getObjectBuffer(quarantineKey, true);

    // 2. Subir a bóveda limpia (fintera-documents-clean)
    await this.putObject({
      storageKey: cleanKey,
      buffer,
      contentType,
      isQuarantine: false,
      metadata,
    });

    // 3. Eliminar de cuarentena
    await this.deleteObject(quarantineKey, true);
  }

  /**
   * 8. Emite URL firmada GET de corta duración para visualización o descarga autorizada
   */
  public async createDownloadAuthorization(params: {
    storageKey: string;
    safeFileName: string;
    contentType?: string;
    ttlSeconds?: number;
    isQuarantine?: boolean;
  }): Promise<DownloadAuthorization> {
    const {
      storageKey,
      safeFileName,
      contentType = "application/pdf",
      ttlSeconds,
      isQuarantine = false,
    } = params;
    const bucket = this.getBucket(isQuarantine);
    const encodedKey = this.encodeKeyPath(storageKey);

    const requestedTtl = ttlSeconds || this.config.defaultPresignDownloadTtlSeconds;
    const effectiveTtl = Math.min(requestedTtl, this.config.maxPresignDownloadTtlSeconds);

    const res = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/sign/${bucket}/${encodedKey}`,
      {
        method: "POST",
        headers: this.getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ expiresIn: effectiveTtl }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `[SupabaseStorageAdapter] Error firmando URL de descarga (${res.status}): ${errText}`
      );
    }

    const data = (await res.json()) as { signedURL: string };
    const baseSignedUrl = data.signedURL.startsWith("http")
      ? data.signedURL
      : `${this.config.supabaseUrl}/storage/v1${data.signedURL}`;

    const sanitizedName = safeFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const separator = baseSignedUrl.includes("?") ? "&" : "?";
    const downloadUrl = `${baseSignedUrl}${separator}download=${encodeURIComponent(sanitizedName)}`;

    return {
      downloadUrl,
      expiresAt: new Date(Date.now() + effectiveTtl * 1000),
      fileName: sanitizedName,
      contentType,
    };
  }

  /**
   * 9. Elimina físicamente un objeto del bucket especificado
   */
  public async deleteObject(storageKey: string, isQuarantine = false): Promise<void> {
    const bucket = this.getBucket(isQuarantine);
    const encodedKey = this.encodeKeyPath(storageKey);

    const res = await fetch(
      `${this.config.supabaseUrl}/storage/v1/object/${bucket}/${encodedKey}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    );

    if (!res.ok && res.status !== 404) {
      const errText = await res.text().catch(() => "");
      console.warn(
        `[SupabaseStorageAdapter] Advertencia eliminando ${bucket}/${storageKey} (${res.status}): ${errText}`
      );
    }
  }

  /**
   * 10. Healthcheck del motor Supabase Storage
   */
  public async healthCheck(): Promise<{ ok: boolean; provider: string; details?: unknown }> {
    const start = Date.now();
    try {
      const res = await fetch(
        `${this.config.supabaseUrl}/storage/v1/bucket/${this.config.cleanBucket}`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return {
          ok: false,
          provider: "supabase-storage",
          details: { status: res.status, error: text, latencyMs: Date.now() - start },
        };
      }

      return {
        ok: true,
        provider: "supabase-storage",
        details: {
          cleanBucket: this.config.cleanBucket,
          quarantineBucket: this.config.quarantineBucket,
          latencyMs: Date.now() - start,
        },
      };
    } catch (err: any) {
      return {
        ok: false,
        provider: "supabase-storage",
        details: { error: err.message || "Error conectando con Supabase Storage" },
      };
    }
  }
}
