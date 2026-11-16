/**
 * Header.jsx
 * 
 * Componente de encabezado — Muestra logo, título, estado y meta-información.
 * 
 * Secciones:
 * 1. Logo (izquierda) — Imagen logo.png en caja amarilla
 * 2. Info (centro) — Título y hora de última actualización
 * 3. Pills (derecha) — Badges de estado (Compañía)
 * 
 * Props:
 * @param {number} [lastUpdate] - Timestamp de última actualización (milisegundos)
 * @param {string} [error] - Mensaje de error (si existe)
 * 
 * Ejemplo:
 *   <Header lastUpdate={Date.now()} error={null} />
 * 
 * Comportamiento:
 * - Muestra hora en formato: "05/05/2026 02:34:56 p.m."
 * - Si hay error: lo muestra en rojo
 * - Logo se oculta si no existe el archivo (fallback automático)
 */

import { API_BASE } from "../lib/api";
import { fmtDateTime } from "../lib/format";

/**
 * Header — Componente
 * 
 * @param {Object} props
 * @param {number} props.lastUpdate - ms desde epoch
 * @param {string} props.error - Texto de error o null
 */
export default function Header({ lastUpdate, error }) {
  return (
    <header className="hdr">
      {/* ── IZQUIERDA: Logo + Título ──────────────────────────────── */}
      <div className="hdrLeft">
        {/* Logo en caja amarilla (200x64px) */}
        <div className="logoBox">
          <img
            className="logoImg"
            src="logo.png"
            alt="Logo"
            onError={(e) => {
              // Si la imagen no existe, ocultarla (no rompe el layout)
              e.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* Información principal */}
        <div>
          {/* Título principal */}
          <div className="h1">WMS — Tablero de Productividad</div>

          {/* Subtítulo: Hora + Error (si existe) */}
          <div className="h2">
            Última actualización: <b>{lastUpdate ? fmtDateTime(lastUpdate) : "-"}</b>
            {error ? <span className="err"> · ERROR: {error}</span> : null}
          </div>
        </div>
      </div>

      {/* ── DERECHA: Badges/Pills de estado ──────────────────────── */}
      <div className="hdrRight">
        <span className="pill">Compañía: 010</span>
      </div>
    </header>
  );
}
