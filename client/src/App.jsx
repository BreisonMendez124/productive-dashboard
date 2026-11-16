/**
 * App.jsx - Componente raíz del WMS Dashboard
 * 
 * Responsabilidades:
 * - Gestiona estado global (data, loading, error, lastUpdate)
 * - Controla refresco automático cada 15 segundos (AbortController para cancelaciones)
 * - Renderiza 3 slides que rotan automáticamente cada 20 segundos
 * - Todas las URLs de API se cargan desde lib/api.js (sin hardcodeo aquí)
 * 
 * Estructura:
 * - Header: muestra hora última actualización y errores
 * - Carousel: alterna entre Slide1, Slide2, Slide3
 * - Componentes internos: Panel, BasicTable, AgingCards, ScoreBar, TopTable
 * 
 * Flujo de datos:
 * fetch (api.js) → App state → Slide1/2/3 → componentes UI
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "./App.css";

import { fetchDashboard } from "./lib/api";
import { fmtDateTime }    from "./lib/format";
import Header             from "./components/Header";
import Carousel           from "./components/Carousel";
import PieByType          from "./components/PieByType";

// ── Constantes ────────────────────────────────────────────────────────────────
const REFRESH_MS = 15_000;   // Refresco automático cada 15 segundos
const META_MIN   = 1.5;      // Meta de productividad: 1.5 minutos por línea

// ── Componentes de UI reutilizables ───────────────────────────────────────────

/**
 * Panel — Contenedor estilizado con borde y título
 * 
 * @param {string} title - Título del panel
 * @param {ReactNode} children - Contenido
 * @param {object} style - Estilos CSS adicionales
 */
function Panel({ title, children, style = {} }) {
  return (
    <div
      style={{
        background:   "#fff",
        border:       "2px solid #000",
        borderRadius: 14,
        boxShadow:    "0 4px 0 #000",
        padding:      10,
        minHeight:    0,
        ...style,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

/**
 * BasicTable — Tabla genérica con columnas configurables
 * 
 * @param {Array} columns - [ { key, label, align?, render? }, ... ]
 * @param {Array} rows - Datos a mostrar
 * @param {string} empty - Texto cuando no hay datos
 * @param {function} rowStyle - función que retorna style({ r }) para cada fila
 */
function BasicTable({ columns, rows, empty = "Sin datos", rowStyle }) {
  return (
    <div style={{ width: "100%", overflow: "auto", maxHeight: "100%" }}>
      <table
        style={{
          width:           "100%",
          borderCollapse:  "separate",
          borderSpacing:   0,
          border:          "1px solid #000",
          borderRadius:    12,
          overflow:        "hidden",
        }}
      >
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign:    c.align || "left",
                  padding:      "10px",
                  background:   "rgba(251,196,31,1)",
                  borderBottom: "2px solid #000",
                  fontSize:     12,
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows?.length ? (
            rows.map((r, idx) => (
              <tr key={idx} style={rowStyle ? rowStyle(r) : undefined}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding:       "10px",
                      fontSize:      12,
                      borderBottom:  "1px solid rgba(211,211,211,1)",
                      textAlign:     c.align || "left",
                      whiteSpace:    "nowrap",
                    }}
                  >
                    {typeof c.render === "function" ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} style={{ padding: 12, fontSize: 12 }}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Slide 1 — Estado de Diarios ───────────────────────────────────────────────

/**
 * AgingCards — Muestra antigüedad en 3 tarjetas (color codificadas)
 * 
 * Categorías:
 * - < 30 min (verde)
 * - 30-60 min (amarillo)
 * - > 1h (rojo)
 */
function AgingCards({ rows }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
      {rows?.length ? (
        rows.map((r, i) => (
          <div
            key={i}
            style={{
              background:   r.color || "#eee",
              border:       "2px solid #000",
              borderRadius: 14,
              boxShadow:    "0 3px 0 #000",
              padding:      10,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900 }}>{r.categoria}</div>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
              {r.cantidad}
            </div>
          </div>
        ))
      ) : (
        <div style={{ fontSize: 12, opacity: 0.6 }}>Sin DS abiertos.</div>
      )}
    </div>
  );
}

/**
 * StateLegend — Tabla de referencia de estados de Diarios
 * 
 * Estados soportados:
 * S, W, E, I, C, EI, EC, CI, (S)E
 */
function StateLegend() {
  const items = [
    ["S",  "En espera pero no ejecutable"],
    ["W",  "En espera"],
    ["E",  "Listo para trabajar"],
    ["I",  "Error/Incidencia"],
    ["C",  "Completado"],
    ["EI", "Listo con incidencia"],
    ["EC", "Completado con incidencia"],
  ];

  return (
    <div
      style={{
        fontSize:     11,
        background:   "#fff",
        border:       "1px dashed #000",
        borderRadius: 12,
        padding:      8,
        lineHeight:   1.6,
      }}
    >
      {items.map(([k, v]) => (
        <div key={k}>
          <b>{k}</b> = {v}
        </div>
      ))}
    </div>
  );
}

/**
 * Slide 1 — Vista de Estado de Diarios
 * 
 * Layout 3 columnas:
 * - Col1: Resumen + Tablas (diarios por estado, líneas por estado)
 * - Col2: Gráfica de torta (diarios por tipo)
 * - Col3: TOP sin asignar + Aging + Leyenda
 * 
 * @param {Array} diariosPorEstado - [ { estado, cantidad_diarios }, ... ]
 * @param {Array} lineasPorEstado - [ { estado, cantidad_lineas }, ... ]
 * @param {Array} diariosPorTipo - [ { tipo, cantidad_diarios }, ... ]
 * @param {Array} topSinAsignar - [ { documento, tipo, estado, fecha_creado, tiempo_hhmm }, ... ]
 * @param {Array} aging - [ { categoria, cantidad, color }, ... ]
 */
function Slide1({ diariosPorEstado, lineasPorEstado, diariosPorTipo, topSinAsignar, aging }) {
  // Totaliza diarios activos
  const totalDiarios = useMemo(
    () => diariosPorEstado.reduce((acc, r) => acc + Number(r.cantidad_diarios || 0), 0),
    [diariosPorEstado]
  );

  // Totaliza líneas activas
  const totalLineas = useMemo(
    () => lineasPorEstado.reduce((acc, r) => acc + Number(r.cantidad_lineas || 0), 0),
    [lineasPorEstado]
  );

  // Transforma datos para la gráfica de torta
  // IMPORTANTE: La columna es "cantidad_diarios", no "lineas"
  const pieData = useMemo(
    () =>
      diariosPorTipo.map((r) => ({
        name: r.tipo,          // Nombre para recharts
        value: Number(r.cantidad_diarios || 0), // Valor numérico
      })),
    [diariosPorTipo]
  );

  return (
    <div className="slideGrid">
      <div className="viewTitle">Diarios de Selección</div>

      <div className="threeCols">
        {/* Columna 1 — Resumen + tablas de estado */}
        <div className="colStack">
          <Panel title="Resumen general">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div
                style={{
                  background:   "rgba(251,196,31,1)",
                  border:       "2px solid #000",
                  borderRadius: 14,
                  boxShadow:    "0 3px 0 #000",
                  padding:      10,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900 }}>Diarios en proceso</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{totalDiarios}</div>
              </div>

              <div
                style={{
                  background:   "#000",
                  color:        "rgba(251,196,31,1)",
                  border:       "2px solid #000",
                  borderRadius: 14,
                  boxShadow:    "0 3px 0 #000",
                  padding:      10,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 900 }}>Líneas en proceso</div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{totalLineas}</div>
              </div>
            </div>
          </Panel>

          <Panel title="Diarios por estado">
            <BasicTable
              columns={[
                { key: "estado",           label: "Estado" },
                { key: "cantidad_diarios", label: "Cant. Diarios", align: "right" },
              ]}
              rows={diariosPorEstado}
            />
          </Panel>

          <Panel title="Líneas por estado">
            <BasicTable
              columns={[
                { key: "estado",          label: "Estado" },
                { key: "cantidad_lineas", label: "Cant. Líneas", align: "right" },
              ]}
              rows={lineasPorEstado}
            />
          </Panel>
        </div>

        {/* Columna 2 — Gráfica de torta */}
        <div className="colStack">
          <Panel title="Diarios por tipo" style={{ flex: 1 }}>
            <PieByType data={pieData} />
          </Panel>
        </div>

        {/* Columna 3 — Sin asignar + aging + leyenda */}
        <div className="colStack">
          <Panel title="TOP DS sin asignar — mes actual">
            <BasicTable
              columns={[
                { key: "documento",   label: "DS" },
                { key: "tipo",        label: "Tipo" },
                { key: "estado",      label: "Estado" },
                { key: "tiempo_hhmm", label: "Tiempo", align: "right" },
              ]}
              rows={topSinAsignar}
            />
          </Panel>

          <Panel title="Antigüedad de DS abiertos">
            <AgingCards rows={aging} />
          </Panel>

          <Panel title="Significado de estados">
            <StateLegend />
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ── Slide 2 — Productividad de Operadores ─────────────────────────────────────

/**
 * ScoreBar — Barra visual de productividad
 * 
 * La barra se llena al 100% cuando avgMinutos = meta.
 * Si avgMinutos < meta → la barra está "sobre-llena" → se capsula en 100% (verde)
 * Si avgMinutos > meta → la barra está sub-llena (rojo)
 * 
 * @param {number} avgMinutos - Promedio de minutos por línea
 * @param {number} meta - Meta de minutos (default 1.5)
 */
function ScoreBar({ avgMinutos, meta = META_MIN }) {
  const v   = Number(avgMinutos || 0);
  const ok  = v <= meta && v > 0; // Verde si está en o bajo meta
  const pct = v > 0 ? Math.min(100, (meta / v) * 100) : 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width:        120,
          height:       10,
          background:   "rgba(211,211,211,0.8)",
          borderRadius: 999,
          border:       "1px solid #000",
          overflow:     "hidden",
        }}
      >
        <div
          style={{
            height:     "100%",
            width:      `${pct}%`,
            background: ok ? "rgba(251,196,31,1)" : "#ff3b30",
          }}
        />
      </div>
      <span style={{ fontWeight: 800, fontSize: 12 }}>
        {v > 0 ? `${v.toFixed(1)} min` : "-"}
      </span>
    </div>
  );
}

/**
 * TopTable — Tabla de ranking de operadores
 * 
 * Columnas:
 * - #: Posición (1, 2, 3, ...)
 * - Operador: Nombre del usuario
 * - Prom. (meta X min): Barra visual con tiempo promedio
 * - Líneas C: Cantidad de líneas completadas
 * - Score: Puntuación de productividad
 * 
 * @param {string} title - Título del panel
 * @param {Array} rows - [ { usuario, avg_minutos, lineas_completadas, score_productividad }, ... ]
 */
function TopTable({ title, rows }) {
  const columns = [
    {
      key: "rank",
      label: "#",
      align: "right",
      render: (_, idx) => idx + 1,
    },
    {
      key: "usuario",
      label: "Operador",
    },
    {
      key: "avg_minutos",
      label: `Prom. (meta ${META_MIN} min)`,
      render: (r) => <ScoreBar avgMinutos={r.avg_minutos} />,
    },
    {
      key: "lineas_completadas",
      label: "Líneas C",
      align: "right",
    },
    {
      key: "score_productividad",
      label: "Score",
      align: "right",
      render: (r) => Number(r.score_productividad || 0).toFixed(0),
    },
  ];

  return (
    <Panel title={title} style={{ height: "100%" }}>
      <div style={{ width: "100%", overflow: "auto", maxHeight: "100%" }}>
        <table
          style={{
            width:          "100%",
            borderCollapse: "separate",
            borderSpacing:  0,
            border:         "1px solid #000",
            borderRadius:   12,
            overflow:       "hidden",
          }}
        >
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={{
                    textAlign:    c.align || "left",
                    padding:      "10px",
                    background:   "rgba(251,196,31,1)",
                    borderBottom: "2px solid #000",
                    fontSize:     12,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((r, idx) => (
                <tr key={idx}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        padding:      "10px",
                        fontSize:     12,
                        borderBottom: "1px solid rgba(211,211,211,1)",
                        textAlign:    c.align || "left",
                        whiteSpace:   "nowrap",
                      }}
                    >
                      {typeof c.render === "function" ? c.render(r, idx) : r[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: 12, fontSize: 12 }}>
                  Sin datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/**
 * Slide 2 — Vista de Productividad
 * 
 * Layout 2 columnas:
 * - TopTable (Día actual)
 * - TopTable (Mes actual)
 * 
 * @param {Array} topDia - Ranking del día
 * @param {Array} topMes - Ranking del mes
 */
function Slide2({ topDia, topMes }) {
  return (
    <div className="slideGrid">
      <div className="viewTitle">Productividad de Operadores</div>

      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "1fr 1fr",
          gap:                 16,
          height:              "100%",
          minHeight:           0,
        }}
      >
        <TopTable
          title={`TOP día actual — score (líneas × meta / prom.) · meta ${META_MIN} min`}
          rows={topDia}
        />
        <TopTable
          title={`TOP mes actual — acumulado mes · meta ${META_MIN} min`}
          rows={topMes}
        />
      </div>
    </div>
  );
}

// ── Slide 3 — Detalle de Diarios en Proceso ───────────────────────────────────

/**
 * Slide 3 — Vista de Detalle
 * 
 * TOP 20 diarios activos con información completa:
 * - DS (documento)
 * - Tipo
 * - Estado actual
 * - Fecha de creación
 * - Operador asignado
 * - Cantidad de líneas
 * - Tiempo abierto (HH:MM)
 * 
 * Resaltado: Si el diario lleva > 120 minutos abierto → fondo rosado
 * 
 * @param {Array} detalle - [ { documento, tipo, estado_diario, fecha_creado, asignado, lineas_total, tiempo_hhmm, minutos_abierto }, ... ]
 */
function Slide3({ detalle }) {
  const columns = [
    { key: "documento",     label: "DS" },
    { key: "tipo",          label: "Tipo" },
    { key: "estado_diario", label: "Estado" },
    {
      key:    "fecha_creado",
      label:  "Fecha creado",
      render: (r) => fmtDateTime(r.fecha_creado),
    },
    { key: "asignado",      label: "Asignado" },
    { key: "lineas_total",  label: "# Líneas", align: "right" },
    { key: "tiempo_hhmm",   label: "Tiempo",   align: "right" },
  ];

  return (
    <div className="slideGrid">
      <div className="viewTitle">Detalle DS en Proceso (TOP 20)</div>

      <Panel title="Diarios activos — excluye estados C e I">
        <BasicTable
          columns={columns}
          rows={detalle}
          rowStyle={(r) =>
            Number(r.minutos_abierto || 0) > 120
              ? { background: "#FFDDD6" }
              : undefined
          }
        />
      </Panel>
    </div>
  );
}

// ── Componente raíz ───────────────────────────────────────────────────────────

/**
 * App — Componente raíz del WMS Dashboard
 * 
 * Estados:
 * - data: Objeto con 8 arrays (diariosPorEstado, lineasPorEstado, etc.)
 * - loading: true mientras carga
 * - error: Mensaje de error si fetch falla
 * - lastUpdate: Timestamp de la última actualización
 * 
 * Refresco:
 * - Se ejecuta al montar
 * - Se repite cada 15 segundos
 * - AbortController cancela peticiones en vuelo
 * 
 * Renderizado:
 * - Header: Muestra estado, error, hora última actualización
 * - Carousel: Rota entre Slide1, Slide2, Slide3 cada 20 segundos
 */
export default function App() {
  const [data,        setData]        = useState(null);
  const [lastUpdate,  setLastUpdate]  = useState(null);
  const [error,       setError]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  const abortRef = useRef(null);

  /**
   * refresh — Carga todos los datos del dashboard
   * 
   * Flujo:
   * 1. Cancela petición anterior (si existe)
   * 2. Crea nuevo AbortController
   * 3. Llama fetchDashboard (lib/api.js)
   * 4. Actualiza state con los datos
   * 5. Registra hora de actualización
   * 6. Si hay error, lo guarda en state
   */
  const refresh = useCallback(async () => {
    // Cancela la petición anterior si aún está en vuelo
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setError(null);

    try {
      const result = await fetchDashboard(abortRef.current.signal);
      setData(result);
      setLastUpdate(Date.now());
    } catch (e) {
      // Ignorar cancelaciones normales de AbortController
      if (e.name === "AbortError") return;
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * useEffect — Inicia refresco automático
   * 
   * - Carga datos al montar
   * - Programa refresco cada 15 segundos
   * - Cancela peticiones pendientes al desmontar
   */
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [refresh]);

  return (
    <div className="page">
      <div className="stage">
        <Header lastUpdate={lastUpdate} error={error} />

        <div className="content">
          {loading && <div className="loading">Cargando…</div>}

          {!loading && data && (
            <Carousel intervalMs={[20_000]}>
              <Slide1
                diariosPorEstado={data.diariosPorEstado}
                lineasPorEstado={data.lineasPorEstado}
                diariosPorTipo={data.diariosPorTipo}
                topSinAsignar={data.topSinAsignar}
                aging={data.aging}
              />
              <Slide2
                topDia={data.topDia}
                topMes={data.topMes}
              />
              <Slide3
                detalle={data.detalle}
              />
            </Carousel>
          )}
        </div>
      </div>
    </div>
  );
}
