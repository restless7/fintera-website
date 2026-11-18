/** Display exact COP decimals without binary floating-point conversion. */
export function commercialMoney(value: string | null | undefined): string {
  if (value === null || value === undefined) return "Sin registrar";
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return "Importe no disponible";
  const whole = match[2]
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${match[1]}$ ${whole},${(match[3] || "").padEnd(2, "0")}`;
}
export function commercialDate(value: string | null | undefined): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Bogota",
      }).format(date);
}
export const localDateInput = (value: string | null | undefined) =>
  value
    ? new Date(new Date(value).getTime() - 5 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16)
    : "";
export const colombiaDate = (value: string) =>
  value ? new Date(value + ":00-05:00").toISOString() : null;
