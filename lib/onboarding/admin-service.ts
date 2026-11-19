import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/client";
import type { AuthContext } from "@/lib/auth/types";
import { freshActor } from "@/lib/commercial/service";
import { DashboardService } from "@/lib/crm/dashboard-service";
import { OnboardingError, onboardingHash, serviceRequestDto } from "./service";
import type {
  AdminServiceRequestsDTO,
  AdminServiceRequestMutation,
} from "./contracts";

type Tx = Prisma.TransactionClient;
function fail(code: string, message: string, status = 403): never {
  throw new OnboardingError(code, message, status);
}

function requireRead(actor: AuthContext) {
  if (!actor.permissions.includes("crm:lead:read"))
    fail("FORBIDDEN", "Acceso denegado.");
}
function scope(actor: AuthContext): Prisma.CustomerServiceRequestWhereInput {
  return DashboardService.buildScopeFilter(
    actor.role,
    actor.userId,
    actor.teamIds,
  ) as Prisma.CustomerServiceRequestWhereInput;
}
function canAssign(actor: AuthContext) {
  return (
    actor.permissions.includes("crm:lead:assign") && actor.role !== "AUDITOR"
  );
}
async function validateAssignment(
  tx: Tx,
  actor: AuthContext,
  advisorId: string | null,
  teamId: string | null,
) {
  if (!canAssign(actor))
    fail("FORBIDDEN", "No tiene permiso para asignar responsables.");
  if (!actor.isSuperAdmin && !actor.isDirector) {
    if (teamId && !actor.teamIds.includes(teamId))
      fail("FORBIDDEN", "El equipo está fuera de su ámbito.");
    if (!teamId && advisorId !== actor.userId)
      fail("FORBIDDEN", "La asignación requiere su propio ámbito.");
  }
  if (
    teamId &&
    !(await tx.team.findUnique({ where: { id: teamId }, select: { id: true } }))
  )
    fail("INVALID_ASSIGNMENT", "Equipo no disponible.", 400);
  if (advisorId) {
    const advisor = await tx.appUser.findUnique({
      where: { id: advisorId },
      include: { teamMemberships: true },
    });
    if (
      !advisor?.isActive ||
      ![
        "SUPER_ADMIN",
        "COMMERCIAL_DIRECTOR",
        "SUPERVISOR",
        "COMMERCIAL_ADVISOR",
      ].includes(advisor.role)
    )
      fail(
        "INVALID_ASSIGNMENT",
        "Seleccione un responsable comercial activo.",
        400,
      );
    if (teamId && !advisor.teamMemberships.some((m) => m.teamId === teamId))
      fail(
        "INVALID_ASSIGNMENT",
        "El responsable no pertenece al equipo seleccionado.",
        400,
      );
    if (
      !actor.isSuperAdmin &&
      !actor.isDirector &&
      advisorId !== actor.userId &&
      !advisor.teamMemberships.some((m) => actor.teamIds.includes(m.teamId))
    )
      fail("FORBIDDEN", "El responsable está fuera de su ámbito.");
  }
}
export class AdminServiceRequestService {
  static async state(
    clerkSubject: string,
    page = 1,
  ): Promise<AdminServiceRequestsDTO> {
    return prisma.$transaction(
      async (tx) => {
        const actor = await freshActor(tx, clerkSubject);
        requireRead(actor);
        const where = scope(actor);
        const [rows, total] = await Promise.all([
          tx.customerServiceRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * 25,
            take: 25,
          }),
          tx.customerServiceRequest.count({ where }),
        ]);
        const assign = canAssign(actor);
        const advisorWhere: Prisma.AppUserWhereInput = {
          isActive: true,
          role: {
            in: [
              "SUPER_ADMIN",
              "COMMERCIAL_DIRECTOR",
              "SUPERVISOR",
              "COMMERCIAL_ADVISOR",
            ],
          },
          ...(!actor.isSuperAdmin && !actor.isDirector
            ? {
                OR: [
                  { id: actor.userId },
                  {
                    teamMemberships: {
                      some: { teamId: { in: actor.teamIds } },
                    },
                  },
                ],
              }
            : {}),
        };
        const [advisors, teams, applications] = await Promise.all([
          assign
            ? tx.appUser.findMany({
                where: advisorWhere,
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  teamMemberships: { select: { teamId: true } },
                },
                take: 201,
              })
            : [],
          assign
            ? tx.team.findMany({
                where:
                  actor.isSuperAdmin || actor.isDirector
                    ? {}
                    : { id: { in: actor.teamIds } },
                select: { id: true, name: true },
                take: 201,
              })
            : [],
          actor.permissions.includes("crm:application:read")
            ? tx.crmCreditApplication.findMany({
                where: {
                  AND: [
                    DashboardService.buildScopeFilter(
                      actor.role,
                      actor.userId,
                      actor.teamIds,
                    ),
                    {
                      client: {
                        clerkUserId: {
                          in: rows
                            .map((r) => r.claimedClerkUserId)
                            .filter((id): id is string => !!id),
                        },
                      },
                    },
                  ],
                },
                select: {
                  id: true,
                  fileNumber: true,
                  client: { select: { clerkUserId: true } },
                },
                take: 201,
              })
            : [],
        ]);
        return {
          requests: rows.map((row) => ({
            ...serviceRequestDto(row),
            claimed: !!row.claimedClerkUserId,
            assignedAdvisorId: row.assignedAdvisorId,
            teamId: row.teamId,
            nextActionAt: row.nextActionAt?.toISOString() || null,
          })),
          total,
          page,
          permissions: {
            canReview:
              actor.role !== "AUDITOR" &&
              actor.permissions.includes("crm:application:update"),
            canAssign: assign,
            canLinkApplication:
              actor.role !== "AUDITOR" &&
              actor.permissions.includes("crm:application:update") &&
              actor.permissions.includes("crm:application:read"),
          },
          advisors: advisors.slice(0, 200).map((u) => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            teamIds: u.teamMemberships.map((m) => m.teamId),
          })),
          teams: teams.slice(0, 200),
          applications: applications.slice(0, 200).map((app) => ({
            id: app.id,
            fileNumber: app.fileNumber,
            requestIds: rows
              .filter(
                (r) =>
                  r.claimedClerkUserId &&
                  r.claimedClerkUserId === app.client.clerkUserId,
              )
              .map((r) => r.id),
          })),
          optionsTruncated:
            advisors.length > 200 ||
            teams.length > 200 ||
            applications.length > 200,
        };
      },
      { isolationLevel: "Serializable", timeout: 15000 },
    );
  }
  static async mutate(
    clerkSubject: string,
    input: AdminServiceRequestMutation,
  ) {
    return prisma.$transaction(
      async (tx) => {
        const actor = await freshActor(tx, clerkSubject);
        requireRead(actor);
        if (
          actor.role === "AUDITOR" ||
          !actor.permissions.includes("crm:application:update")
        )
          fail("FORBIDDEN", "No tiene permiso para revisar solicitudes.");
        const row = await tx.customerServiceRequest.findFirst({
          where: { AND: [{ id: input.requestId }, scope(actor)] },
        });
        if (!row) fail("NOT_FOUND", "Solicitud no disponible.", 404);
        const hash = onboardingHash(JSON.stringify(input));
        const command = await tx.commercialCommand.findUnique({
          where: { id: input.commandId },
        });
        if (command) {
          if (
            command.actorUserId !== actor.userId ||
            command.payloadHash !== hash ||
            command.resourceId !== row.id
          )
            fail(
              "IDEMPOTENCY_CONFLICT",
              "La clave corresponde a otra operación.",
              409,
            );
          return { success: true, replayed: true, resourceId: row.id };
        }
        if (row.revision !== input.expectedRevision)
          fail(
            "CONFLICT",
            "La solicitud cambió. Actualice antes de continuar.",
            409,
          );
        const data: Prisma.CustomerServiceRequestUncheckedUpdateManyInput = {
          revision: { increment: 1 },
        };
        if (input.action === "LINK_APPLICATION") {
          if (
            !actor.permissions.includes("crm:application:read") ||
            row.status === "DRAFT" ||
            !row.claimedClerkUserId
          )
            fail(
              "PRECONDITION_FAILED",
              "La solicitud debe estar confirmada y el expediente debe estar vinculado a su titular.",
              409,
            );
          const application = await tx.crmCreditApplication.findFirst({
            where: {
              AND: [
                { id: input.applicationId },
                DashboardService.buildScopeFilter(
                  actor.role,
                  actor.userId,
                  actor.teamIds,
                ),
              ],
              client: { clerkUserId: row.claimedClerkUserId },
            },
            select: { id: true },
          });
          if (!application || row.applicationId)
            fail(
              "PRECONDITION_FAILED",
              "No hay un expediente autorizado con la misma identidad de cliente, o la solicitud ya está vinculada.",
              409,
            );
          data.applicationId = application.id;
        } else {
          const transitions: Record<string, string[]> = {
            DRAFT: ["DRAFT"],
            SUBMITTED: ["SUBMITTED", "IN_REVIEW", "CLOSED"],
            IN_REVIEW: ["IN_REVIEW", "CLOSED"],
            CLOSED: ["CLOSED"],
          };
          if (input.status && !transitions[row.status]?.includes(input.status))
            fail(
              "INVALID_TRANSITION",
              "Ese cambio de estado no corresponde a la solicitud.",
              409,
            );
          const advisor =
            input.assignedAdvisorId === undefined
              ? row.assignedAdvisorId
              : input.assignedAdvisorId;
          const team = input.teamId === undefined ? row.teamId : input.teamId;
          if (advisor !== row.assignedAdvisorId || team !== row.teamId)
            await validateAssignment(tx, actor, advisor, team);
          data.assignedAdvisorId = advisor;
          data.teamId = team;
          if (input.status) data.status = input.status;
          if (input.nextActionAt !== undefined)
            data.nextActionAt = input.nextActionAt
              ? new Date(input.nextActionAt)
              : null;
          if (input.publicMessage !== undefined)
            data.publicMessage = input.publicMessage || null;
        }
        const changed = await tx.customerServiceRequest.updateMany({
          where: { id: row.id, revision: input.expectedRevision },
          data,
        });
        if (changed.count !== 1)
          fail("CONFLICT", "La solicitud cambió. Actualice su estado.", 409);
        await tx.accessAuditEvent.create({
          data: {
            userId: actor.userId,
            clerkUserId: clerkSubject,
            action:
              input.action === "LINK_APPLICATION"
                ? "CUSTOMER_SERVICE_REQUEST_CASE_LINKED"
                : "CUSTOMER_SERVICE_REQUEST_REVIEWED",
            resourceType: "CustomerServiceRequest",
            resourceId: row.id,
            applicationId:
              input.action === "LINK_APPLICATION"
                ? input.applicationId
                : undefined,
            decision: "GRANTED",
            reason: input.reason,
            metadata: JSON.parse(
              JSON.stringify({
                before: {
                  status: row.status,
                  assignedAdvisorId: row.assignedAdvisorId,
                  teamId: row.teamId,
                  nextActionAt: row.nextActionAt,
                  publicMessage: row.publicMessage,
                  applicationId: row.applicationId,
                },
                after: data,
              }),
            ),
          },
        });
        await tx.commercialCommand.create({
          data: {
            id: input.commandId,
            actorUserId: actor.userId,
            payloadHash: hash,
            resourceId: row.id,
          },
        });
        return { success: true, replayed: false, resourceId: row.id };
      },
      { isolationLevel: "Serializable", timeout: 15000 },
    );
  }
}
