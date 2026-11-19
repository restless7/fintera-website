import type { FinteraContentItem } from "./blog";

export const CALENDAR_EDITORIAL_STATUS: Record<FinteraContentItem["status"], string> = {
  DRAFT: "Borrador", IN_REVIEW: "En revisión", SCHEDULED: "Programado", PUBLISHED: "Publicado", ARCHIVED: "Archivado",
};
export const CALENDAR_QA_STATUS: Record<FinteraContentItem["qaStatus"], string> = {
  UNVERIFIED: "Pendiente", PASSED: "Aprobada automáticamente", FAILED: "No aprobada", REMEDIATED: "Corregida", BYPASSED: "Omitida",
};

export const LINKEDIN_CALENDAR_DAYS = {
  Lunes: "lun",
  Martes: "mar",
  Miércoles: "mié",
  Jueves: "jue",
} as const;

export interface LinkedinCalendarIdentity {
  id: string;
  year: number;
  month: number;
  week: 1 | 2 | 3 | 4;
  day: keyof typeof LINKEDIN_CALENDAR_DAYS;
}

export function parseLinkedinCalendarId(
  value: unknown,
): LinkedinCalendarIdentity | null {
  if (typeof value !== "string") return null;
  const match = /^cal_(\d{4})_m([1-9]|1[0-2])_w([1-4])_(lun|mar|mié|jue)$/.exec(
    value,
  );
  if (!match || Number(match[1]) < 2000 || Number(match[1]) > 2100) return null;
  const day = (
    Object.keys(LINKEDIN_CALENDAR_DAYS) as LinkedinCalendarIdentity["day"][]
  ).find((key) => LINKEDIN_CALENDAR_DAYS[key] === match[4]);
  if (!day) return null;
  return {
    id: value,
    year: Number(match[1]),
    month: Number(match[2]),
    week: Number(match[3]) as LinkedinCalendarIdentity["week"],
    day,
  };
}

export function buildLinkedinCalendarId(
  identity: Omit<LinkedinCalendarIdentity, "id">,
): string {
  const id = `cal_${identity.year}_m${identity.month}_w${identity.week}_${LINKEDIN_CALENDAR_DAYS[identity.day]}`;
  if (!parseLinkedinCalendarId(id)) throw new Error("INVALID_CALENDAR_SLOT");
  return id;
}

export function calendarItemMatchesIdentity(
  item: FinteraContentItem,
  identity: LinkedinCalendarIdentity,
): boolean {
  const metadata = item.typeMetadata;
  return (
    metadata.calendarPostId === identity.id &&
    (metadata.linkedinYear === undefined ||
      metadata.linkedinYear === identity.year) &&
    (metadata.linkedinMonth === undefined ||
      metadata.linkedinMonth === identity.month) &&
    (metadata.linkedinWeek === undefined ||
      metadata.linkedinWeek === identity.week) &&
    (metadata.linkedinDay === undefined ||
      metadata.linkedinDay === identity.day)
  );
}

export function isDevelopedCalendarItem(item: FinteraContentItem): boolean {
  const state = item.typeMetadata.calendarGenerationStatus;
  return (
    Boolean(item.content.trim()) && (state === undefined || state === "READY")
  );
}

/** Historical title/day matches do not establish a period. Ambiguities stay unassigned. */
export function resolveLinkedinCalendarItems(
  items: FinteraContentItem[],
): Record<string, FinteraContentItem> {
  const grouped = new Map<string, Map<string, FinteraContentItem>>();
  for (const item of items) {
    const identity = parseLinkedinCalendarId(item.typeMetadata.calendarPostId);
    if (!identity || !calendarItemMatchesIdentity(item, identity)) continue;
    const group =
      grouped.get(identity.id) || new Map<string, FinteraContentItem>();
    group.set(item.id, item);
    grouped.set(identity.id, group);
  }
  return Object.fromEntries(
    Array.from(grouped.entries())
      .filter(([, group]) => group.size === 1)
      .map(([id, group]) => [id, Array.from(group.values())[0]]),
  );
}
