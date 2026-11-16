/**
 * api.js
 * 
 * Capa de acceso a datos (HTTP) del cliente React.
 * 
 * Responsabilidades:
 * - Centralizar URL base de la API (de .env o localhost)
 * - Proporcionar fetchDashboard() única función para cargar todos los datos
 * - Manejo de errores con mensajes descriptivos
 * - Compatibilidad con AbortController para cancelación
 * 
 * Uso:
 *   import { fetchDashboard } from './lib/api';
 *   
 *   const abortCtrl = new AbortController();
 *   const data = await fetchDashboard(abortCtrl.signal);
 *   // → { diariosPorEstado, lineasPorEstado, diariosPorTipo, ... }
 * 
 * Variables de entorno:
 *   VITE_API_BASE = URL del servidor (ej: http://localhost:4000)
 */

/**
 * API_BASE — URL base del servidor backend
 * 
 * Prioridad:
 * 1. import.meta.env.VITE_API_BASE (desde .env)
 * 2. http://localhost:4000 (fallback desarrollo)
 * 
 * En .env.example:
 *   VITE_API_BASE=http://192.168.1.100:4000
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

/**
 * fetchJSON — Fetch genérico con manejo de error
 * 
 * Características:
 * - Valida respuesta HTTP (status 200-299)
 * - Si error: intenta leer body como texto para contexto
 * - Compatible con AbortSignal (cancelación)
 * - Automáticamente parsea JSON
 * 
 * @param {string} url - URL completa a fetchear
 * @param {AbortSignal} [signal] - Señal de cancelación
 * @returns {Promise<any>} - JSON parseado
 * @throws {Error} - Si status error o JSON inválido
 * 
 * Ejemplo:
 *   const data = await fetchJSON(
 *     "http://localhost:4000/api/dashboard/health",
 *     abortController.signal
 *   );
 *   // → { status: "ok", sql: "ok" }
 */
export async function fetchJSON(url, signal) {
  const res = await fetch(url, { signal });
  
  if (!res.ok) {
    // Si hay error, intentar leer el body para incluir en mensaje
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${url}\n${text}`);
  }
  
  return res.json();
}

/**
 * fetchDashboard — Carga TODOS los datos del dashboard
 * 
 * Dispara 8 llamadas en paralelo (Promise.all):
 * - Slider 1: 5 endpoints (estado, tipo, sin asignar, aging)
 * - Slider 2: 2 endpoints (top día, top mes)
 * - Slider 3: 1 endpoint (detalle)
 * 
 * Estructura de respuesta del backend:
 *   { rows: [...], total: N, ts: "2026-05-05T..." }
 * 
 * Esta función extrae solo el array .rows de cada una.
 * 
 * @param {AbortSignal} [signal] - Para cancelar peticiones en vuelo
 * @returns {Promise<Object>} - Objeto con 8 arrays:
 *   {
 *     diariosPorEstado,    // Slider 1
 *     lineasPorEstado,     // Slider 1
 *     diariosPorTipo,      // Slider 1
 *     topSinAsignar,       // Slider 1
 *     aging,               // Slider 1
 *     topDia,              // Slider 2
 *     topMes,              // Slider 2
 *     detalle,             // Slider 3
 *   }
 * 
 * @throws {Error} - Si cualquier endpoint falla
 * 
 * Ejemplo:
 *   const abortCtrl = new AbortController();
 *   try {
 *     const data = await fetchDashboard(abortCtrl.signal);
 *     console.log(data.diariosPorEstado);  // array
 *   } catch (e) {
 *     console.error("Error cargando datos:", e.message);
 *   }
 *   
 *   // Cancelar peticiones pendientes:
 *   abortCtrl.abort();
 */
export async function fetchDashboard(signal) {
  const base = API_BASE;

  // Disparar 8 llamadas en paralelo
  const [
    diariosPorEstado,   // GET /api/dashboard/slider1/diarios-por-estado
    lineasPorEstado,    // GET /api/dashboard/slider1/lineas-por-estado
    diariosPorTipo,     // GET /api/dashboard/slider1/diarios-por-tipo
    topSinAsignar,      // GET /api/dashboard/slider1/top-sin-asignar
    aging,              // GET /api/dashboard/slider1/aging
    topDia,             // GET /api/dashboard/slider2/top?periodo=dia
    topMes,             // GET /api/dashboard/slider2/top?periodo=mes
    detalle,            // GET /api/dashboard/slider3/detalle
  ] = await Promise.all([
    fetchJSON(`${base}/api/dashboard/slider1/diarios-por-estado`, signal),
    fetchJSON(`${base}/api/dashboard/slider1/lineas-por-estado`,  signal),
    fetchJSON(`${base}/api/dashboard/slider1/diarios-por-tipo`,   signal),
    fetchJSON(`${base}/api/dashboard/slider1/top-sin-asignar`,    signal),
    fetchJSON(`${base}/api/dashboard/slider1/aging`,              signal),
    fetchJSON(`${base}/api/dashboard/slider2/top?periodo=dia`,    signal),
    fetchJSON(`${base}/api/dashboard/slider2/top?periodo=mes`,    signal),
    fetchJSON(`${base}/api/dashboard/slider3/detalle`,            signal),
  ]);

  // Extraer solo .rows de cada respuesta (fallback a [] si no existe)
  return {
    diariosPorEstado: diariosPorEstado.rows ?? [],
    lineasPorEstado:  lineasPorEstado.rows  ?? [],
    diariosPorTipo:   diariosPorTipo.rows   ?? [],
    topSinAsignar:    topSinAsignar.rows    ?? [],
    aging:            aging.rows            ?? [],
    topDia:           topDia.rows           ?? [],
    topMes:           topMes.rows           ?? [],
    detalle:          detalle.rows          ?? [],
  };
}
