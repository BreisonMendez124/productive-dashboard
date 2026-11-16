/**
 * format.js
 * 
 * Utilidades de formato para el dashboard WMS.
 * 
 * Funciones:
 * 1. round1(v) — Redondea a 1 decimal
 * 2. fmtDateTime(v) — Formatea fecha completa con hora
 * 3. fmtMinSeg(minutos) — Convierte minutos decimales a "MM:SS"
 * 
 * Uso:
 *   import { round1, fmtDateTime, fmtMinSeg } from './lib/format';
 *   
 *   round1(1.856)                    // "1.9"
 *   fmtDateTime(new Date())          // "05/05/2026 02:34:56 p.m."
 *   fmtMinSeg(1.5)                   // "01:30"
 */

/**
 * round1 — Redondea a 1 decimal
 * 
 * Retorna "-" si el valor no es numérico (null, undefined, NaN).
 * Útil para evitar "NaN" en pantalla.
 * 
 * @param {any} v - Valor a redondear
 * @returns {string} - Número con 1 decimal o "-"
 * 
 * Ejemplos:
 *   round1(1.234)     → "1.2"
 *   round1(1.856)     → "1.9"
 *   round1(null)      → "-"
 *   round1("abc")     → "-"
 *   round1(undefined) → "-"
 */
export function round1(v) {
  const n = Number(v);
  if (v == null || Number.isNaN(n)) return "-";
  return n.toFixed(1);
}

/**
 * fmtDateTime — Formatea fecha completa con hora
 * 
 * Formato: "DD/MM/YYYY HH:MM:SS AM/PM"
 * Localización: es-CO (Colombia)
 * 
 * Maneja:
 * - Strings de fecha ISO ("2026-05-05T14:34:56.000Z")
 * - Objetos Date
 * - Timestamps numéricos
 * - Valores inválidos → "-"
 * 
 * @param {string | Date | number} v - Fecha a formatear
 * @returns {string} - Fecha formateada o "-"
 * 
 * Ejemplos:
 *   fmtDateTime("2026-05-05T14:34:56Z")  → "05/05/2026 02:34:56 p.m."
 *   fmtDateTime(new Date())              → "05/05/2026 02:34:56 p.m."
 *   fmtDateTime(1714990496000)           → "05/05/2026 02:34:56 p.m."
 *   fmtDateTime(null)                    → "-"
 *   fmtDateTime("invalid")               → "-"
 */
export function fmtDateTime(v) {
  if (!v) return "-";
  
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  
  return d.toLocaleString("es-CO", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * fmtMinSeg — Convierte minutos decimales a formato "MM:SS"
 * 
 * Usado para mostrar tiempos de picking/operación.
 * 
 * Cálculo:
 * 1. Multiplica minutos × 60 → segundos totales
 * 2. Divide: minutos = total / 60, segundos = total % 60
 * 3. Formatea con leading zeros: "01:30"
 * 
 * @param {number} minutos - Minutos decimales (ej: 1.5 = 1 min 30 seg)
 * @returns {string} - Formato "MM:SS"
 * 
 * Ejemplos:
 *   fmtMinSeg(1.5)   → "01:30"
 *   fmtMinSeg(0.5)   → "00:30"
 *   fmtMinSeg(2.75)  → "02:45"
 *   fmtMinSeg(1.856) → "01:51"
 */
export function fmtMinSeg(minutos) {
  const total = Math.round(Number(minutos) * 60);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
