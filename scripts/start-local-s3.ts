/**
 * FINTERA ENTERPRISE CRM — SERVICIO LOCAL S3 CRIPTOGRÁFICO
 * Ejecuta el servidor HTTP compatible con S3 en puerto 9010 para demostraciones locales
 */

import { LocalS3Service } from "../lib/documents/storage/local-s3-service";

const port = parseInt(process.env.S3_PORT || "9010", 10);
const s3 = new LocalS3Service({ port });

s3.start()
  .then(() => {
    console.log(`===============================================================================`);
    console.log(` [LocalS3Service] Servidor de almacenamiento activo en http://127.0.0.1:${port}`);
    console.log(` Cifrado en reposo AES-256-GCM activo · Modo DEMO LOCAL`);
    console.log(`===============================================================================`);
  })
  .catch((err) => {
    console.error("[LocalS3Service] Error iniciando servicio:", err);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  console.log("\n[LocalS3Service] Deteniendo servicio...");
  await s3.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[LocalS3Service] Deteniendo servicio...");
  await s3.stop();
  process.exit(0);
});
