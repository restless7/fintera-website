import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { BankPolicyService } from "@/lib/simulators/policy-service";
import { BankId, CreditProductType } from "@/lib/simulators/types";
import { RbacService } from "@/lib/auth/rbac-service";
import { Permission } from "@/lib/auth/types";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * FASE 6.1 (GATE B): API DE ADMINISTRACIÓN DE POLÍTICAS BANCARIAS Y TARIFARIOS
 * Protegida estrictamente mediante Clerk RBAC/ABAC.
 * El bypass mediante llaves compartidas (x-fintera-admin-key) queda revocado.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get("bankId") as BankId | null;
    const view = searchParams.get("view"); // "configs" | "audit" | "history"
    const productType = searchParams.get("productType") as CreditProductType | null;

    // 1. Consulta de Auditoría (Requiere permiso crm:audit:read)
    if (view === "audit") {
      const { userId } = await auth();
      const authResult = await RbacService.authorize({
        permission: "crm:audit:read",
        clerkUserId: userId || undefined,
      });

      if (!authResult.authorized) {
        return NextResponse.json(
          { success: false, error: authResult.reason },
          { status: authResult.reason?.includes("no autenticado") ? 401 : 403 }
        );
      }

      const logs = await BankPolicyService.getAuditTrail(30);
      return NextResponse.json({ success: true, logs });
    }

    // 2. Consulta de Historial de Versiones (Requiere permiso crm:policy:read)
    if (view === "history" && bankId && productType) {
      const { userId } = await auth();
      const authResult = await RbacService.authorize({
        permission: "crm:policy:read",
        clerkUserId: userId || undefined,
      });

      if (!authResult.authorized) {
        return NextResponse.json(
          { success: false, error: authResult.reason },
          { status: authResult.reason?.includes("no autenticado") ? 401 : 403 }
        );
      }

      const history = await BankPolicyService.getVersionHistory(bankId, productType);
      return NextResponse.json({ success: true, history });
    }

    // 3. Consultas públicas de tarifario activo (Permitidas para alimentar el simulador oficial)
    if (bankId) {
      const config = await BankPolicyService.getActiveBankConfig(bankId);
      return NextResponse.json({ success: true, config });
    }

    const allConfigs = await BankPolicyService.getAllActiveConfigs();
    return NextResponse.json({ success: true, banks: allConfigs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al consultar políticas bancarias" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. RECHAZO EXPLÍCITO DE LLAVES COMPARTIDAS OBSOLETAS (Legacy Deprecation)
    if (req.headers.has("x-fintera-admin-key")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El método de autenticación por llave estática compartida (x-fintera-admin-key) ha sido revocado. Utilice una sesión de Clerk con rol RBAC empresarial asignado.",
        },
        { status: 403 }
      );
    }

    // 2. Identificación de la sesión Clerk
    const { userId } = await auth();
    const body = await req.json();
    const { action } = body;

    // 3. Mapeo de acción a permiso granular
    let requiredPermission: Permission = "crm:policy:propose";
    if (action === "approve_policy") {
      requiredPermission = "crm:policy:approve";
    } else if (action === "rollback") {
      requiredPermission = "crm:policy:rollback";
    } else if (action === "update_rate") {
      requiredPermission = "crm:policy:approve";
    }

    // 4. Verificación server-side con RbacService
    const authResult = await RbacService.authorize({
      permission: requiredPermission,
      clerkUserId: userId || undefined,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Next.js Route Handler",
    });

    if (!authResult.authorized) {
      const isUnauthenticated = !userId;
      return NextResponse.json(
        { success: false, error: authResult.reason },
        { status: isUnauthenticated ? 401 : 403 }
      );
    }

    const actor = authResult.authContext!;

    // 5. Acción: Proponer o Actualizar Tasa
    if (action === "update_rate" || action === "propose_rate") {
      const {
        bankId,
        productType,
        newRateEA,
        minRateEA,
        maxRateEA,
        sourceDocument,
        effectiveDate,
        version,
        changeReason,
        requireApproval,
      } = body;

      const updated = await BankPolicyService.updateProductRate({
        bankId,
        productType,
        newRateEA,
        minRateEA,
        maxRateEA,
        sourceDocument: sourceDocument || "Circular Oficial Entidad Bancaria",
        effectiveDate: effectiveDate || new Date().toISOString().split("T")[0],
        version,
        changeReason: changeReason || "Ajuste de tarifario bancario",
        performedBy: `${actor.firstName} ${actor.lastName} (${actor.email})`,
        requireApproval: requireApproval ?? (action === "propose_rate"),
      });

      return NextResponse.json({ success: true, policy: updated });
    }

    // 6. Acción: Aprobar Propuesta de Tasa (Flujo de 2 Pasos con Separación de Funciones)
    if (action === "approve_policy") {
      const { policyId } = body;
      if (!policyId) {
        return NextResponse.json(
          { success: false, error: "Identificador 'policyId' requerido para aprobar política" },
          { status: 400 }
        );
      }

      // Principio de 4 ojos: Validar que no se autoapruebe a menos que sea Super Admin
      const targetDraft = await prisma.bankPolicy.findUnique({
        where: { id: policyId },
        include: { versions: { orderBy: { createdAt: "desc" }, take: 1 } },
      });

      if (targetDraft && targetDraft.versions.length > 0) {
        const lastVersion = targetDraft.versions[0];
        const isSelfApproval = lastVersion.changedBy.includes(actor.email);

        if (isSelfApproval && actor.role !== "SUPER_ADMIN") {
          return NextResponse.json(
            {
              success: false,
              error:
                "Violación de separación de funciones (Principio de 4 Ojos): Quien propone una modificación tarifaria no puede ser el mismo usuario que la apruebe.",
            },
            { status: 403 }
          );
        }
      }

      const approved = await BankPolicyService.approvePolicy(
        policyId,
        `${actor.firstName} ${actor.lastName} [${actor.role}]`
      );

      return NextResponse.json({ success: true, policy: approved });
    }

    // 7. Acción: Rollback / Reversión Histórica
    if (action === "rollback") {
      const { bankId, productType, targetVersion, rollbackReason } = body;

      if (!bankId || !productType || !targetVersion) {
        return NextResponse.json(
          {
            success: false,
            error: "Parámetros insuficientes para ejecutar rollback (bankId, productType, targetVersion)",
          },
          { status: 400 }
        );
      }

      const rolledBack = await BankPolicyService.rollbackToVersion({
        bankId,
        productType,
        targetVersion,
        rollbackReason: rollbackReason || "Reversión a tarifario previo autorizado",
        performedBy: `${actor.firstName} ${actor.lastName} (${actor.email})`,
      });

      return NextResponse.json({ success: true, policy: rolledBack });
    }

    return NextResponse.json(
      { success: false, error: "Acción no reconocida. Use 'propose_rate', 'approve_policy' o 'rollback'" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error procesando solicitud de política" },
      { status: 500 }
    );
  }
}
