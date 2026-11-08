import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import {
  getFinteraContentByIdOrSlug,
  upsertFinteraContent,
} from "@/lib/blog";
import { generateFinteraCreativeImage } from "@/lib/services/ai-generation";
import { FINTERA_BRAND_ASSET_REGISTRY } from "@/lib/brand-assets";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const { id, action, prompt, imageUrl, setAsCover, size, assetId } = body || {};

    // Mode 1: Attach an external URL or uploaded Data URI directly to the article
    if (action === "attach") {
      if (!id || !imageUrl?.trim()) {
        return NextResponse.json(
          {
            error:
              "Se requiere el identificador de la pieza (id) y la URL o imagen adjunta (imageUrl).",
          },
          { status: 400 }
        );
      }

      // Role Governance Enforcement (R1.1-05)
      const cleanUrl = imageUrl.trim();
      if (
        cleanUrl.startsWith("/images/pillars/") ||
        cleanUrl.startsWith("/images/brand-system/pillars/")
      ) {
        return NextResponse.json(
          {
            error:
              "Gobernanza de Marca (Regla de No-Reciclaje): Las portadas de los 4 Pilares Institucionales están estrictamente reservadas para cabeceras de categoría y no pueden asignarse a artículos individuales.",
          },
          { status: 422 }
        );
      }

      let matchedRegistryAsset = null;
      if (assetId) {
        matchedRegistryAsset = FINTERA_BRAND_ASSET_REGISTRY.find(
          (a) => a.id === assetId
        );
        if (matchedRegistryAsset && matchedRegistryAsset.role === "PILLAR_COVER") {
          return NextResponse.json(
            {
              error:
                "Gobernanza de Marca: El activo seleccionado tiene el rol PILLAR_COVER, reservado exclusivamente para la arquitectura de pilares.",
            },
            { status: 422 }
          );
        }
      }

      const existing = getFinteraContentByIdOrSlug(id);
      if (!existing) {
        return NextResponse.json(
          { error: "Pieza editorial no encontrada" },
          { status: 404 }
        );
      }

      const newAsset = {
        url: cleanUrl,
        prompt:
          prompt?.trim() ||
          matchedRegistryAsset?.title ||
          "Pieza creativa adjunta manualmente",
        model: matchedRegistryAsset
          ? `Marca · ${matchedRegistryAsset.role}`
          : "Adjunto Manual / Studio",
        assetId: matchedRegistryAsset?.id,
        createdAt: new Date().toISOString(),
      };

      const existingAssets = Array.isArray(existing.creativeAssets)
        ? existing.creativeAssets
        : [];

      const updatedItem = await upsertFinteraContent({
        ...existing,
        coverImage: setAsCover !== false ? cleanUrl : existing.coverImage,
        imagePrompt: prompt?.trim() || existing.imagePrompt,
        creativeAssets: [
          newAsset,
          ...existingAssets.filter((a) => a.url !== cleanUrl),
        ],
      });

      return NextResponse.json({
        success: true,
        imageUrl: cleanUrl,
        modelUsed: newAsset.model,
        item: updatedItem,
      });
    }

    // Mode 2: Generate a Brand-Aligned Creative Image using Qwen Image 3.0 API
    const result = await generateFinteraCreativeImage({
      idOrSlug: id,
      prompt,
      setAsCover: setAsCover !== false,
      size: size || "1024x1024",
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      promptUsed: result.promptUsed,
      modelUsed: result.modelUsed,
      item: result.item,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al generar o adjuntar pieza gráfica";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

