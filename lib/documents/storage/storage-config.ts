/**
 * FASE 6.4: GATE E — STORAGE CONFIGURATION
 * Carga de parámetros para MinIO local, Cloudflare R2 y AWS S3
 */

import { StorageConfig } from "./storage-adapter.interface";

export function getStorageConfig(): StorageConfig {
  const endpoint = process.env.S3_ENDPOINT || "http://127.0.0.1:9010";
  const region = process.env.S3_REGION || "us-east-1";
  const bucketClean = process.env.S3_BUCKET_CLEAN || "fintera-docs-clean";
  const bucketQuarantine = process.env.S3_BUCKET_QUARANTINE || "fintera-docs-quarantine";
  
  // Credenciales: en desarrollo local usa valores de entorno o claves locales aisladas
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY || "fintera_local_storage_admin";
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY || "fintera_local_dev_secret_key_998877";
  
  // forcePathStyle = true para MinIO local, false para AWS S3 estándar
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "false" ? false : true;
  
  const serverSideEncryption = (process.env.S3_SERVER_SIDE_ENCRYPTION as "AES256" | "aws:kms") || "AES256";
  const kmsKeyId = process.env.S3_KMS_KEY_ID;

  return {
    endpoint,
    region,
    bucketClean,
    bucketQuarantine,
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
    serverSideEncryption,
    kmsKeyId,
    defaultUploadTtlSeconds: 600, // 10 minutos
    defaultDownloadTtlSeconds: 300, // 5 minutos (máximo 15 minutos en solicitudes específicas)
  };
}
