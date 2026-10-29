export const STATUS_LABELS: Record<string, string> = {
  CLEAN: "Archivo verificado", INFECTED: "Archivo infectado", QUARANTINED: "En cuarentena", PENDING_SCAN: "Pendiente de escaneo", SCANNING: "Escaneando", SCAN_FAILED: "Escaneo fallido", NOT_SUBMITTED: "Sin presentar", PENDING_REVIEW: "Pendiente de revisión", APPROVED: "Aprobado", EXPIRED: "Vencido",
  LEAD_CAPTURED: "Nuevo lead", PROFILING: "En perfilamiento", FINANCIALLY_PREQUALIFIED: "Precalificado", DOCUMENTATION_IN_PROGRESS: "Documentación pendiente", FILE_COMPLETE: "Expediente completo", SUBMITTED_TO_BANKS: "Radicado en bancos", BANK_STUDY: "Estudio bancario", PARTIALLY_APPROVED: "Aprobación parcial", LEGALLY_FORMALIZED: "Formalizado", DISBURSED: "Desembolsado", REJECTED: "Rechazado", CANCELLED_BY_CLIENT: "Cancelado por cliente",
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = ["CLEAN", "APPROVED", "DISBURSED", "LEGALLY_FORMALIZED", "FILE_COMPLETE"].includes(status) ? "success" : ["INFECTED", "QUARANTINED", "SCAN_FAILED", "REJECTED", "CANCELLED_BY_CLIENT"].includes(status) ? "danger" : ["PENDING_SCAN", "SCANNING", "PENDING_REVIEW", "EXPIRED", "DOCUMENTATION_IN_PROGRESS", "LEAD_CAPTURED"].includes(status) ? "warning" : "neutral";
  return <span className={`admin-status admin-status-${tone}`}>{label || STATUS_LABELS[status] || status.replace(/_/g, " ")}</span>;
}
