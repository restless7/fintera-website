/** Durable growth capture lives in commercial_leads; no local cache or demonstration business records. */
export type { GrowthCaptureInput, GrowthReceipt } from '@/lib/commercial/contracts';
export { captureGrowthLead, growthReceipt } from '@/lib/commercial/service';
