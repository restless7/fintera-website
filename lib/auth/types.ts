/**
 * FINTERA ENTERPRISE CRM — TIPOS Y CONTRATOS DE AUTORIZACIÓN RBAC/ABAC
 * Fase 6.1 (Gate B)
 */

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMMERCIAL_DIRECTOR: 'COMMERCIAL_DIRECTOR',
  SUPERVISOR: 'SUPERVISOR',
  COMMERCIAL_ADVISOR: 'COMMERCIAL_ADVISOR',
  DOCUMENT_ANALYST: 'DOCUMENT_ANALYST',
  OPERATIONS_OFFICER: 'OPERATIONS_OFFICER',
  AUDITOR: 'AUDITOR',
  CLIENT: 'CLIENT',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ApplicationStatus = {
  LEAD_CAPTURED: 'LEAD_CAPTURED',
  PROFILING: 'PROFILING',
  FINANCIALLY_PREQUALIFIED: 'FINANCIALLY_PREQUALIFIED',
  DOCUMENTATION_IN_PROGRESS: 'DOCUMENTATION_IN_PROGRESS',
  FILE_COMPLETE: 'FILE_COMPLETE',
  SUBMITTED_TO_BANKS: 'SUBMITTED_TO_BANKS',
  BANK_STUDY: 'BANK_STUDY',
  PARTIALLY_APPROVED: 'PARTIALLY_APPROVED',
  LEGALLY_FORMALIZED: 'LEGALLY_FORMALIZED',
  DISBURSED: 'DISBURSED',
  REJECTED: 'REJECTED',
  CANCELLED_BY_CLIENT: 'CANCELLED_BY_CLIENT',
} as const;

export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export type Permission =
  // Leads & Captación
  | 'crm:lead:read'
  | 'crm:lead:create'
  | 'crm:lead:assign'
  // Expedientes Comerciales
  | 'crm:application:read'
  | 'crm:application:create'
  | 'crm:application:update'
  | 'crm:application:transition'
  // Procesos Bancarios
  | 'crm:bank-case:manage'
  // Documentos
  | 'crm:document:read'
  | 'crm:document:review'
  | 'crm:document:upload'
  // Políticas y Tarifarios Bancarios
  | 'crm:policy:read'
  | 'crm:policy:propose'
  | 'crm:policy:approve'
  | 'crm:policy:rollback'
  // Analítica & Auditoría
  | 'crm:report:read'
  | 'crm:audit:read';

export interface AuthContext {
  userId: string;
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  teamIds: string[];
  isSuperAdmin: boolean;
  isDirector: boolean;
}

export interface ResourceScope {
  applicationId?: string;
  clientId?: string;
  teamId?: string;
  assignedAdvisorId?: string;
  clientClerkUserId?: string;
}

export interface AuthorizationResult {
  authorized: boolean;
  decision: 'GRANTED' | 'DENIED';
  reason?: string;
  authContext?: AuthContext;
}

/**
 * Matriz canónica de permisos por rol empresarial
 */
export const ROLE_PERMISSIONS_MAP: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'crm:lead:read',
    'crm:lead:create',
    'crm:lead:assign',
    'crm:application:read',
    'crm:application:create',
    'crm:application:update',
    'crm:application:transition',
    'crm:bank-case:manage',
    'crm:document:read',
    'crm:document:review',
    'crm:document:upload',
    'crm:policy:read',
    'crm:policy:propose',
    'crm:policy:approve',
    'crm:policy:rollback',
    'crm:report:read',
    'crm:audit:read',
  ],

  COMMERCIAL_DIRECTOR: [
    'crm:lead:read',
    'crm:lead:create',
    'crm:lead:assign',
    'crm:application:read',
    'crm:application:create',
    'crm:application:update',
    'crm:application:transition',
    'crm:bank-case:manage',
    'crm:document:read',
    'crm:document:review',
    'crm:document:upload',
    'crm:policy:read',
    'crm:policy:propose',
    'crm:policy:approve',
    'crm:report:read',
    'crm:audit:read',
  ],

  SUPERVISOR: [
    'crm:lead:read',
    'crm:lead:create',
    'crm:lead:assign',
    'crm:application:read',
    'crm:application:update',
    'crm:application:transition',
    'crm:bank-case:manage',
    'crm:document:read',
    'crm:document:review',
    'crm:document:upload',
    'crm:policy:read',
    'crm:report:read',
  ],

  COMMERCIAL_ADVISOR: [
    'crm:lead:read',
    'crm:lead:create',
    'crm:application:read',
    'crm:application:create',
    'crm:application:update',
    'crm:application:transition',
    'crm:bank-case:manage',
    'crm:document:read',
    'crm:document:upload',
    'crm:policy:read',
  ],

  DOCUMENT_ANALYST: [
    'crm:application:read',
    'crm:document:read',
    'crm:document:review',
    'crm:policy:read',
  ],

  OPERATIONS_OFFICER: [
    'crm:application:read',
    'crm:bank-case:manage',
    'crm:document:read',
    'crm:policy:read',
  ],

  AUDITOR: [
    'crm:application:read',
    'crm:document:read',
    'crm:policy:read',
    'crm:report:read',
    'crm:audit:read',
  ],

  CLIENT: [
    'crm:application:read',
    'crm:document:read',
    'crm:document:upload',
  ],
};
