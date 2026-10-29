import type { AccessApiError } from "./access-contracts";
export class AccessAdministrationError extends Error {
  constructor(public code: AccessApiError["code"], message: string, public status = 400) { super(message); }
}
