/** Real ClamAV VERSION + INSTREAM inspection. Any unavailable, stale or malformed
 * engine response retains the document. PDF active-content checks reject content;
 * they do not reconstruct or sanitize a PDF. */
import net from "net";

export interface AntivirusScanResult {
  isClean: boolean;
  threatName?: string;
  scannerEngine: string;
  scanDurationMs: number;
  details?: string;
  isEngineVerified?: boolean;
}
export interface AntivirusScannerOptions {
  host?: string;
  port?: number;
  timeoutMs?: number;
  forceOffline?: boolean;
  forceTimeout?: boolean;
}
export interface ClamAvEngineStatus {
  isOnline: boolean;
  versionString: string;
  host: string;
  port: number;
  signaturesCount?: number;
  databaseVersion?: number;
  signaturesBuiltAt?: string;
  error?: string;
}

export class AntivirusScanner {
  private static readonly DEFAULT_HOST = process.env.CLAMAV_HOST || "127.0.0.1";
  private static readonly DEFAULT_PORT = Number(process.env.CLAMAV_PORT || "3310");
  // Daily signatures may span a weekend interruption; beyond 72 hours scans stop.
  // A definition timestamp over 15 minutes ahead also fails closed (clock skew).
  private static readonly MAX_SIGNATURE_AGE_MS = 72 * 60 * 60 * 1000;
  private static readonly MAX_FUTURE_SKEW_MS = 15 * 60 * 1000;

  public static async getEngineStatus(options: AntivirusScannerOptions = {}): Promise<ClamAvEngineStatus> {
    const host = options.host || this.DEFAULT_HOST;
    const port = options.port || this.DEFAULT_PORT;
    let versionString = "ClamAV-Unavailable";
    try {
      if (options.forceOffline) throw new Error("SCANNER_UNAVAILABLE");
      if (options.forceTimeout) throw new Error("SCANNER_TIMEOUT");
      versionString = await this.request(host, port, options.timeoutMs || 3000, "VERSION");
      const match = /^ClamAV (\d+\.\d+\.\d+(?:[-\w.]*)?)\/(\d+)\/([A-Z][a-z]{2} [A-Z][a-z]{2}\s+\d{1,2} \d{2}:\d{2}:\d{2} \d{4})$/.exec(versionString);
      if (!match) throw new Error("SCANNER_VERSION_INVALID");
      const builtAt = Date.parse(`${match[3]} UTC`);
      const age = Date.now() - builtAt;
      if (!Number.isFinite(builtAt) || age > this.MAX_SIGNATURE_AGE_MS || age < -this.MAX_FUTURE_SKEW_MS) throw new Error("SCANNER_SIGNATURES_STALE_OR_CLOCK_INVALID");
      const databaseVersion = Number(match[2]);
      if (!Number.isSafeInteger(databaseVersion) || databaseVersion <= 0) throw new Error("SCANNER_DATABASE_VERSION_INVALID");
      return { isOnline: true, versionString, host, port, databaseVersion, signaturesBuiltAt: new Date(builtAt).toISOString() };
    } catch (error) {
      return { isOnline: false, versionString, host, port, error: error instanceof Error ? error.message : "SCANNER_UNAVAILABLE" };
    }
  }

  public static async scanFile(fileBuffer: Buffer, options: AntivirusScannerOptions = {}): Promise<AntivirusScanResult> {
    const started = Date.now();
    let scannerEngine = "ClamAV-Unverified";
    const denied = (threatName: string, details: string, verified = false): AntivirusScanResult => ({ isClean: false, threatName, scannerEngine, scanDurationMs: Date.now() - started, details, isEngineVerified: verified });
    if (!fileBuffer?.length) return denied("EMPTY_PAYLOAD", "El archivo está vacío.");
    if (options.forceOffline) return denied("SCANNER_UNAVAILABLE_FAIL_CLOSED", "El verificador no está disponible.");
    if (options.forceTimeout) return denied("SCANNER_TIMEOUT_FAIL_CLOSED", "La verificación excedió el tiempo permitido.");
    try {
      const status = await this.getEngineStatus(options);
      scannerEngine = status.versionString;
      if (!status.isOnline) return denied("SCANNER_UNAVAILABLE_FAIL_CLOSED", "No fue posible verificar el motor y la vigencia de sus firmas.");
      const response = await this.request(status.host, status.port, options.timeoutMs || 15000, "INSTREAM", fileBuffer);
      if (response !== "stream: OK") {
        const infected = /^stream: (.+) FOUND$/.exec(response);
        if (infected) return denied(infected[1], "El motor antivirus detectó una amenaza.", true);
        return denied("SCANNER_ERROR_FAIL_CLOSED", "El verificador devolvió una respuesta inválida.");
      }
      const content = fileBuffer.toString("latin1");
      const activeContent = [
        { pattern: /\/Launch\b/i, threat: "Exploit.PDF.ActiveContent.LaunchCommand" },
        { pattern: /\/JavaScript\b/i, threat: "Trojan.PDF.ActiveContent.EmbeddedJavaScript" },
        { pattern: /\/JS\s*\(/i, threat: "Trojan.PDF.ActiveContent.EmbeddedJavaScript" },
        { pattern: /\/EmbeddedFiles\b/i, threat: "Heuristic.PDF.HiddenPayload" },
      ];
      for (const check of activeContent) if (check.pattern.test(content)) return denied(check.threat, "Se rechazó contenido activo sospechoso. El archivo no fue modificado.", true);
      return { isClean: true, scannerEngine, scanDurationMs: Date.now() - started, details: "ClamAV no detectó amenazas; la comprobación de contenido activo no detectó patrones prohibidos.", isEngineVerified: true };
    } catch {
      return denied("SCANNER_ERROR_FAIL_CLOSED", "La verificación no pudo completarse. El documento permanece retenido.");
    }
  }

  private static request(host: string, port: number, timeoutMs: number, command: "VERSION" | "INSTREAM", buffer?: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let settled = false;
      let response = Buffer.alloc(0);
      const finish = (error?: Error, value?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        socket.destroy();
        if (error) reject(error); else resolve(value!);
      };
      const deadline = setTimeout(() => finish(new Error("SCANNER_TIMEOUT")), timeoutMs);
      socket.on("error", () => finish(new Error("SCANNER_SOCKET_ERROR")));
      socket.on("end", () => finish(new Error("SCANNER_INCOMPLETE_RESPONSE")));
      socket.on("close", () => { if (!settled) finish(new Error("SCANNER_CONNECTION_CLOSED")); });
      socket.on("data", chunk => {
        response = Buffer.concat([response, chunk]);
        if (response.length > 65536) return finish(new Error("SCANNER_RESPONSE_TOO_LARGE"));
        const end = response.indexOf(0);
        if (end >= 0) {
          if (end !== response.length - 1) return finish(new Error("SCANNER_MULTIPLE_RESPONSES"));
          finish(undefined, response.subarray(0, end).toString("utf8"));
        }
      });
      socket.connect(port, host, async () => {
        const write = (data: Buffer | string) => new Promise<void>((done, fail) => socket.write(data, error => error ? fail(error) : done()));
        try {
          await write(`z${command}\0`);
          if (buffer) {
            for (let offset = 0; offset < buffer.length; offset += 65536) {
              const chunk = buffer.subarray(offset, offset + 65536);
              const length = Buffer.alloc(4); length.writeUInt32BE(chunk.length);
              await write(length); await write(chunk);
            }
            await write(Buffer.alloc(4));
          }
        } catch { finish(new Error("SCANNER_WRITE_ERROR")); }
      });
    });
  }
}
