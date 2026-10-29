/**
 * FASE 6.4: GATE E — STORAGE ADAPTER INTERFACE
 * Contratos de almacenamiento privado compatible con S3 (MinIO / Cloudflare R2 / AWS S3)
 */

import { Readable } from "stream";

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucketClean: string;
  bucketQuarantine: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
  serverSideEncryption?: "AES256" | "aws:kms";
  kmsKeyId?: string;
  defaultUploadTtlSeconds: number; // 10 min (600s)
  defaultDownloadTtlSeconds: number; // 5 min (300s), max 15 min (900s)
}

export interface ObjectMetadata {
  contentLength: number;
  contentType: string;
  etag: string;
  lastModified?: Date;
  serverSideEncryption?: string;
  customMetadata?: Record<string, string>;
}

export interface UploadAuthorization {
  uploadUrl: string;
  storageKey: string;
  bucket: string;
  expiresAt: Date;
  declaredMimeType: string;
  maxAllowedBytes: number;
  serverSideEncryption?: string;
}

export interface DownloadAuthorization {
  downloadUrl: string;
  expiresAt: Date;
  fileName: string;
  contentType: string;
}

export interface StorageAdapter {
  createUploadAuthorization(params: {
    storageKey: string;
    isQuarantine?: boolean;
    declaredMimeType: string;
    maxAllowedBytes: number;
    ttlSeconds?: number;
  }): Promise<UploadAuthorization>;

  confirmObject(storageKey: string, isQuarantine?: boolean): Promise<boolean>;

  getObjectMetadata(storageKey: string, isQuarantine?: boolean): Promise<ObjectMetadata>;

  getObjectBuffer(storageKey: string, isQuarantine?: boolean): Promise<Buffer>;

  getObjectStream(storageKey: string, isQuarantine?: boolean): Promise<Readable>;

  putObject(params: {
    storageKey: string;
    buffer: Buffer;
    contentType: string;
    isQuarantine?: boolean;
    metadata?: Record<string, string>;
  }): Promise<{ etag: string; sha256: string }>;

  promoteQuarantinedObject(params: {
    quarantineKey: string;
    cleanKey: string;
    metadata?: Record<string, string>;
  }): Promise<void>;

  createDownloadAuthorization(params: {
    storageKey: string;
    safeFileName: string;
    contentType?: string;
    ttlSeconds?: number;
    isQuarantine?: boolean;
  }): Promise<DownloadAuthorization>;

  deleteObject(storageKey: string, isQuarantine?: boolean): Promise<void>;

  healthCheck(): Promise<{ ok: boolean; provider: string; details?: unknown }>;
}
