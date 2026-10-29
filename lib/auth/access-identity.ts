import { clerkClient } from "@clerk/nextjs/server";
import { AccessAdministrationError } from "./access-errors";

/** Server-side exact primary-email lookup. Never creates/invites or trusts metadata. */
export async function lookupVerifiedAccessIdentity(email: string) {
  let result;
  try { result = await (await clerkClient()).users.getUserList({ emailAddress: [email], limit: 2 }); }
  catch { throw new AccessAdministrationError("UNAVAILABLE", "No fue posible verificar la identidad. Intenta más tarde.", 503); }
  if (result.data.length !== 1) throw new AccessAdministrationError("IDENTITY_NOT_FOUND", "No se encontró una cuenta única con ese correo. La persona debe registrarse primero.", 404);
  const identity = result.data[0];
  const primary = identity.emailAddresses.find(entry => entry.id === identity.primaryEmailAddressId);
  if (!primary || primary.emailAddress.toLowerCase() !== email.toLowerCase() || primary.verification?.status !== "verified" || identity.banned || identity.locked) {
    throw new AccessAdministrationError("IDENTITY_NOT_VERIFIED", "El correo principal debe estar verificado y la identidad habilitada en Clerk.", 409);
  }
  return { clerkUserId: identity.id, email: primary.emailAddress, firstName: identity.firstName || "", lastName: identity.lastName || "" };
}

/** Re-enabling an internally inactive row cannot resurrect a deleted/banned identity. */
export async function verifyExistingAccessIdentity(clerkUserId: string) {
  let identity;
  try { identity = await (await clerkClient()).users.getUser(clerkUserId); }
  catch (error) {
    if ((error as { status?: number })?.status === 404) throw new AccessAdministrationError("IDENTITY_NOT_FOUND", "La identidad ya no existe en Clerk. No se puede reactivar.", 409);
    throw new AccessAdministrationError("UNAVAILABLE", "No fue posible comprobar la identidad para reactivar el acceso.", 503);
  }
  const primary = identity.emailAddresses.find(entry => entry.id === identity.primaryEmailAddressId);
  if (identity.id !== clerkUserId || !primary || primary.verification?.status !== "verified" || identity.banned || identity.locked) throw new AccessAdministrationError("IDENTITY_NOT_VERIFIED", "La identidad debe estar habilitada y tener un correo principal verificado.", 409);
}
