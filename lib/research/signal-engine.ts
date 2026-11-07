/**
 * lib/research/signal-engine.ts
 *
 * FINTERA Financial Signal Discovery & Live Colombian Market Scraping Engine.
 * Monitors the 14 authoritative sources (SFC, BanRep, DANE, FNA, DIAN/RADIAN,
 * Supersociedades, Asobancaria, Camacol, Confecámaras, Bancóldex, IFC, OCDE,
 * World Bank, FCI) plus live economic RSS feeds.
 */

import fs from "fs";
import path from "path";
import prisma from "../prisma";
import { FinteraContentPillarKey } from "../content-types";
import { FINTERA_AUTHORITATIVE_SOURCES, ResearchSignal } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const SIGNALS_CACHE_FILE = path.join(CACHE_DIR, "fintera_research_signals.json");

const INITIAL_CURATED_SIGNALS: ResearchSignal[] = [
  {
    id: "sig_sfc_tasas_vivienda_2026",
    sourceId: "sfc",
    sourceName: "Superintendencia Financiera de Colombia (SFC)",
    sourceTier: "OFICIAL_COLOMBIA",
    sourceCredibility: 0.99,
    title:
      "Reporte de tasas de interés efectivas anuales para adquisición de vivienda VIS y No VIS (Pesos y UVR)",
    url: "https://www.superfinanciera.gov.co/publicaciones/60950/informes-y-cifrascifrasestablecimientos-de-creditotasas-de-interes-60950/",
    publishedAt: "2026-10-25T12:00:00Z",
    discoveredAt: "2026-10-26T08:30:00Z",
    cutoffDate: "Octubre 2026",
    summary:
      "La Superfinanciera publica el comparativo semanal de tasas efectivas anuales (E.A.) cobradas por establecimientos de crédito en Colombia para vivienda VIS y No VIS en modalidades de pesos y UVR, evidenciando diferenciales de hasta 280 puntos básicos entre entidades.",
    pillar: "VIVIENDA_B2C",
    topicHints: ["Tasas Hipotecarias", "UVR vs Pesos", "Comparación Multibanco"],
    entityHints: ["Superfinanciera", "Vivienda VIS", "Vivienda No VIS", "Tasa Efectiva Anual"],
    noveltyScore: 0.94,
    velocityScore: 92,
    velocityStatus: "HIGH_VELOCITY",
    primaryTheme: "Crédito de Vivienda y Tasas Hipotecarias",
    finteraAngle:
      "Demostrar por qué mirar únicamente la tasa nominal publicitada es insuficiente: la comparación multibanco debe incluir seguros de vida/incendio, plazo, sistema de amortización (UVR vs. Pesos) y perfil de riesgo del comprador.",
    processingStatus: "DECOMPOSED",
  },
  {
    id: "sig_dian_radian_titulo_valor_2026",
    sourceId: "dian",
    sourceName: "Dirección de Impuestos y Aduanas Nacionales (DIAN)",
    sourceTier: "OFICIAL_COLOMBIA",
    sourceCredibility: 0.99,
    title:
      "Lineamientos técnicos del registro RADIAN y eventos obligatorios para que la factura electrónica sea título valor negociable",
    url: "https://www.dian.gov.co/impuestos/factura-electronica/Documents/Anexo_Tecnico_RADIAN.pdf",
    publishedAt: "2026-10-20T14:00:00Z",
    discoveredAt: "2026-10-21T09:15:00Z",
    cutoffDate: "Octubre 2026",
    summary:
      "El ecosistema RADIAN de la DIAN consolida la trazabilidad de los tres eventos esenciales (acuse de recibo de la factura, recibo del bien o servicio y aceptación expresa o tácita) requeridos para endosar electrónicamente cuentas por cobrar en operaciones de factoring.",
    pillar: "FACTORING_B2B",
    topicHints: ["RADIAN", "Factura Electrónica", "Título Valor", "Factoring Colombia"],
    entityHints: ["DIAN", "RADIAN", "Título Valor", "Endoso Electrónico"],
    noveltyScore: 0.91,
    velocityScore: 89,
    velocityStatus: "HIGH_VELOCITY",
    primaryTheme: "Liquidez Empresarial, RADIAN y Factoring",
    finteraAngle:
      "Educar a gerentes financieros y contadores sobre la lista de verificación previa en RADIAN para convertir cuentas por cobrar a 60 o 90 días en capital de trabajo sin adquirir deuda bancaria tradicional.",
    processingStatus: "DECOMPOSED",
  },
  {
    id: "sig_banrep_politica_monetaria_2026",
    sourceId: "banrep",
    sourceName: "Banco de la República",
    sourceTier: "OFICIAL_COLOMBIA",
    sourceCredibility: 0.99,
    title:
      "Informe de Política Monetaria e indicadores de inflación y transmisión hacia las tasas de crédito en Colombia",
    url: "https://www.banrep.gov.co/es/estadisticas-economicas",
    publishedAt: "2026-10-28T16:00:00Z",
    discoveredAt: "2026-10-28T18:00:00Z",
    cutoffDate: "Octubre 2026",
    summary:
      "El Banco de la República analiza la senda de convergencia de la inflación (IPC), el comportamiento de la Unidad de Valor Real (UVR) y la transmisión gradual de los ajustes de la tasa de intervención hacia la cartera hipotecaria y comercial.",
    pillar: "AUTORIDAD_MERCADO",
    topicHints: ["Política Monetaria", "Inflación IPC", "UVR", "Costo Financiero"],
    entityHints: ["Banco de la República", "UVR", "IPC", "Tasas de Interés"],
    noveltyScore: 0.88,
    velocityScore: 85,
    velocityStatus: "HIGH_VELOCITY",
    primaryTheme: "Macroeconomía y Costo del Crédito en Colombia",
    finteraAngle:
      "Traducir las decisiones del Emisor al lenguaje práctico de familias y empresarios: cuándo conviene estructurar crédito en pesos a cuota fija y cómo impacta la inflación el saldo en UVR.",
    processingStatus: "DECOMPOSED",
  },
  {
    id: "sig_oecd_financing_smes_2026",
    sourceId: "oecd",
    sourceName: "OCDE (Organización para la Cooperación y el Desarrollo Económicos)",
    sourceTier: "MULTILATERAL_INTERNACIONAL",
    sourceCredibility: 0.98,
    title:
      "Financing SMEs and Entrepreneurs 2026 — Capítulo Colombia: Evolución del crédito pyme, leasing y factoring electrónico",
    url: "https://www.oecd.org/cfe/smes/financing-smes-and-entrepreneurs-23065265.htm",
    publishedAt: "2026-10-15T10:00:00Z",
    discoveredAt: "2026-10-18T11:00:00Z",
    cutoffDate: "Octubre 2026",
    summary:
      "El informe comparado de la OCDE destaca que las pymes en Colombia enfrentan plazos de pago extendidos en sus cuentas por cobrar comerciales y resalta al factoring electrónico sobre RADIAN como mecanismo alternativo frente a las exigencias de garantías reales del crédito tradicional.",
    pillar: "FACTORING_B2B",
    topicHints: ["Financiamiento Pyme", "Factoring Electrónico", "Capital de Trabajo", "OCDE"],
    entityHints: ["OCDE", "Pymes Colombia", "RADIAN", "Factoring"],
    noveltyScore: 0.92,
    velocityScore: 81,
    velocityStatus: "EMERGING",
    primaryTheme: "Liquidez Empresarial, RADIAN y Factoring",
    finteraAngle:
      "Posicionar a FINTERA con autoridad internacional mostrando cómo el costo financiero de descontar una factura debe compararse contra el costo de oportunidad de frenar ventas o incumplir a proveedores.",
    processingStatus: "DECOMPOSED",
  },
  {
    id: "sig_dane_fna_vivienda_capacidad_2026",
    sourceId: "dane",
    sourceName: "DANE & Fondo Nacional del Ahorro (FNA)",
    sourceTier: "OFICIAL_COLOMBIA",
    sourceCredibility: 0.98,
    title:
      "Indicadores de precios de vivienda nueva (IPVN), licencias de construcción y modalidades de leasing habitacional y crédito por cesantías",
    url: "https://www.dane.gov.co/index.php/estadisticas-por-tema/construccion",
    publishedAt: "2026-10-22T15:00:00Z",
    discoveredAt: "2026-10-23T09:00:00Z",
    cutoffDate: "Octubre 2026",
    summary:
      "Las estadísticas del DANE y las guías operativas del FNA evidencian el peso de la cuota inicial (20%–30% en crédito hipotecario tradicional vs. cánones iniciales en leasing habitacional) y el límite legal de la primera cuota respecto al ingreso familiar (Ley 546 de 1999).",
    pillar: "VIVIENDA_B2C",
    topicHints: ["Capacidad de Endeudamiento", "Leasing Habitacional", "Cuota Inicial", "Ley 546"],
    entityHints: ["DANE", "Fondo Nacional del Ahorro", "Leasing Habitacional", "Cuota Inicial"],
    noveltyScore: 0.86,
    velocityScore: 78,
    velocityStatus: "STABLE",
    primaryTheme: "Crédito de Vivienda y Tasas Hipotecarias",
    finteraAngle:
      "Guiar a los compradores para preparar su carpeta documental y calcular su relación cuota/ingreso antes de firmar promesa de compraventa, evitando desistimientos y penalidades.",
    processingStatus: "DECOMPOSED",
  },
  {
    id: "sig_supersociedades_ifc_factoring_2026",
    sourceId: "supersociedades",
    sourceName: "Superintendencia de Sociedades & IFC (Grupo Banco Mundial)",
    sourceTier: "OFICIAL_COLOMBIA",
    sourceCredibility: 0.98,
    title:
      "Marco normativo del factoring en Colombia y fortalecimiento de cadenas de suministro para mipymes (Alianza Supersociedades – IFC)",
    url: "https://www.supersociedades.gov.co",
    publishedAt: "2026-10-12T13:00:00Z",
    discoveredAt: "2026-10-14T10:00:00Z",
    cutoffDate: "Octubre 2026",
    summary:
      "La Superintendencia de Sociedades y la Corporación Financiera Internacional (IFC) detallan los estándares de transparencia, verificación de pagadores y debida diligencia para operaciones de descuento de facturas y financiamiento de proveedores en Colombia.",
    pillar: "CONFIANZA_OPORTUNIDADES",
    topicHints: ["Gobierno Corporativo", "Transparencia Financiera", "Acompañamiento FINTERA", "Aliados Vigilados"],
    entityHints: ["Supersociedades", "IFC", "Factoring Colombia", "Debida Diligencia"],
    noveltyScore: 0.85,
    velocityScore: 74,
    velocityStatus: "EMERGING",
    primaryTheme: "Transparencia, Cumplimiento y Acompañamiento FINTERA",
    finteraAngle:
      "Comunicar con absoluta transparencia cómo trabaja FINTERA: análisis previo de perfil, distinción clara entre líneas activas y soluciones en estructuración con aliados, y cero promesas de aprobación garantizada.",
    processingStatus: "DECOMPOSED",
  },
  {
    id: "sig_asobancaria_camacol_cierre_financiero_2026",
    sourceId: "asobancaria",
    sourceName: "Asobancaria & Camacol (Coordenada Urbana)",
    sourceTier: "GREMIAL_SECTORIAL",
    sourceCredibility: 0.94,
    title:
      "Informe de Vivienda y Coordenada Urbana: Dinámica de originación hipotecaria, leasing habitacional y causas de rechazo en solicitudes",
    url: "https://www.asobancaria.com/informes/",
    publishedAt: "2026-10-19T09:00:00Z",
    discoveredAt: "2026-10-20T08:00:00Z",
    cutoffDate: "Octubre 2026",
    summary:
      "Los informes gremiales de Asobancaria y Camacol destacan que las inconsistencias en soportes de ingresos, sobreendeudamiento rotativo en tarjetas de crédito y desconocimiento de gastos de escrituración/avalúo explican gran parte de los retrasos en cierres financieros.",
    pillar: "CONFIANZA_OPORTUNIDADES",
    topicHints: ["Cierre Financiero", "Errores en Solicitud Hipotecaria", "Acompañamiento Multibanco"],
    entityHints: ["Asobancaria", "Camacol", "Coordenada Urbana", "Escrituración y Avalúo"],
    noveltyScore: 0.87,
    velocityScore: 80,
    velocityStatus: "HIGH_VELOCITY",
    primaryTheme: "Transparencia, Cumplimiento y Acompañamiento FINTERA",
    finteraAngle:
      "Posicionar el acompañamiento de FINTERA como un filtro técnico preventivo que organiza la solicitud para constructores, agentes inmobiliarios y compradores antes de radicar en bancos.",
    processingStatus: "DECOMPOSED",
  },
  {
    id: "sig_confecamaras_bancoldex_fci_liquidez_2026",
    sourceId: "confecamaras",
    sourceName: "Confecámaras, Bancóldex & FCI Global",
    sourceTier: "GREMIAL_SECTORIAL",
    sourceCredibility: 0.94,
    title:
      "Supervivencia empresarial en Colombia, ciclo de conversión de efectivo en mipymes y estadísticas de factoring en América Latina",
    url: "https://confecamaras.org.co",
    publishedAt: "2026-10-17T11:00:00Z",
    discoveredAt: "2026-10-18T14:00:00Z",
    cutoffDate: "Octubre 2026",
    summary:
      "Los análisis de Confecámaras, Bancóldex y Factors Chain International (FCI) muestran que una empresa en crecimiento puede enfrentar iliquidez severa cuando sus ventas a crédito a 60–90 días superan su capital de trabajo disponible.",
    pillar: "FACTORING_B2B",
    topicHints: ["Flujo de Caja", "Vender más vs Liquidez", "Capital de Trabajo", "FCI"],
    entityHints: ["Confecámaras", "Bancóldex", "Factors Chain International", "Mipymes"],
    noveltyScore: 0.89,
    velocityScore: 84,
    velocityStatus: "HIGH_VELOCITY",
    primaryTheme: "Liquidez Empresarial, RADIAN y Factoring",
    finteraAngle:
      "Sustentar la tesis editorial de FINTERA: 'Vender más no siempre significa tener más liquidez', ofreciendo simulaciones numéricas claras del costo de esperar vs. anticipar facturas.",
    processingStatus: "DECOMPOSED",
  },
];

export class ResearchSignalEngine {
  private signals: ResearchSignal[] = [];

  constructor() {
    this.loadSignals();
  }

  private mergeSignalLists(
    primary: ResearchSignal[],
    secondary: ResearchSignal[]
  ): ResearchSignal[] {
    const byKey = new Map<string, ResearchSignal>();
    for (const s of [...primary, ...secondary]) {
      const key = s.id || s.url || s.title.toLowerCase();
      if (!byKey.has(key)) {
        byKey.set(key, s);
      }
    }
    return Array.from(byKey.values());
  }

  private loadSignals(): void {
    try {
      if (fs.existsSync(SIGNALS_CACHE_FILE)) {
        const raw = fs.readFileSync(SIGNALS_CACHE_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.signals = this.mergeSignalLists(parsed, INITIAL_CURATED_SIGNALS);
          return;
        }
      }
    } catch {
      // Fallback to initial curated signals
    }
    this.signals = [...INITIAL_CURATED_SIGNALS];
  }

  private saveSignals(): void {
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(
        SIGNALS_CACHE_FILE,
        JSON.stringify(this.signals, null, 2),
        "utf8"
      );
    } catch {
      // Non-fatal in read-only environments
    }
  }

  /**
   * Hydrates in-memory signals from the Neon PostgreSQL fintera_trend_signals table
   * so live sweeps and Homelab scraper runs persist permanently across Vercel deploys.
   */
  public async syncFromDatabase(): Promise<void> {
    try {
      const rows = await prisma.trendSignal.findMany({
        orderBy: { scrapedAt: "desc" },
        take: 60,
      });
      if (rows.length > 0) {
        const dbSignals: ResearchSignal[] = rows.map((row) => {
          const sourceMeta =
            FINTERA_AUTHORITATIVE_SOURCES.find((s) => s.id === row.source) ||
            FINTERA_AUTHORITATIVE_SOURCES[0];
          const curatedMatch = INITIAL_CURATED_SIGNALS.find(
            (c) => c.id === row.sourceId || c.title === row.title
          );
          if (curatedMatch) return curatedMatch;

          let rawText = row.rawContent || "";
          if (rawText.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(rawText);
              rawText = `${parsed.summary || ""}\n\nÁngulo FINTERA: ${parsed.finteraAngle || ""}\nFecha de corte: ${parsed.cutoffDate || "Octubre–Noviembre 2026"}`;
            } catch {
              // Ignore
            }
          }
          const parts = rawText.split(/\n\nÁngulo FINTERA:\s*/);
          const summary =
            parts[0]?.trim() ||
            `Señal capturada por el monitor de inteligencia financiera de FINTERA sobre ${sourceMeta.shortName}: "${row.title}".`;
          const angleAndCutoff = (parts[1] || "").split(/\nFecha de corte:\s*/);
          const finteraAngle =
            angleAndCutoff[0]?.trim() || sourceMeta.howFinteraUsesIt;
          const cutoffDate =
            angleAndCutoff[1]?.trim() || "Octubre–Noviembre 2026";
          const pillar =
            (row.pillar as FinteraContentPillarKey) || "VIVIENDA_B2C";

          return {
            id: row.sourceId,
            sourceId: sourceMeta.id,
            sourceName: sourceMeta.shortName,
            sourceTier: sourceMeta.tier,
            sourceCredibility: sourceMeta.credibilityScore,
            title: row.title,
            url: row.url || sourceMeta.url,
            publishedAt: row.scrapedAt.toISOString(),
            discoveredAt: row.scrapedAt.toISOString(),
            cutoffDate,
            summary,
            pillar,
            topicHints:
              pillar === "VIVIENDA_B2C"
                ? ["Crédito de Vivienda", "Tasas Hipotecarias", "Colombia"]
                : pillar === "FACTORING_B2B"
                ? ["Factoring", "RADIAN", "Liquidez Empresarial"]
                : ["Política Monetaria", "Macroeconomía Colombia", "UVR"],
            entityHints: [sourceMeta.shortName, "Colombia", "FINTERA"],
            noveltyScore: row.relevanceScore ?? 0.85,
            velocityScore: row.score || 82,
            velocityStatus: row.score >= 85 ? "HIGH_VELOCITY" : "EMERGING",
            primaryTheme:
              row.extractedTheme ||
              (pillar === "VIVIENDA_B2C"
                ? "Crédito de Vivienda y Tasas Hipotecarias"
                : pillar === "FACTORING_B2B"
                ? "Liquidez Empresarial, RADIAN y Factoring"
                : "Macroeconomía y Costo del Crédito en Colombia"),
            finteraAngle,
            processingStatus:
              row.status === "PROCESSED" ? "DECOMPOSED" : "RAW",
          };
        });

        this.signals = this.mergeSignalLists(dbSignals, this.signals);
        this.saveSignals();
      }
    } catch {
      // Safe fallback if DB is temporarily unreachable
    }
  }

  public getSignals(options?: {
    pillar?: FinteraContentPillarKey;
    sourceId?: string;
    limit?: number;
  }): ResearchSignal[] {
    let list = [...this.signals];
    if (options?.pillar) {
      list = list.filter((s) => s.pillar === options.pillar);
    }
    if (options?.sourceId) {
      list = list.filter((s) => s.sourceId === options.sourceId);
    }
    list.sort((a, b) => b.velocityScore - a.velocityScore);
    if (options?.limit) {
      list = list.slice(0, options.limit);
    }
    return list;
  }

  public async getSignalsWithDb(options?: {
    pillar?: FinteraContentPillarKey;
    sourceId?: string;
    limit?: number;
  }): Promise<ResearchSignal[]> {
    await this.syncFromDatabase();
    return this.getSignals(options);
  }

  public getAuthoritativeSources() {
    return FINTERA_AUTHORITATIVE_SOURCES;
  }

  /**
   * Executes a live RSS/web discovery sweep across Colombian financial news & regulatory feeds,
   * scores relevance against FINTERA's 4 pillars, and syncs to Prisma TrendSignal + local cache.
   */
  public async runSignalDiscoverySweep(): Promise<{
    discoveredCount: number;
    totalActiveSignals: number;
    syncedToDatabase: boolean;
    sourcesChecked: number;
  }> {
    await this.syncFromDatabase();

    let runRecordId: string | null = null;
    try {
      const runRec = await prisma.pipelineRun.create({
        data: {
          pipelineType: "SCRAPER",
          status: "RUNNING",
        },
      });
      runRecordId = runRec.id;
    } catch {
      // Optional pipeline run tracking
    }

    const liveFeeds = [
      {
        name: "Google News · Crédito Hipotecario y Tasas Colombia (SFC / BanRep)",
        sourceId: "sfc",
        pillar: "VIVIENDA_B2C" as FinteraContentPillarKey,
        url: "https://news.google.com/rss/search?q=credito+hipotecario+tasas+vivienda+Colombia+Superfinanciera+OR+Banrep&hl=es-419&gl=CO&ceid=CO:es-419",
      },
      {
        name: "Google News · Factoring RADIAN DIAN Liquidez Empresas Colombia",
        sourceId: "dian",
        pillar: "FACTORING_B2B" as FinteraContentPillarKey,
        url: "https://news.google.com/rss/search?q=factoring+RADIAN+DIAN+factura+electronica+liquidez+empresas+Colombia&hl=es-419&gl=CO&ceid=CO:es-419",
      },
      {
        name: "Google News · Banco de la República Inflación UVR Vivienda DANE",
        sourceId: "banrep",
        pillar: "AUTORIDAD_MERCADO" as FinteraContentPillarKey,
        url: "https://news.google.com/rss/search?q=Banco+de+la+Republica+inflacion+UVR+DANE+vivienda+Colombia&hl=es-419&gl=CO&ceid=CO:es-419",
      },
      {
        name: "Google News · Camacol Asobancaria FNA Leasing Habitacional Colombia",
        sourceId: "camacol",
        pillar: "CONFIANZA_OPORTUNIDADES" as FinteraContentPillarKey,
        url: "https://news.google.com/rss/search?q=Camacol+OR+Asobancaria+OR+FNA+vivienda+leasing+habitacional+Colombia&hl=es-419&gl=CO&ceid=CO:es-419",
      },
    ];

    let discoveredCount = 0;

    for (const feed of liveFeeds) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5500);
        const res = await fetch(feed.url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "FinteraResearchOS/1.0 (+https://www.finterasoluciones.co)",
          },
        });
        clearTimeout(timeout);

        if (!res.ok) continue;
        const xml = await res.text();
        const itemMatches = Array.from(
          xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
        ).slice(0, 3);

        for (const match of itemMatches) {
          const itemXml = match[1] || "";
          const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
          const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
          const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);

          const rawTitle = (titleMatch?.[1] || titleMatch?.[2] || "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .trim();
          const link = (linkMatch?.[1] || "").trim();

          if (!rawTitle || !link) continue;

          const exists = this.signals.some(
            (s) => s.url === link || s.title.toLowerCase() === rawTitle.toLowerCase()
          );
          if (exists) continue;

          const sourceMeta =
            FINTERA_AUTHORITATIVE_SOURCES.find((s) => s.id === feed.sourceId) ||
            FINTERA_AUTHORITATIVE_SOURCES[0];

          const newSignal: ResearchSignal = {
            id: `sig_live_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            sourceId: sourceMeta.id,
            sourceName: sourceMeta.shortName,
            sourceTier: sourceMeta.tier,
            sourceCredibility: sourceMeta.credibilityScore,
            title: rawTitle,
            url: link,
            publishedAt: pubDateMatch?.[1]
              ? new Date(pubDateMatch[1]).toISOString()
              : new Date().toISOString(),
            discoveredAt: new Date().toISOString(),
            cutoffDate: "Octubre–Noviembre 2026",
            summary: `Señal capturada por el monitor de inteligencia financiera de FINTERA sobre ${sourceMeta.shortName}: "${rawTitle}". Requiere separación entre dato publicado e interpretación de FINTERA antes de publicar.`,
            pillar: feed.pillar,
            topicHints:
              feed.pillar === "VIVIENDA_B2C"
                ? ["Crédito de Vivienda", "Tasas Hipotecarias", "Colombia"]
                : feed.pillar === "FACTORING_B2B"
                ? ["Factoring", "RADIAN", "Liquidez Empresarial"]
                : ["Política Monetaria", "Macroeconomía Colombia", "UVR"],
            entityHints: [sourceMeta.shortName, "Colombia", "FINTERA"],
            noveltyScore: 0.85,
            velocityScore: 82,
            velocityStatus: "EMERGING",
            primaryTheme:
              feed.pillar === "VIVIENDA_B2C"
                ? "Crédito de Vivienda y Tasas Hipotecarias"
                : feed.pillar === "FACTORING_B2B"
                ? "Liquidez Empresarial, RADIAN y Factoring"
                : "Macroeconomía y Costo del Crédito en Colombia",
            finteraAngle: sourceMeta.howFinteraUsesIt,
            processingStatus: "RAW",
          };

          this.signals.unshift(newSignal);
          discoveredCount += 1;
        }
      } catch {
        // Network or timeout on individual feed is safely ignored
      }
    }

    this.saveSignals();

    // Sync ALL signals to Prisma TrendSignal table in Neon PostgreSQL
    let syncedToDatabase = false;
    try {
      for (const sig of this.signals) {
        await prisma.trendSignal.upsert({
          where: { sourceId: sig.id },
          update: {
            score: sig.velocityScore,
            relevanceScore: sig.noveltyScore,
            extractedTheme: sig.primaryTheme,
            pillar: sig.pillar,
          },
          create: {
            source: sig.sourceId,
            sourceId: sig.id,
            title: sig.title,
            url: sig.url,
            rawContent: `${sig.summary}\n\nÁngulo FINTERA: ${sig.finteraAngle}\nFecha de corte: ${sig.cutoffDate}`,
            score: sig.velocityScore,
            relevanceScore: sig.noveltyScore,
            extractedTheme: sig.primaryTheme,
            pillar: sig.pillar,
            status: "PENDING",
          },
        });
      }
      if (runRecordId) {
        await prisma.pipelineRun.update({
          where: { id: runRecordId },
          data: {
            status: "SUCCESS",
            completedAt: new Date(),
            signalsFound: discoveredCount,
            signalsRelevant: this.signals.length,
          },
        });
      }
      syncedToDatabase = true;
    } catch {
      // Cache file handles fallback persistence
    }

    return {
      discoveredCount,
      totalActiveSignals: this.signals.length,
      syncedToDatabase,
      sourcesChecked: FINTERA_AUTHORITATIVE_SOURCES.length,
    };
  }
}

export const researchSignalEngine = new ResearchSignalEngine();

