/**
 * scripts/generate-article-images.ts
 *
 * Dedicated FINTERA Creative Pipeline script that generates a unique, bespoke
 * editorial cover image for every article in SEEDED_FINTERA_INSIGHTS using Qwen Image 3.0 API.
 * Ensures the 4 Pillar cover images (/images/pillars/*) are used EXCLUSIVELY for Pillar cards
 * and never recycled across individual articles.
 */

import fs from "fs";
import path from "path";

for (const envFile of [
  "/home/sebastiangarcia/.hermes/.env",
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), ".env"),
]) {
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

interface ArticleCreativeSpec {
  id: string;
  fileName: string;
  title: string;
  prompt: string;
}

const ARTICLE_CREATIVE_SPECS: ArticleCreativeSpec[] = [
  {
    id: "fintera_wp_01_vivienda",
    fileName: "fintera_wp_01_vivienda.png",
    title: "Crédito de vivienda en Colombia: cómo evaluar las alternativas de financiación",
    prompt:
      "Ultra-clean editorial architectural photography for FINTERA Soluciones Financieras in Colombia. A sunlit modern residential apartment terrace overlooking the Bogotá skyline and mountains at golden hour. In the foreground on a sleek dark walnut and glass table rests a minimalist architectural scale model of a contemporary home illuminated by warm ambient light, beside a tablet displaying subtle cyan (#1DB7D6) and royal blue (#1A6CC9) financial clarity curves on a deep navy (#112F4E) interface. Sophisticated, institutional, no text, no watermarks, no logos.",
  },
  {
    id: "fintera_wp_02_factoring",
    fileName: "fintera_wp_02_factoring.png",
    title: "Liquidez empresarial: alternativas para financiar el crecimiento sin esperar el pago de las facturas",
    prompt:
      "High-end corporate B2B editorial photography in Colombia for FINTERA. A confident Colombian female CFO and an operations director walking through a bright, ultra-modern industrial logistics and manufacturing plant with clean high-bay shelving. They review a sleek glass tablet showing emerald-teal (#1CC5A3) and cyan (#1DB7D6) working-capital liquidity flows. Deep navy (#112F4E) blazers, natural daylight, cinematic depth of field, no text, no watermarks.",
  },
  {
    id: "fintera_webinar_01_vivienda",
    fileName: "fintera_webinar_01_vivienda.png",
    title: "Webinar 01 · ¿Cómo elegir un crédito de vivienda sin fijarse únicamente en la tasa?",
    prompt:
      "Executive financial broadcast studio in Colombia for FINTERA Soluciones Financieras. A senior financial advisor in a tailored navy (#112F4E) blazer seated in a sleek glass-walled acoustic studio with warm oak slats, gesturing toward a large minimalist LED screen displaying two clean comparative mortgage curves in cyan (#1DB7D6) and warm amber (#F3B63F) without any text or letters. Professional studio lighting, shallow depth of field, no text, no logos.",
  },
  {
    id: "fintera_webinar_02_factoring",
    fileName: "fintera_webinar_02_factoring.png",
    title: "Webinar 02 · Factoring en Colombia: cómo convertir cuentas por cobrar en liquidez",
    prompt:
      "Modern corporate boardroom in Medellín Colombia at dusk for a FINTERA B2B executive session. Three business leaders gathered around a polished conference table with a glowing translucent glass display showing abstract interconnected invoice nodes turning into fluid turquoise (#1CC5A3) and cyan (#1DB7D6) streams against deep navy (#112F4E). Warm architectural lighting, photorealistic editorial style, no text, no letters, no watermarks.",
  },
  {
    id: "fintera_case_01_costo_esperar_facturas",
    fileName: "fintera_case_01_costo_esperar_facturas.png",
    title: "Caso práctico: Cómo una empresa puede evaluar el costo de esperar el pago de sus facturas",
    prompt:
      "Editorial financial still-life photography for FINTERA Colombia. Close-up on a dark navy (#112F4E) executive desk: a precision brushed-steel chronometer stopwatch next to an industrial engineering blueprint roll and an ultra-thin laptop showing a luminous 30-60-90 day cash-flow wave in emerald-teal (#1CC5A3) and amber (#F3B63F). Crisp studio lighting, refined corporate aesthetic, no text, no numbers, no watermarks.",
  },
  {
    id: "fintera_guide_01_cinco_variables_hipotecarias",
    fileName: "fintera_guide_01_cinco_variables_hipotecarias.png",
    title: "Guía práctica: Antes de solicitar un crédito hipotecario en Colombia, revisa estas 5 variables y tu carpeta documental",
    prompt:
      "Overhead editorial flat-lay photography on a warm natural oak table for FINTERA Soluciones Financieras. A neatly organized deep navy (#112F4E) leather document portfolio, a modern brushed-brass house key on a minimalist geometric keychain, a sleek fountain pen, and a tablet glowing with five clean cyan (#1DB7D6) and green (#1CC5A3) progress bars. Soft morning window light, high-trust institutional composition, no text, no logos.",
  },
  {
    id: "fintera_post_01_vender_mas_vs_liquidez",
    fileName: "fintera_post_01_vender_mas_vs_liquidez.png",
    title: "Vender más no siempre significa tener más liquidez: el impacto de las cuentas por cobrar en el flujo de caja",
    prompt:
      "Museum-grade 3D architectural glassmorphism sculpture for FINTERA financial analysis. On a deep navy (#112F4E) studio pedestal, tall frosted royal-blue (#1A6CC9) vertical columns representing sales volume intersect with a luminous flowing river of emerald-teal (#1CC5A3) and cyan (#1DB7D6) light representing real cash liquidity, accented by a single golden-amber (#F3B63F) equilibrium sphere. Ultra-clean fintech art direction, no text, no numbers.",
  },
  {
    id: "fintera_tutorial_01_que_hace_fintera_carrusel",
    fileName: "fintera_tutorial_01_que_hace_fintera_carrusel.png",
    title: "Carrusel Institucional: ¿Qué hace FINTERA y cómo acompañamos las decisiones de financiación?",
    prompt:
      "Warm, high-trust editorial photography in a contemporary Colombian financial advisory lounge for FINTERA. A friendly, poised FINTERA advisor in a smart navy (#112F4E) jacket conversing across a light wood table with a smiling couple in their 30s, with subtle cyan (#1DB7D6) architectural glass partitions and indoor greenery in the background. Natural sunlight, human warmth + technical clarity, no text, no watermarks.",
  },
  {
    id: "fintera_post_02_tasas_sfc_vis_no_vis_pesos_uvr",
    fileName: "fintera_post_02_tasas_sfc_vis_no_vis_pesos_uvr.png",
    title: "Reporte de tasas de interés efectivas anuales para adquisición de vivienda VIS y No VIS (Pesos y UVR): qué evaluar más allá del indicador",
    prompt:
      "Architectural editorial photography of two distinct modern Colombian residential developments—a vibrant family residential complex and a sleek high-rise brick-and-glass tower—seen through a crystal optical prism on a foreground balcony ledge that refracts cyan (#1DB7D6), royal blue (#1A6CC9), and amber (#F3B63F) light. Clear morning sky, institutional real-estate finance aesthetic, no text, no watermarks.",
  },
  {
    id: "fintera_post_03_lineamientos_radian_dian_factoring",
    fileName: "fintera_post_03_lineamientos_radian_dian_factoring.png",
    title: "Lineamientos técnicos del registro RADIAN y eventos obligatorios para que la factura electrónica sea título valor negociable",
    prompt:
      "High-end fintech editorial visualization for FINTERA Colombia. Three sequential crystalline glass gateways standing on a polished dark navy (#112F4E) surface, connected by a laser-sharp beam of cyan (#1DB7D6) and emerald-teal (#1CC5A3) light that transforms a translucent digital document sheet into a glowing golden-amber (#F3B63F) security token. Precision macro lighting, institutional authority, no text, no letters, no watermarks.",
  },
  {
    id: "fintera_social_01_evaluando_vivienda_o_flujo_caja",
    fileName: "fintera_social_01_evaluando_vivienda_o_flujo_caja.png",
    title: "¿Estás evaluando comprar vivienda o mejorar el flujo de caja de tu empresa? Preguntas clave antes de iniciar",
    prompt:
      "Split-diopter editorial photography for FINTERA Soluciones Financieras in Colombia. On the left side, a warm sunlit modern living room with a couple reviewing home floorplans; on the right side, a sleek B2B glass office where an entrepreneur reviews supply-chain operations; both scenes unified by a central architectural navy (#112F4E) and cyan (#1DB7D6) glass atrium. Balanced, cinematic, no text, no logos.",
  },
  {
    id: "fintera_post_04_que_mirar_ademas_de_la_tasa",
    fileName: "fintera_post_04_que_mirar_ademas_de_la_tasa.png",
    title: "Qué mirar además de la tasa de interés al comparar alternativas de financiación en Colombia",
    prompt:
      "Macro studio editorial photography for FINTERA Colombia. A precision optical glass magnifying lens resting over a sleek dark navy (#112F4E) surface, revealing multi-layered concentric geometric rings in royal blue (#1A6CC9), cyan (#1DB7D6), emerald (#1CC5A3), and warm amber (#F3B63F) symbolizing holistic financial evaluation beyond interest rates. Clean, luxurious fintech design, no text, no numbers, no watermarks.",
  },
];

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function generateSingleImage(spec: ArticleCreativeSpec, outDir: string) {
  const outPath = path.join(outDir, spec.fileName);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 50_000) {
    console.log(`⏭️  Skipping [${spec.id}] (already exists: ${spec.fileName})`);
    return;
  }

  const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
  const baseUrl =
    process.env.QWEN_BASE_URL ||
    "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1";
  const dashscopeHost = baseUrl.replace(/\/compatible-mode\/v1\/?$/, "");
  const model = process.env.QWEN_IMAGE_MODEL || "qwen-image-3.0";

  if (!apiKey) {
    throw new Error("Missing QWEN_API_KEY / DASHSCOPE_API_KEY");
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🎨 Generating [${spec.id}] (attempt ${attempt}) -> ${spec.fileName} ...`);
      let imageUrl = "";

      const mmRes = await fetchWithTimeout(
        `${dashscopeHost}/api/v1/services/aigc/multimodal-generation/generation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            input: {
              messages: [
                {
                  role: "user",
                  content: [{ text: spec.prompt }],
                },
              ],
            },
            parameters: {
              size: "1280*720",
              n: 1,
            },
          }),
        },
        75000
      );

      if (mmRes.ok) {
        const data = await mmRes.json();
        const contentArr = data?.output?.choices?.[0]?.message?.content || [];
        const imgObj = contentArr.find(
          (c: { image?: string }) => typeof c?.image === "string"
        );
        if (imgObj?.image) {
          imageUrl = imgObj.image;
        }
      } else {
        const errText = await mmRes.text();
        console.warn(`  ⚠️ [${spec.id}] HTTP ${mmRes.status}: ${errText.slice(0, 140)}`);
      }

      if (!imageUrl) {
        throw new Error(`No imageUrl returned for ${spec.id}`);
      }

      const imgDownload = await fetchWithTimeout(imageUrl, {}, 20000);
      if (!imgDownload.ok) {
        throw new Error(`Download failed ${imgDownload.status}`);
      }
      const buffer = Buffer.from(await imgDownload.arrayBuffer());
      fs.writeFileSync(outPath, buffer);
      console.log(`  ✔ Saved ${spec.fileName} (${(buffer.length / 1024).toFixed(1)} KB)`);
      return;
    } catch (err) {
      console.warn(`  ↻ Retry [${spec.id}] attempt ${attempt} failed:`, (err as Error).message);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw new Error(`Failed after 3 attempts: ${spec.id}`);
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "images", "insights");
  fs.mkdirSync(outDir, { recursive: true });

  for (const spec of ARTICLE_CREATIVE_SPECS) {
    await generateSingleImage(spec, outDir);
  }
  console.log("✅ All 12 unique article cover images generated in public/images/insights/");
}

main().catch((err) => {
  console.error("❌ Error generating article images:", err);
  process.exit(1);
});
