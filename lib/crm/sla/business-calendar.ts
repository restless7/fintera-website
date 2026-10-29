/**
 * MOTOR DE CALENDARIO HÁBIL Y FESTIVOS DE COLOMBIA (LEY 51 DE 1983 - LEY EMILIANI)
 * FASE 6.3: GATE D — OPERATIONAL SLA MANAGEMENT
 * 
 * Zona Horaria Oficial: America/Bogota (UTC-5)
 * Jornada Laboral: Lunes a Viernes, 08:00 - 17:00 (9 horas de operación continua)
 */

export interface BusinessHoursConfig {
  startHour: number; // 8 = 08:00
  endHour: number;   // 17 = 17:00
  timezone: string;  // "America/Bogota"
}

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  startHour: 8,
  endHour: 17,
  timezone: "America/Bogota",
};

/**
 * Festivos oficiales de Colombia para 2026 (Año operativo de referencia)
 * Calculados conforme a la Ley Emiliani y calendario litúrgico:
 */
export const COLOMBIAN_HOLIDAYS_2026 = new Set<string>([
  "2026-01-01", // Año Nuevo
  "2026-01-12", // Reyes Magos (Trasladado)
  "2026-03-23", // San José (Trasladado)
  "2026-04-02", // Jueves Santo
  "2026-04-03", // Viernes Santo
  "2026-05-01", // Día del Trabajo
  "2026-05-18", // Ascensión del Señor (Trasladado)
  "2026-06-08", // Corpus Christi (Trasladado)
  "2026-06-15", // Sagrado Corazón (Trasladado)
  "2026-06-29", // San Pedro y San Pablo (Trasladado)
  "2026-07-20", // Día de la Independencia
  "2026-08-07", // Batalla de Boyacá
  "2026-08-17", // Asunción de la Virgen (Trasladado)
  "2026-10-12", // Día de la Raza (Trasladado)
  "2026-11-02", // Todos los Santos (Trasladado)
  "2026-11-16", // Independencia de Cartagena (Trasladado)
  "2026-12-08", // Inmaculada Concepción
  "2026-12-25", // Navidad
]);

// Festivos para 2025 y 2027 como respaldo determinista
export const COLOMBIAN_HOLIDAYS_MULTIYEAR = new Set<string>([
  ...Array.from(COLOMBIAN_HOLIDAYS_2026),
  "2025-01-01", "2025-01-06", "2025-03-24", "2025-04-17", "2025-04-18",
  "2025-05-01", "2025-06-02", "2025-06-23", "2025-06-30", "2025-07-20",
  "2025-08-07", "2025-08-18", "2025-10-13", "2025-11-03", "2025-11-17",
  "2025-12-08", "2025-12-25",
  "2027-01-01", "2027-01-11", "2027-03-22", "2027-03-25", "2027-03-26",
  "2027-05-01", "2027-05-10", "2027-05-31", "2027-06-07", "2027-07-20",
  "2027-08-07", "2027-08-16", "2027-10-18", "2027-11-01", "2027-11-15",
  "2027-12-08", "2027-12-25",
]);

export class ColombianBusinessCalendar {
  /**
   * Obtiene la fecha en formato YYYY-MM-DD en la zona horaria de Bogotá (UTC-5)
   */
  static toBogotaDateString(date: Date): string {
    const utcMs = date.getTime();
    const bogotaOffsetMs = -5 * 60 * 60 * 1000;
    const bogotaDate = new Date(utcMs + bogotaOffsetMs);
    const y = bogotaDate.getUTCFullYear();
    const m = String(bogotaDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(bogotaDate.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Determina si una fecha dada es día hábil en Colombia (no es sábado, domingo ni festivo)
   */
  static isBusinessDay(date: Date): boolean {
    const utcMs = date.getTime();
    const bogotaOffsetMs = -5 * 60 * 60 * 1000;
    const bogotaDate = new Date(utcMs + bogotaOffsetMs);
    const dayOfWeek = bogotaDate.getUTCDay(); // 0 = Domingo, 6 = Sábado

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    const dateStr = this.toBogotaDateString(date);
    return !COLOMBIAN_HOLIDAYS_MULTIYEAR.has(dateStr);
  }

  /**
   * Añade horas hábiles comerciales a una fecha de inicio
   */
  static addBusinessHours(
    startDate: Date,
    businessHoursToAdd: number,
    config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
  ): Date {
    if (businessHoursToAdd <= 0) return new Date(startDate);

    // Trabajamos en minutos para mayor precisión
    let remainingMinutes = Math.round(businessHoursToAdd * 60);
    const current = new Date(startDate);

    // Ajustar si la fecha de inicio es fuera de jornada o día no hábil
    while (remainingMinutes > 0) {
      const utcMs = current.getTime();
      const bogotaDate = new Date(utcMs - 5 * 3600 * 1000);
      const dayOfWeek = bogotaDate.getUTCDay();
      const dateStr = this.toBogotaDateString(current);
      const isHoliday = COLOMBIAN_HOLIDAYS_MULTIYEAR.has(dateStr);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (isWeekend || isHoliday) {
        // Avanzar al inicio de la jornada del siguiente día a las 08:00
        bogotaDate.setUTCDate(bogotaDate.getUTCDate() + 1);
        bogotaDate.setUTCHours(config.startHour, 0, 0, 0);
        current.setTime(bogotaDate.getTime() + 5 * 3600 * 1000);
        continue;
      }

      const curHour = bogotaDate.getUTCHours();
      const curMinute = bogotaDate.getUTCMinutes();
      const curMinutesFromStart = curHour * 60 + curMinute;
      const startOfDayMinutes = config.startHour * 60;
      const endOfDayMinutes = config.endHour * 60;

      if (curMinutesFromStart < startOfDayMinutes) {
        // Antes de las 08:00 am -> mover a las 08:00 am
        bogotaDate.setUTCHours(config.startHour, 0, 0, 0);
        current.setTime(bogotaDate.getTime() + 5 * 3600 * 1000);
        continue;
      }

      if (curMinutesFromStart >= endOfDayMinutes) {
        // Después de las 17:00 pm -> mover al día siguiente a las 08:00 am
        bogotaDate.setUTCDate(bogotaDate.getUTCDate() + 1);
        bogotaDate.setUTCHours(config.startHour, 0, 0, 0);
        current.setTime(bogotaDate.getTime() + 5 * 3600 * 1000);
        continue;
      }

      // Minutos disponibles en el día actual
      const availableMinutesToday = endOfDayMinutes - curMinutesFromStart;

      if (remainingMinutes <= availableMinutesToday) {
        // Alcanza en el mismo día
        current.setTime(current.getTime() + remainingMinutes * 60 * 1000);
        remainingMinutes = 0;
      } else {
        // Consumir el resto del día y pasar al siguiente día hábil
        remainingMinutes -= availableMinutesToday;
        bogotaDate.setUTCDate(bogotaDate.getUTCDate() + 1);
        bogotaDate.setUTCHours(config.startHour, 0, 0, 0);
        current.setTime(bogotaDate.getTime() + 5 * 3600 * 1000);
      }
    }

    return current;
  }

  /**
   * Calcula los milisegundos hábiles transcurridos entre dos fechas
   */
  static getBusinessElapsedMs(
    startDate: Date,
    endDate: Date,
    config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
  ): number {
    if (endDate <= startDate) return 0;

    let totalMinutes = 0;
    const current = new Date(startDate);

    while (current < endDate) {
      const utcMs = current.getTime();
      const bogotaDate = new Date(utcMs - 5 * 3600 * 1000);
      const dayOfWeek = bogotaDate.getUTCDay();
      const dateStr = this.toBogotaDateString(current);

      if (dayOfWeek === 0 || dayOfWeek === 6 || COLOMBIAN_HOLIDAYS_MULTIYEAR.has(dateStr)) {
        bogotaDate.setUTCDate(bogotaDate.getUTCDate() + 1);
        bogotaDate.setUTCHours(config.startHour, 0, 0, 0);
        current.setTime(bogotaDate.getTime() + 5 * 3600 * 1000);
        continue;
      }

      const curHour = bogotaDate.getUTCHours();
      const curMinute = bogotaDate.getUTCMinutes();
      const curMinutesFromStart = curHour * 60 + curMinute;
      const startOfDayMinutes = config.startHour * 60;
      const endOfDayMinutes = config.endHour * 60;

      if (curMinutesFromStart < startOfDayMinutes) {
        bogotaDate.setUTCHours(config.startHour, 0, 0, 0);
        current.setTime(bogotaDate.getTime() + 5 * 3600 * 1000);
        continue;
      }

      if (curMinutesFromStart >= endOfDayMinutes) {
        bogotaDate.setUTCDate(bogotaDate.getUTCDate() + 1);
        bogotaDate.setUTCHours(config.startHour, 0, 0, 0);
        current.setTime(bogotaDate.getTime() + 5 * 3600 * 1000);
        continue;
      }

      // Minutos hasta el final del día o endDate
      const endOfToday = new Date(bogotaDate);
      endOfToday.setUTCHours(config.endHour, 0, 0, 0);
      const endOfTodayUtc = new Date(endOfToday.getTime() + 5 * 3600 * 1000);

      const segmentEnd = endDate < endOfTodayUtc ? endDate : endOfTodayUtc;
      const diffMs = segmentEnd.getTime() - current.getTime();
      totalMinutes += Math.max(0, Math.floor(diffMs / 60000));

      // Avanzar al final del día
      if (segmentEnd >= endOfTodayUtc) {
        bogotaDate.setUTCDate(bogotaDate.getUTCDate() + 1);
        bogotaDate.setUTCHours(config.startHour, 0, 0, 0);
        current.setTime(bogotaDate.getTime() + 5 * 3600 * 1000);
      } else {
        break;
      }
    }

    return totalMinutes * 60 * 1000;
  }
}
