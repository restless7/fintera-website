import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { CustomerIdentityService, CustomerSecurityError } from "@/lib/auth/customer-identity-service";
import { lookupVerifiedAccessIdentity } from "@/lib/auth/access-identity";
import { RbacService } from "@/lib/auth/rbac-service";
import type { CustomerLinkStateDTO } from "./portal-contracts";

async function verifiedPrimaryEmail(clerkUserId: string): Promise<string> {
  let identity;
  try { identity = await (await clerkClient()).users.getUser(clerkUserId); }
  catch { throw new CustomerSecurityError("No fue posible verificar la identidad. Intente más tarde.", 503, "IDENTITY_UNAVAILABLE"); }
  const primary = identity.emailAddresses.find(email => email.id === identity.primaryEmailAddressId);
  if (identity.id !== clerkUserId || identity.banned || identity.locked || primary?.verification?.status !== "verified") {
    throw new CustomerSecurityError("Verifique el correo principal de su cuenta antes de vincularla.", 403, "VERIFIED_EMAIL_REQUIRED");
  }
  return primary.emailAddress.trim().toLowerCase();
}
export class CustomerLinkService {
  static async bindExistingClient(applicationId: string, actorClerkUserId: string, email: string, reason: string) {
    const decision = await RbacService.authorize({ permission: "crm:document:review", clerkUserId: actorClerkUserId, scope: { applicationId }, logAudit: false });
    if (!decision.authorized || !decision.authContext?.isSuperAdmin) throw new CustomerSecurityError("Sólo el superadministrador puede confirmar esta vinculación.", 403, "FORBIDDEN");
    const identity = await lookupVerifiedAccessIdentity(email);
    await prisma.$transaction(async tx => {
      const actor = await tx.appUser.findUnique({ where: { clerkUserId: actorClerkUserId } });
      if (!actor?.isActive || actor.role !== "SUPER_ADMIN") throw new CustomerSecurityError("Acceso denegado.", 403, "FORBIDDEN");
      const app = await tx.crmCreditApplication.findUniqueOrThrow({ where: { id: applicationId } });
      await tx.$queryRaw`SELECT id FROM clients WHERE id = ${app.clientId} FOR UPDATE`;
      const client = await tx.client.findUniqueOrThrow({ where: { id: app.clientId } });
      if (client.clerkUserId || await tx.client.findUnique({ where: { clerkUserId: identity.clerkUserId } })) throw new CustomerSecurityError("La identidad o el cliente ya están vinculados. Se requiere revisión asistida.", 409, "LINK_CONFLICT");
      const changed = await tx.client.updateMany({ where: { id: client.id, clerkUserId: null, updatedAt: client.updatedAt }, data: { clerkUserId: identity.clerkUserId } });
      if (changed.count !== 1) throw new CustomerSecurityError("La vinculación cambió.", 409, "LINK_CONFLICT");
      await tx.accessAuditEvent.create({ data: { userId: actor.id, clerkUserId: actorClerkUserId, applicationId, action: "CUSTOMER_IDENTITY_ASSISTED_LINKED", resourceType: "Client", resourceId: client.id, decision: "GRANTED", reason, metadata: { linkedSubject: identity.clerkUserId, verifiedPrimaryEmail: identity.email } } });
    }, { isolationLevel: "Serializable" });
    return { success: true };
  }

  static async getState(clerkUserId: string): Promise<CustomerLinkStateDTO> {
    const email = await verifiedPrimaryEmail(clerkUserId);
    const linked = await prisma.client.findUnique({ where: { clerkUserId }, select: { applications: { select: { id: true, fileNumber: true } } } });
    if (linked) return { state: "LINKED", message: "Su cuenta está vinculada.", applications: linked.applications };
    const delegated = await CustomerIdentityService.resolveCustomerContext(clerkUserId);
    const authorizedApplications: Array<{ id: string; fileNumber: string }> = [];
    for (const grant of delegated.grants.filter(g => g.canViewApplication)) {
      const candidates = await prisma.crmCreditApplication.findMany({ where: { clientId: grant.clientId, ...(grant.applicationId ? { id: grant.applicationId } : {}) }, select: { id: true, fileNumber: true } });
      for (const app of candidates) {
        try {
          await CustomerIdentityService.verifyApplicationAccess(clerkUserId, app.id, "VIEW");
          if (!authorizedApplications.some(a => a.id === app.id)) authorizedApplications.push(app);
        } catch (error) { if (!(error instanceof CustomerSecurityError)) throw error; }
      }
    }
    if (authorizedApplications.length) return { state: "LINKED", message: "Su cuenta tiene acceso delegado a estas solicitudes. Los documentos disponibles dependen de su permiso personal.", applications: authorizedApplications };

    const candidates = await prisma.client.findMany({ where: { email: { equals: email, mode: "insensitive" } }, take: 2, select: { portalContactRecordedAt: true, clerkUserId: true, applications: { select: { id: true, fileNumber: true } } } });
    if (candidates.length !== 1 || candidates[0].clerkUserId || !candidates[0].portalContactRecordedAt) return { state: "ASSISTED_LINK_REQUIRED", message: "Su asesor debe verificar la vinculación. No cambie los datos de otra persona en el formulario público.", applications: [] };
    return { state: "CONFIRM_EMAIL_LINK", message: "Confirme que desea vincular su cuenta a las solicitudes registradas con su correo principal verificado.", applications: candidates[0].applications };
  }
  static async confirm(clerkUserId: string, applicationId: string): Promise<CustomerLinkStateDTO> {
    const email = await verifiedPrimaryEmail(clerkUserId);
    await prisma.$transaction(async tx => {
      // Serializes this identity and canonical contact; no identity/role from caller metadata.
      await tx.$executeRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`portal-link:${email}`}))`;
      const candidates = await tx.client.findMany({ where: { email: { equals: email, mode: "insensitive" } }, take: 2 });
      if (candidates.length !== 1) throw new CustomerSecurityError("Solicite verificación asistida a su asesor.", 409, "ASSISTED_LINK_REQUIRED");
      const client = candidates[0];
      await tx.$queryRaw`SELECT id FROM clients WHERE id = ${client.id} FOR UPDATE`;
      const current = await tx.client.findUniqueOrThrow({ where: { id: client.id } });
      if (!current.portalContactRecordedAt || current.email.toLowerCase() !== email || (current.clerkUserId && current.clerkUserId !== clerkUserId)) throw new CustomerSecurityError("El expediente ya tiene una vinculación distinta.", 409, "CLIENT_ALREADY_CLAIMED");
      const collision = await tx.client.findFirst({ where: { clerkUserId, id: { not: client.id } }, select: { id: true } });
      const app = await tx.crmCreditApplication.findFirst({ where: { id: applicationId, clientId: client.id }, select: { id: true } });
      if (collision || !app) throw new CustomerSecurityError("No fue posible confirmar la vinculación.", 409, "LINK_CONFLICT");
      if (current.clerkUserId === clerkUserId) return;
      const changed = await tx.client.updateMany({ where: { id: client.id, clerkUserId: null }, data: { clerkUserId } });
      if (changed.count !== 1) throw new CustomerSecurityError("La vinculación cambió. Actualice la página.", 409, "LINK_CONFLICT");
      await tx.accessAuditEvent.create({ data: { clerkUserId, applicationId, action: "CUSTOMER_VERIFIED_EMAIL_LINKED", resourceType: "Client", resourceId: client.id, decision: "GRANTED", reason: "Explicit confirmation of unique canonical contact and freshly verified Clerk primary email" } });
    }, { isolationLevel: "Serializable" });
    return this.getState(clerkUserId);
  }
}
