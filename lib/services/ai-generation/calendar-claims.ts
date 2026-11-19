import { randomUUID } from "node:crypto";
import prisma from "../../prisma";
import {
  convertPrismaBlogPostToFinteraContentItem,
  type FinteraContentItem,
} from "../../blog";
import {
  calendarItemMatchesIdentity,
  isDevelopedCalendarItem,
  parseLinkedinCalendarId,
  type LinkedinCalendarIdentity,
} from "../../linkedin-calendar";
import type { LinkedinCalendarPostSpec } from "../../linkedin-strategy";

const emptyEditorialMetadata = {
  humanReview: { humanReviewed: false, reviewerName: "Pendiente de revisión humana", reviewerRole: "", reviewerCredentials: "", reviewedAt: null, expertMesaNote: "", verificationHash: "" },
  analytics: { views: 0, uniqueViews: 0, shares: 0, helpfulVotes: 0, ctaClicks: 0, newsletterSignups: 0, avgReadSeconds: 0, shareBreakdown: { linkedin: 0, whatsapp: 0, x: 0, facebook: 0, email: 0, copy: 0 } },
};

export class CalendarGenerationError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

export interface CalendarClaim {
  id: string;
  slug: string;
  token: string;
  identity: LinkedinCalendarIdentity;
}

export async function findExistingCalendarArticle(
  slotId: string,
): Promise<FinteraContentItem | null> {
  const identity = parseLinkedinCalendarId(slotId);
  if (!identity)
    throw new CalendarGenerationError("INVALID_CALENDAR_SLOT", 400);
  // Database query is exact and independent of the size/order of the editorial index.
  const rows = await prisma.blogPost.findMany({
    where: { typeMetadata: { path: ["calendarPostId"], equals: slotId } },
    take: 2,
  });
  if (rows.length > 1)
    throw new CalendarGenerationError("CALENDAR_SLOT_AMBIGUOUS", 409);
  if (!rows.length) return null;
  const item = convertPrismaBlogPostToFinteraContentItem(rows[0]);
  if (!calendarItemMatchesIdentity(item, identity))
    throw new CalendarGenerationError("CALENDAR_METADATA_CONFLICT", 409);
  return isDevelopedCalendarItem(item) ? item : null;
}

export async function reserveCalendarGeneration(
  slot: LinkedinCalendarPostSpec,
  retryFailed = false,
): Promise<{ existing: FinteraContentItem } | { claim: CalendarClaim }> {
  const identity = parseLinkedinCalendarId(slot.id);
  if (!identity)
    throw new CalendarGenerationError("INVALID_CALENDAR_SLOT", 400);
  const existing = await findExistingCalendarArticle(slot.id);
  if (existing) return { existing };
  const id = `linkedin_${slot.id}`;
  const slug = `linkedin-${slot.id.replaceAll("_", "-").replace("mié", "mie")}`;
  const token = randomUUID();
  const metadata = {
    ...emptyEditorialMetadata,
    calendarPostId: slot.id,
    linkedinYear: identity.year,
    linkedinMonth: identity.month,
    linkedinWeek: identity.week,
    linkedinDay: identity.day,
    linkedinFormat: slot.format,
    calendarGenerationStatus: "PENDING",
    calendarGenerationClaim: token,
    calendarGenerationStartedAt: new Date().toISOString(),
  };
  const prior = await prisma.blogPost.findFirst({
    where: {
      OR: [
        { id },
        { slug },
        { typeMetadata: { path: ["calendarPostId"], equals: slot.id } },
      ],
    },
  });
  if (prior) {
    const item = convertPrismaBlogPostToFinteraContentItem(prior);
    if (
      prior.id !== id ||
      prior.slug !== slug ||
      !calendarItemMatchesIdentity(item, identity)
    )
      throw new CalendarGenerationError("CALENDAR_SLOT_CONFLICT", 409);
    if (item.typeMetadata.calendarGenerationStatus !== "FAILED" || !retryFailed)
      throw new CalendarGenerationError(
        "CALENDAR_SLOT_PENDING_OR_RETRY_REQUIRED",
        409,
      );
    const claimed = await prisma.blogPost.updateMany({
      where: {
        id,
        status: "DRAFT",
        content: "",
        typeMetadata: { equals: prior.typeMetadata! },
      },
      data: { typeMetadata: metadata },
    });
    if (claimed.count !== 1)
      throw new CalendarGenerationError("CALENDAR_SLOT_CHANGED", 409);
  } else {
    try {
      await prisma.blogPost.create({
        data: {
          id,
          slug,
          title: slot.title,
          content: "",
          status: "DRAFT",
          contentType: slot.contentType,
          pillar: slot.pillar,
          typeMetadata: metadata,
          views: 0,
        },
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      )
        throw new CalendarGenerationError(
          "CALENDAR_SLOT_PENDING_OR_RETRY_REQUIRED",
          409,
        );
      throw error;
    }
  }
  return { claim: { id, slug, token, identity } };
}

/** Only failures before a persistence attempt become explicitly retryable. No expired-lease replay. */
export async function failCalendarGeneration(
  claim: CalendarClaim,
): Promise<void> {
  await prisma.blogPost.updateMany({
    where: {
      id: claim.id,
      status: "DRAFT",
      content: "",
      typeMetadata: { path: ["calendarGenerationClaim"], equals: claim.token },
    },
    data: {
      typeMetadata: {
        ...emptyEditorialMetadata,
        calendarPostId: claim.identity.id,
        linkedinYear: claim.identity.year,
        linkedinMonth: claim.identity.month,
        linkedinWeek: claim.identity.week,
        linkedinDay: claim.identity.day,
        calendarGenerationStatus: "FAILED",
        calendarGenerationClaim: claim.token,
      },
    },
  });
}
