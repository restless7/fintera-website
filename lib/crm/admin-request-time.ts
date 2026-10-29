import { cache } from "react";

/** One wall-clock snapshot per server request; no client-render clock or shared cache. */
export const getAdminRequestTime = cache(async () => new Date());
