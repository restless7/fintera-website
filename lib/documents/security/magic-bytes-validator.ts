/**
 * FASE 6.4: GATE E — MAGIC BYTES VALIDATOR & CONTENT INSPECTION
 * Validación binaria estricta de formatos reales para evitar extensiones falseadas y polyglots
 */

export interface FileValidationResult {
  isValid: boolean;
  detectedMimeType: string;
  detectedExtension: string;
  error?: string;
  isPolyglot?: boolean;
}

export class MagicBytesValidator {
  /**
   * Firmas mágicas binarias oficiales
   */
  private static readonly SIGNATURES = {
    // PDF: %PDF-
    PDF: [0x25, 0x50, 0x44, 0x46, 0x2D],
    // JPEG: FF D8 FF
    JPEG: [0xFF, 0xD8, 0xFF],
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    // Executables peligrosos a rechazar de inmediato
    PE_EXE: [0x4D, 0x5A], // Windows MZ
    ELF_EXE: [0x7F, 0x45, 0x4C, 0x46], // Linux ELF
    ZIP_ARCHIVE: [0x50, 0x4B, 0x03, 0x04], // ZIP / JAR
  };

  /**
   * Inspecciona el buffer completo para determinar el tipo binario real
   */
  public static validateBuffer(buffer: Buffer, declaredMimeType?: string): FileValidationResult {
    if (!buffer || buffer.length === 0) {
      return {
        isValid: false,
        detectedMimeType: "application/octet-stream",
        detectedExtension: "bin",
        error: "El archivo está vacío (0 bytes)",
      };
    }

    // 1. Detección de ejecutables maliciosos camuflados
    if (this.matchesSignature(buffer, this.SIGNATURES.PE_EXE)) {
      return {
        isValid: false,
        detectedMimeType: "application/x-msdownload",
        detectedExtension: "exe",
        error: "Archivo ejecutable Windows detectado (MZ Header). Carga bloqueada por seguridad.",
      };
    }

    if (this.matchesSignature(buffer, this.SIGNATURES.ELF_EXE)) {
      return {
        isValid: false,
        detectedMimeType: "application/x-elf",
        detectedExtension: "elf",
        error: "Binario ejecutable Linux detectado (ELF Header). Carga bloqueada por seguridad.",
      };
    }

    // 2. Detección de PDF real
    if (this.matchesSignature(buffer, this.SIGNATURES.PDF)) {
      // Validar estructura básica de PDF: no debe contener firmas ejecutables posteriores
      const hasSuspiciousScript = buffer.includes(Buffer.from("<script", "ascii")) ||
                                  buffer.includes(Buffer.from("javascript:", "ascii"));
      
      return {
        isValid: true,
        detectedMimeType: "application/pdf",
        detectedExtension: "pdf",
        isPolyglot: hasSuspiciousScript,
        error: hasSuspiciousScript ? "PDF contiene scripting activo sospechoso" : undefined,
      };
    }

    // 3. Detección de JPEG
    if (this.matchesSignature(buffer, this.SIGNATURES.JPEG)) {
      return {
        isValid: true,
        detectedMimeType: "image/jpeg",
        detectedExtension: "jpg",
      };
    }

    // 4. Detección de PNG
    if (this.matchesSignature(buffer, this.SIGNATURES.PNG)) {
      return {
        isValid: true,
        detectedMimeType: "image/png",
        detectedExtension: "png",
      };
    }

    // 5. No coincide con ningún tipo permitido
    return {
      isValid: false,
      detectedMimeType: "application/octet-stream",
      detectedExtension: "bin",
      error: "Tipo de archivo no permitido. Solo se admiten documentos PDF, JPEG y PNG auténticos.",
    };
  }

  private static matchesSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) return false;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false;
    }
    return true;
  }
}
