/**
 * PieByType.jsx
 * 
 * Componente de gráfica de torta (donut chart) que visualiza la distribución
 * de diarios por tipo usando Recharts.
 * 
 * Estructura:
 * - Leyenda custom a la izquierda
 * - Gráfica de torta al centro
 * - Etiquetas numéricas en cada slice
 * - Tooltips al pasar el ratón
 * 
 * Colores predefinidos en rotación:
 * - Amarillo (FBC41F): Principal
 * - Negro (#000): Secundario
 * - Gris (D3D3D3): Terciario
 */

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
} from "recharts";

// Paleta de colores fija (se repite si hay más de 5 tipos)
const COLORS = [
  "rgba(252, 191, 0, 1)",   // Amarillo (FBC41F)
  "#000000",                // Negro
  "rgba(211, 211, 211, 1)", // Gris claro
  "rgba(152, 119, 4, 1)", // Amarillo oscuro
  "rgba(104, 101, 95, 1)" // gris oscuro
];

/**
 * PieByType — Gráfica de distribución de diarios por tipo
 * 
 * Props:
 * @param {Array} data - Array de objetos con estructura:
 *   [
 *     { name: "Picking", value: 25 },
 *     { name: "Packing", value: 18 },
 *     { name: "Reabastecimiento", value: 12 }
 *   ]
 *   CRÍTICO:
 *   - "name": String que aparece en leyenda y tooltip
 *   - "value": Número que define el tamaño del slice
 * 
 * Renderizado:
 * - Leyenda en columna izquierda (flex)
 * - Gráfica donut en el centro-derecha
 * - Etiquetas numéricas dentro de cada slice
 * 
 * Estilos:
 * - Contenedor: flex, 100% width/height, minHeight: 0 (fix para Recharts)
 * - Leyenda: scrollable si hay muchos tipos
 * - Pie: innerRadius 40%, outerRadius 80%, etiquetas en blanco
 */
export default function PieByType({ data }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
        height: "90%",
        minHeight: 0,
      }}
    >
      {/* ── GRÁFICA (arriba) ──────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="80%"
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize={20}
                    fontWeight={900}
                    
                  >
                    {value}
                  </text>
                );
              }}
            >
              {data?.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ── LEYENDA (abajo, centrada) ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 30,
          justifyContent: "center",
          paddingTop: 8,
        }}
      >
        {data?.length ? (
          data.map((d, i) => (
            <div
              key={d.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {/* Punto de color */}
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  background: COLORS[i % COLORS.length],
                  flexShrink: 0,
                }}
              />
              {/* Nombre del tipo */}
              <span>{d.name}</span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 15, color: "#999" }}>Sin tipos</div>
        )}
      </div>
    </div>
  );
}
