import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminApi } from "@/lib/auth/admin-api";
import {
  getFinteraContentByIdOrSlug,
  upsertFinteraContent,
} from "@/lib/blog";
import { generateFinteraCreativeImage } from "@/lib/services/ai-generation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authorization = await authorizeAdminApi("crm:application:read");
  if (authorization.response) return authorization.response;

  try {
    const body = await req.json();
    const { id, action, prompt, imageUrl, setAsCover, size } = body || {};

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

      const existing = getFinteraContentByIdOrSlug(id);
      if (!existing) {
        return NextResponse.json(
          { error: "Pieza editorial no encontrada" },
          { status: 404 }
        );
      }

      const newAsset = {
        url: imageUrl.trim(),
        prompt: prompt?.trim() || "Pieza creativa adjunta manualmente",
        model: "Adjunto Manual / Studio",
        createdAt: new Date().toISOString(),
      };

      const existingAssets = Array.isArray(existing.creativeAssets)
        ? existing.creativeAssets
        : [];

      const updatedItem = await upsertFinteraContent({
        ...existing,
        coverImage:
          setAsCover !== false ? imageUrl.trim() : existing.coverImage,
        imagePrompt: prompt?.trim() || existing.imagePrompt,
        creativeAssets: [
          newAsset,
          ...existingAssets.filter((a) => a.url !== imageUrl.trim()),
        ],
      });

      return NextResponse.json({
        success: true,
        imageUrl: imageUrl.trim(),
        modelUsed: "Adjunto Manual / Studio",
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

