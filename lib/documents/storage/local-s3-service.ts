/**
 * FASE 6.4: GATE E — LOCAL S3 SERVICE (MINIO-COMPATIBLE ENGINE)
 * Servidor HTTP S3 local con cifrado en reposo AES-256-GCM y soporte de URLs pre-firmadas AWS Signature V4
 */

import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { URL } from "url";

export interface LocalS3Options {
  port?: number;
  host?: string;
  storageDir?: string;
  masterKeyHex?: string; // Clave AES-256 de 32 bytes en hex
}

export class LocalS3Service {
  private server: http.Server | null = null;
  private port: number;
  private host: string;
  private storageDir: string;
  private masterKey: Buffer;
  private isRunning = false;

  constructor(options: LocalS3Options = {}) {
    this.port = options.port || 9010;
    this.host = options.host || "127.0.0.1";
    this.storageDir = options.storageDir || path.resolve(process.cwd(), ".storage", "s3-data");
    
    const keyHex = options.masterKeyHex || process.env.STORAGE_ENCRYPTION_KEY || 
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // 32 bytes hex
    this.masterKey = Buffer.from(keyHex.padEnd(64, "0").slice(0, 64), "hex");
    
    this.ensureDirectories();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
    // Asegurar buckets iniciales
    const quarantinePath = path.join(this.storageDir, "fintera-docs-quarantine");
    const cleanPath = path.join(this.storageDir, "fintera-docs-clean");
    if (!fs.existsSync(quarantinePath)) fs.mkdirSync(quarantinePath, { recursive: true });
    if (!fs.existsSync(cleanPath)) fs.mkdirSync(cleanPath, { recursive: true });
  }

  /**
   * Cifrado en reposo AES-256-GCM
   */
  private encryptBuffer(plaintext: Buffer): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
    const iv = crypto.randomBytes(12); // 96 bits para GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", this.masterKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { ciphertext, iv, authTag };
  }

  /**
   * Descifrado en reposo AES-256-GCM
   */
  private decryptBuffer(ciphertext: Buffer, iv: Buffer, authTag: Buffer): Buffer {
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.masterKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  private getDiskPath(bucket: string, key: string): string {
    const safeKey = key.replace(/\.\./g, "");
    return path.join(this.storageDir, bucket, safeKey);
  }

  private getMetaPath(bucket: string, key: string): string {
    return `${this.getDiskPath(bucket, key)}.meta.json`;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res).catch((err) => {
          console.error("[LocalS3Service] Error no controlado:", err);
          res.statusCode = 500;
          res.end(err.message);
        });
      });

      this.server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          // El puerto ya está en uso (MinIO real o instancia previa)
          this.isRunning = true;
          resolve();
        } else {
          reject(err);
        }
      });

      this.server.listen(this.port, this.host, () => {
        this.isRunning = true;
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    if (!this.server || !this.isRunning) return;
    return new Promise((resolve) => {
      this.server?.close(() => {
        this.isRunning = false;
        resolve();
      });
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const method = req.method || "GET";
    const parsedUrl = new URL(req.url || "/", `http://${this.host}:${this.port}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Endpoint de verificación de salud
    if (pathname === "/minio/health/live" || pathname === "/health") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "ok", provider: "LocalS3Service", encrypted: true }));
      return;
    }

    // Ruta de objeto: /{bucket}/{key...}
    const pathParts = pathname.replace(/^\/+/, "").split("/");
    const bucket = pathParts[0];
    const key = pathParts.slice(1).join("/");

    // Validación de expiración para URLs pre-firmadas (AWS Signature V4)
    const expiresParam = parsedUrl.searchParams.get("X-Amz-Expires");
    const dateParam = parsedUrl.searchParams.get("X-Amz-Date");
    if (expiresParam && dateParam) {
      // Parsear fecha ISO básica YYYYMMDDTHHMMSSZ
      const year = parseInt(dateParam.slice(0, 4));
      const month = parseInt(dateParam.slice(4, 6)) - 1;
      const day = parseInt(dateParam.slice(6, 8));
      const hours = parseInt(dateParam.slice(9, 11));
      const minutes = parseInt(dateParam.slice(11, 13));
      const seconds = parseInt(dateParam.slice(13, 15));
      const signedTime = new Date(Date.UTC(year, month, day, hours, minutes, seconds)).getTime();
      const expiresMs = parseInt(expiresParam) * 1000;
      if (Date.now() > signedTime + expiresMs) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "application/xml");
        res.end(`<?xml version="1.0" encoding="UTF-8"?><Error><Code>AccessDenied</Code><Message>Request has expired</Message></Error>`);
        return;
      }
    }

    if (!bucket) {
      // ListBuckets / Root
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/xml");
      res.end(`<?xml version="1.0" encoding="UTF-8"?><ListAllMyBucketsResult><Buckets><Bucket><Name>fintera-docs-clean</Name></Bucket><Bucket><Name>fintera-docs-quarantine</Name></Bucket></Buckets></ListAllMyBucketsResult>`);
      return;
    }

    if (!key) {
      // Operaciones sobre el bucket (HeadBucket / PutBucket)
      if (method === "HEAD" || method === "GET") {
        res.statusCode = 200;
        res.end();
        return;
      }
      if (method === "PUT") {
        const bucketPath = path.join(this.storageDir, bucket);
        if (!fs.existsSync(bucketPath)) fs.mkdirSync(bucketPath, { recursive: true });
        res.statusCode = 200;
        res.end();
        return;
      }
    }

    const diskPath = this.getDiskPath(bucket, key);
    const metaPath = this.getMetaPath(bucket, key);

    // 1. PUT OBJECT (Subida de archivo con cifrado AES-256)
    if (method === "PUT") {
      // Verificar si es un CopyObject: cabecera x-amz-copy-source
      const copySource = req.headers["x-amz-copy-source"] as string | undefined;
      if (copySource) {
        const decodedSource = decodeURIComponent(copySource).replace(/^\/+/, "");
        const [sourceBucket, ...sourceKeyParts] = decodedSource.split("/");
        const sourceKey = sourceKeyParts.join("/");
        const srcDiskPath = this.getDiskPath(sourceBucket, sourceKey);
        const srcMetaPath = this.getMetaPath(sourceBucket, sourceKey);

        if (!fs.existsSync(srcDiskPath) || !fs.existsSync(srcMetaPath)) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/xml");
          res.end(`<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code><Message>Source not found</Message></Error>`);
          return;
        }

        fs.mkdirSync(path.dirname(diskPath), { recursive: true });
        fs.copyFileSync(srcDiskPath, diskPath);
        fs.copyFileSync(srcMetaPath, metaPath);

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/xml");
        res.end(`<?xml version="1.0" encoding="UTF-8"?><CopyObjectResult><ETag>"${crypto.randomBytes(16).toString("hex")}"</ETag></CopyObjectResult>`);
        return;
      }

      // Recepción de buffer completo
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      const rawPayload = Buffer.concat(chunks);

      // Cifrar con AES-256-GCM
      const { ciphertext, iv, authTag } = this.encryptBuffer(rawPayload);

      // Guardar archivo cifrado en disco
      fs.mkdirSync(path.dirname(diskPath), { recursive: true });
      fs.writeFileSync(diskPath, ciphertext);

      // Metadatos asociados
      const etag = `"${crypto.createHash("md5").update(rawPayload).digest("hex")}"`;
      const metadata = {
        contentType: req.headers["content-type"] || "application/octet-stream",
        originalLength: rawPayload.length,
        cipherLength: ciphertext.length,
        etag,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
        serverSideEncryption: "AES256",
        algorithm: "aes-256-gcm",
        uploadedAt: new Date().toISOString(),
      };
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

      res.statusCode = 200;
      res.setHeader("ETag", etag);
      res.setHeader("x-amz-server-side-encryption", "AES256");
      res.end();
      return;
    }

    // 2. GET OBJECT (Lectura con descifrado AES-256)
    if (method === "GET") {
      if (!fs.existsSync(diskPath) || !fs.existsSync(metaPath)) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/xml");
        res.end(`<?xml version="1.0" encoding="UTF-8"?><Error><Code>NoSuchKey</Code><Message>The specified key does not exist.</Message></Error>`);
        return;
      }

      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      const ciphertext = fs.readFileSync(diskPath);
      const iv = Buffer.from(meta.iv, "hex");
      const authTag = Buffer.from(meta.authTag, "hex");

      const decrypted = this.decryptBuffer(ciphertext, iv, authTag);

      // Headers
      res.statusCode = 200;
      res.setHeader("Content-Type", meta.contentType);
      res.setHeader("Content-Length", decrypted.length);
      res.setHeader("ETag", meta.etag);
      res.setHeader("x-amz-server-side-encryption", "AES256");
      res.setHeader("X-Content-Type-Options", "nosniff");

      const dispositionQuery = parsedUrl.searchParams.get("response-content-disposition");
      if (dispositionQuery) {
        res.setHeader("Content-Disposition", dispositionQuery);
      }

      res.end(decrypted);
      return;
    }

    // 3. HEAD OBJECT (Metadatos)
    if (method === "HEAD") {
      if (!fs.existsSync(diskPath) || !fs.existsSync(metaPath)) {
        res.statusCode = 404;
        res.end();
        return;
      }

      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      res.statusCode = 200;
      res.setHeader("Content-Type", meta.contentType);
      res.setHeader("Content-Length", meta.originalLength);
      res.setHeader("ETag", meta.etag);
      res.setHeader("x-amz-server-side-encryption", "AES256");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.end();
      return;
    }

    // 4. DELETE OBJECT
    if (method === "DELETE") {
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
      if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
      res.statusCode = 204;
      res.end();
      return;
    }

    res.statusCode = 405;
    res.end();
  }

  /**
   * Método forense para verificar que los datos en disco están cifrados y NO son texto plano
   */
  public verifyDiskEncryption(bucket: string, key: string, samplePlaintext: string): boolean {
    const diskPath = this.getDiskPath(bucket, key);
    if (!fs.existsSync(diskPath)) return false;
    const rawDiskBytes = fs.readFileSync(diskPath);
    // Comprobar que el texto plano de muestra NO aparece dentro de los bytes del archivo en disco
    const containsPlaintext = rawDiskBytes.includes(Buffer.from(samplePlaintext));
    return !containsPlaintext;
  }
}

// Singleton para uso en entorno local
export const localS3 = new LocalS3Service();
