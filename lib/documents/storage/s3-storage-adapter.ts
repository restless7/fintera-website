/**
 * FASE 6.4: GATE E — S3 STORAGE ADAPTER
 * Adaptador oficial compatible con MinIO local, Cloudflare R2 y AWS S3
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import crypto from "crypto";
import {
  StorageAdapter,
  StorageConfig,
  ObjectMetadata,
  UploadAuthorization,
  DownloadAuthorization,
} from "./storage-adapter.interface";
import { getStorageConfig } from "./storage-config";
import { SupabaseStorageAdapter } from "./supabase-storage-adapter";

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private config: StorageConfig;

  constructor(customConfig?: Partial<StorageConfig>) {
    this.config = { ...getStorageConfig(), ...customConfig };

    this.client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: this.config.forcePathStyle,
    });
  }

  private resolveBucket(isQuarantine?: boolean): string {
    return isQuarantine ? this.config.bucketQuarantine : this.config.bucketClean;
  }

  /**
   * Genera una URL pre-firmada PUT para carga segura directa
   */
  async createUploadAuthorization(params: {
    storageKey: string;
    isQuarantine?: boolean;
    declaredMimeType: string;
    maxAllowedBytes: number;
    ttlSeconds?: number;
  }): Promise<UploadAuthorization> {
    const bucket = this.resolveBucket(params.isQuarantine ?? true);
    const ttlSeconds = params.ttlSeconds || this.config.defaultUploadTtlSeconds;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: params.storageKey,
      ContentType: params.declaredMimeType,
      ServerSideEncryption: this.config.serverSideEncryption,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: ttlSeconds,
    });

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    return {
      uploadUrl,
      storageKey: params.storageKey,
      bucket,
      expiresAt,
      declaredMimeType: params.declaredMimeType,
      maxAllowedBytes: params.maxAllowedBytes,
      serverSideEncryption: this.config.serverSideEncryption,
    };
  }

  /**
   * Confirma la existencia física del objeto mediante HEAD
   */
  async confirmObject(storageKey: string, isQuarantine?: boolean): Promise<boolean> {
    try {
      const bucket = this.resolveBucket(isQuarantine);
      await this.client.send(
        new HeadObjectCommand({
          Bucket: bucket,
          Key: storageKey,
        })
      );
      return true;
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Obtiene metadatos físicos del objeto
   */
  async getObjectMetadata(storageKey: string, isQuarantine?: boolean): Promise<ObjectMetadata> {
    const bucket = this.resolveBucket(isQuarantine);
    const res = await this.client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    );

    return {
      contentLength: res.ContentLength || 0,
      contentType: res.ContentType || "application/octet-stream",
      etag: res.ETag || "",
      lastModified: res.LastModified,
      serverSideEncryption: res.ServerSideEncryption,
      customMetadata: res.Metadata,
    };
  }

  /**
   * Descarga el buffer completo del objeto
   */
  async getObjectBuffer(storageKey: string, isQuarantine?: boolean, maxBytes = 15728640): Promise<Buffer> {
    const bucket = this.resolveBucket(isQuarantine);
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    );

    if (!res.Body) {
      throw new Error(`Objeto vacío o no recuperable: ${storageKey}`);
    }

    const stream = res.Body as Readable;
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of stream) {
      const bytes = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      size += bytes.length;
      if (size > maxBytes) { stream.destroy(); throw new Error("Storage object exceeds size limit"); }
      chunks.push(bytes);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Obtiene el stream de lectura del objeto
   */
  async getObjectStream(storageKey: string, isQuarantine?: boolean): Promise<Readable> {
    const bucket = this.resolveBucket(isQuarantine);
    const res = await this.client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    );
    return res.Body as Readable;
  }

  /**
   * Carga directa de un buffer en almacenamiento con cifrado en reposo
   */
  async putObject(params: {
    storageKey: string;
    buffer: Buffer;
    contentType: string;
    isQuarantine?: boolean;
    metadata?: Record<string, string>;
  }): Promise<{ etag: string; sha256: string }> {
    const bucket = this.resolveBucket(params.isQuarantine);
    const sha256 = crypto.createHash("sha256").update(params.buffer).digest("hex");

    const res = await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: params.storageKey,
        Body: params.buffer,
        ContentType: params.contentType,
        Metadata: {
          ...params.metadata,
          sha256,
        },
        ServerSideEncryption: this.config.serverSideEncryption,
      })
    );

    return {
      etag: res.ETag || "",
      sha256,
    };
  }

  /**
   * Promueve un objeto verificado desde la zona de cuarentena hacia almacenamiento limpio
   */
  async promoteQuarantinedObject(params: {
    quarantineKey: string;
    cleanKey: string;
    scannedBuffer?: Buffer;
    metadata?: Record<string, string>;
  }): Promise<void> {
    if (!params.scannedBuffer) throw new Error("Promotion requires the exact scanned buffer");
    await this.putObject({ storageKey: params.cleanKey, buffer: params.scannedBuffer, contentType: params.metadata?.detectedMimeType || "application/octet-stream", metadata: params.metadata, isQuarantine: false });
  }

  /**
   * Genera una URL pre-firmada GET de descarga segura con expiración corta y headers defensivos
   */
  async createDownloadAuthorization(params: {
    storageKey: string;
    safeFileName: string;
    contentType?: string;
    ttlSeconds?: number;
    isQuarantine?: boolean;
  }): Promise<DownloadAuthorization> {
    const bucket = this.resolveBucket(params.isQuarantine ?? false);
    // Configurable: default 300s (5m), max 900s (15m)
    const ttlSeconds = Math.min(params.ttlSeconds || this.config.defaultDownloadTtlSeconds, 900);

    const safeDisposition = `attachment; filename="${params.safeFileName.replace(/"/g, "")}"`;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: params.storageKey,
      ResponseContentDisposition: safeDisposition,
      ResponseContentType: params.contentType || "application/octet-stream",
    });

    const downloadUrl = await getSignedUrl(this.client, command, {
      expiresIn: ttlSeconds,
    });

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    return {
      downloadUrl,
      expiresAt,
      fileName: params.safeFileName,
      contentType: params.contentType || "application/octet-stream",
    };
  }

  /**
   * Elimina un objeto de almacenamiento
   */
  async deleteObject(storageKey: string, isQuarantine?: boolean): Promise<void> {
    const bucket = this.resolveBucket(isQuarantine);
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      })
    );
  }

  /**
   * Chequeo de salud del servicio de almacenamiento
   */
  async healthCheck(): Promise<{ ok: boolean; provider: string; details?: unknown }> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucketClean,
          Key: "__health_check_non_existent__",
        })
      );
      return { ok: true, provider: "S3Compatible" };
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return { ok: true, provider: "S3Compatible", details: "Bucket accessible" };
      }
      return { ok: false, provider: "S3Compatible", details: err.message };
    }
  }
}

// Instancia singleton por defecto
function createCanonicalStorageAdapter(): StorageAdapter {
  if (process.env.FINTERA_DOCUMENT_STORAGE_URL || process.env.FINTERA_DOCUMENT_STORAGE_SERVICE_ROLE_KEY || process.env.FINTERA_DOCUMENT_BUCKET_QUARANTINE || process.env.FINTERA_DOCUMENT_BUCKET_CLEAN) return new SupabaseStorageAdapter();
  const provider = (process.env.STORAGE_PROVIDER || "supabase").toLowerCase();
  if (provider === "supabase") return new SupabaseStorageAdapter();
  if (provider === "s3" && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) return new S3StorageAdapter();
  throw new Error("Selected storage provider configuration unavailable");
}

// Resolve lazily: build can import server modules without provisioning storage credentials.
let canonicalStorage: StorageAdapter | undefined;
export const storageAdapter: StorageAdapter = new Proxy({} as StorageAdapter, {
  get(_target, key) { canonicalStorage ??= createCanonicalStorageAdapter(); const value = canonicalStorage[key as keyof StorageAdapter]; return typeof value === "function" ? value.bind(canonicalStorage) : value; },
});
