/**
 * dashboard.service.mjs
 * Capa de acceso a datos del dashboard de Diaros.
 *
 * Todas las funciones usan parámetros SQL.
 * Constantes centralizadas al inicio.
 */

import { getPool } from "../../core/db.mjs";

// ── Constantes de negocio ────────────────────────────────────────────────
const FROM_DATE    = "2026-01-01";   // Fecha mínima para consultas
const ONLY_DS      = "DS%";          // Prefijo de Diarios de Selección
const ORD_ALMACEN  = ",Bog,";        // Filtro almacén en DAT_ORDINI (ORD_ELEAREE)
const RIG_ALMACEN  = "Bog";          // Filtro almacén en DAT_ORDINI_RIGHE (RIG_ELERUOLI_GEST)
const COMPANY_SUB1 = "010";          // Subcompañía (STO_SUB1)
const META_MIN     = 1.5;            // Meta de minutos por línea (productividad)

// ─────────────────────────────────────────────────────────────────────────
// SLIDER 1 — Estado de Diarios
// ─────────────────────────────────────────────────────────────────────────

/**
 * Cantidad de diarios por estado (excluye C, I, CI, (S)E).
 * Fuente: DAT_ORDINI (tabla activa)
 */
export async function getSlider1DiariosPorEstado() {
  const pool = await getPool();
  const r = pool.request();
  r.input("FromDate",   FROM_DATE);
  r.input("Ds",         ONLY_DS);
  r.input("OrdAlmacen", ORD_ALMACEN);

  const sql = `
    SELECT
      A.ORD_STATO        AS estado,
      COUNT(*)           AS cantidad_diarios
    FROM dbo.DAT_ORDINI A
    WHERE
      A.ORD_ORDINE LIKE @Ds
      AND A.ORD_DCREA    >= @FromDate
      AND A.ORD_ELEAREE   = @OrdAlmacen
      AND ISNULL(LTRIM(RTRIM(A.ORD_STATO)), '') <> ''
      AND A.ORD_STATO NOT IN ('C', 'I', 'CI')
      AND A.ORD_RIG_NESE_SOSP <> '1'
    GROUP BY A.ORD_STATO
    ORDER BY cantidad_diarios DESC, A.ORD_STATO ASC;
  `;

  const out = await r.query(sql);
  return out.recordset;
}

/**
 * Cantidad de líneas por estado (excluye C, I).
 * Fuente: DAT_ORDINI_RIGHE (tabla activa)
 */
export async function getSlider1LineasPorEstado() {
  const pool = await getPool();
  const r = pool.request();
  r.input("FromDate",   FROM_DATE);
  r.input("Ds",         ONLY_DS);
  r.input("RigAlmacen", RIG_ALMACEN);

  const sql = `
    SELECT
      B.RIG_STARIORD     AS estado,
      COUNT(*)           AS cantidad_lineas
    FROM dbo.DAT_ORDINI_RIGHE B
    WHERE
      B.RIG_ORDINE LIKE @Ds
      AND B.RIG_DCREA    >= @FromDate
      AND B.RIG_ELERUOLI_GEST = @RigAlmacen
      AND ISNULL(LTRIM(RTRIM(B.RIG_STARIORD)), '') <> ''
      AND B.RIG_STARIORD NOT IN ('C', 'I')
      AND B.RIG_NESE_SOSP <> '1'
    GROUP BY B.RIG_STARIORD
    ORDER BY cantidad_lineas DESC, B.RIG_STARIORD ASC;
  `;

  const out = await r.query(sql);
  return out.recordset;
}

/**
 * Cantidad de diarios por tipo (para gráfica de torta).
 * Fuente: DAT_ORDINI (tabla activa)
 */
export async function getSlider1DiariosPorTipo() {
  const pool = await getPool();
  const r = pool.request();
  r.input("FromDate",   FROM_DATE);
  r.input("Ds",         ONLY_DS);
  r.input("OrdAlmacen", ORD_ALMACEN);

  const sql = `
    SELECT
      A.ORD_DES                      AS tipo,
      COUNT(DISTINCT A.ORD_ORDINE)   AS cantidad_diarios
    FROM dbo.DAT_ORDINI A
    WHERE
      A.ORD_ORDINE LIKE @Ds
      AND A.ORD_DCREA    >= @FromDate
      AND A.ORD_ELEAREE   = @OrdAlmacen
      AND ISNULL(LTRIM(RTRIM(A.ORD_STATO)), '') <> ''
      AND A.ORD_STATO NOT IN ('C', 'I', 'CI')
      AND A.ORD_RIG_NESE_SOSP <> '1'
    GROUP BY A.ORD_DES
    ORDER BY cantidad_diarios DESC, A.ORD_DES ASC;
  `;

  const out = await r.query(sql);
  return out.recordset;
}

/**
 * TOP 10 diarios sin asignar del mes actual, ordenados por mayor tiempo abierto.
 * Fuente: DAT_ORDINI (tabla activa)
 */
export async function getSlider1TopSinAsignar() {
  const pool = await getPool();
  const r = pool.request();
  r.input("Ds",         ONLY_DS);
  r.input("OrdAlmacen", ORD_ALMACEN);

  const sql = `
    WITH base AS (
      SELECT
        A.ORD_ORDINE AS documento,
        A.ORD_DES    AS tipo,
        A.ORD_STATO  AS estado,
        A.ORD_DCREA  AS fecha_creado,
        DATEDIFF(MINUTE, A.ORD_DCREA, GETDATE()) AS minutos_abierto
      FROM dbo.DAT_ORDINI A
      WHERE
        A.ORD_ORDINE LIKE @Ds
        AND A.ORD_ELEAREE = @OrdAlmacen
        AND YEAR(A.ORD_DCREA)  = YEAR(GETDATE())
        AND MONTH(A.ORD_DCREA) = MONTH(GETDATE())
        AND ISNULL(LTRIM(RTRIM(A.ORD_STATO)), '') <> ''
        AND A.ORD_STATO NOT IN ('I', 'C')
        AND A.ORD_RIG_NESE_SOSP <> '1'
        AND NULLIF(LTRIM(RTRIM(ISNULL(A.ORD_ESE_OPERATORE, ''))), '') IS NULL
    )
    SELECT TOP (10)
      documento,
      tipo,
      estado,
      fecha_creado,
      minutos_abierto,
      RIGHT('00' + CAST(minutos_abierto / 60 AS VARCHAR(10)), 2) + ':' +
      RIGHT('00' + CAST(minutos_abierto % 60 AS VARCHAR(10)), 2) AS tiempo_hhmm
    FROM base
    ORDER BY minutos_abierto DESC, fecha_creado ASC;
  `;

  const out = await r.query(sql);
  return out.recordset;
}

/**
 * Antigüedad de diarios abiertos en 3 categorías:
 *   - Menos de 30 min  → verde (#34C759)
 *   - 30 min a 1h      → amarillo (#FBC41F)
 *   - Más de 1h        → rojo (#FF3B30)
 * Fuente: DAT_ORDINI (tabla activa)
 */
export async function getSlider1Aging() {
  const pool = await getPool();
  const r = pool.request();
  r.input("Ds",         ONLY_DS);
  r.input("OrdAlmacen", ORD_ALMACEN);
  r.input("FromDate",   FROM_DATE);

  const sql = `
    WITH base AS (
      SELECT
        DATEDIFF(MINUTE, A.ORD_DCREA, GETDATE()) AS minutos_abierto
      FROM dbo.DAT_ORDINI A
      WHERE
        A.ORD_ORDINE LIKE @Ds
        AND A.ORD_DCREA    >= @FromDate
        AND A.ORD_ELEAREE   = @OrdAlmacen
        AND ISNULL(LTRIM(RTRIM(A.ORD_STATO)), '') <> ''
        AND A.ORD_STATO NOT IN ('C', 'I', 'CI')
        AND A.ORD_STATO    <> '(S)E'
        AND A.ORD_RIG_NESE_SOSP <> '1'
      
    ),
    categorizado AS (
      SELECT
        CASE
          WHEN minutos_abierto < 30              THEN 'Menos de 30 min'
          WHEN minutos_abierto >= 30
           AND minutos_abierto < 60              THEN 'Entre 30 min y 1h'
          ELSE                                        'Más de 1h'
        END AS categoria,
        CASE
          WHEN minutos_abierto < 30              THEN '#34C759'
          WHEN minutos_abierto >= 30
           AND minutos_abierto < 60              THEN '#FBC41F'
          ELSE                                        '#FF3B30'
        END AS color,
        CASE
          WHEN minutos_abierto < 30              THEN 1
          WHEN minutos_abierto >= 30
           AND minutos_abierto < 60              THEN 2
          ELSE                                        3
        END AS orden
      FROM base
    )
    SELECT
      categoria,
      COUNT(*) AS cantidad,
      color
    FROM categorizado
    GROUP BY categoria, color, orden
    ORDER BY orden;
  `;

  const out = await r.query(sql);
  return out.recordset;
}

// ─────────────────────────────────────────────────────────────────────────
// SLIDER 2 — Ranking de Productividad por Operador
// ─────────────────────────────────────────────────────────────────────────

/**
 * Ranking de productividad de operadores (día actual).
 * 
 * Fuente: STA_STORICO (tabla histórica de tiempos)
 * Cruce: 
 *   - Primero busca diario en DAT_ORDINI (tabla activa)
 *   - Si no existe, busca en STA_STO_ORDINI (histórico)
 *   - Filtra por almacén (ORD_ELEAREE = ',Bog,')
 * 
 * Usa STO_DURATA (segundos reales de picking) para cálculos de productividad.
 * Score = lineas_completadas × (META_MIN / avg_minutos_por_linea)
 * Mayor score = más productivo
 * 
 * @returns {Array} Ranking ordenado por score descendente
 */
export async function getTopUsuariosDia() {
  const pool = await getPool();
  const r = pool.request();
  r.input("CompSub1",  COMPANY_SUB1);
  r.input("Ds",        ONLY_DS);
  r.input("OrdAlmacen", ORD_ALMACEN);

  const sql = `
    WITH diarios_almacen AS (
      -- Diarios activos (DAT_ORDINI)
      SELECT ORD_ORDINE
      FROM dbo.DAT_ORDINI
      WHERE ORD_ORDINE LIKE @Ds
        AND ORD_ELEAREE = @OrdAlmacen
        AND ORD_RIG_NESE_SOSP <> '1'
      
      UNION ALL
      
      -- Diarios históricos (STA_STO_ORDINI) si no están en activos
      SELECT ORD_ORDINE
      FROM dbo.STA_STO_ORDINI
      WHERE ORD_ORDINE LIKE @Ds
        AND ORD_ELEAREE = @OrdAlmacen
        AND ORD_ORDINE NOT IN (
          SELECT ORD_ORDINE FROM dbo.DAT_ORDINI
          WHERE ORD_ORDINE LIKE @Ds
        )
    )
    SELECT
      A.STO_EXE_OPERATORE AS usuario,
      AVG(A.STO_DURATA / 60.0)  AS avg_minutos,
      COUNT(*)                  AS lineas_completadas,
      COUNT(*) * (${META_MIN} / NULLIF(AVG(A.STO_DURATA / 60.0), 0)) AS score_productividad
    FROM dbo.STA_STORICO A
    INNER JOIN diarios_almacen D ON D.ORD_ORDINE = A.STO_ORDINE
    WHERE
      A.STO_SUB1      = @CompSub1
      AND A.STO_ORDINE LIKE @Ds
      AND A.STO_STARIORD = 'C'
      AND A.STO_DURATA IS NOT NULL
      AND CONVERT(date, A.STO_TIME) = CONVERT(date, GETDATE())
      AND NULLIF(LTRIM(RTRIM(ISNULL(A.STO_EXE_OPERATORE, ''))), '') IS NOT NULL
    GROUP BY A.STO_EXE_OPERATORE
    ORDER BY score_productividad DESC, lineas_completadas DESC, avg_minutos ASC;
  `;

  const out = await r.query(sql);
  return out.recordset;
}

/**
 * Ranking de productividad de operadores (mes actual).
 * 
 * Fuente: STA_STORICO (tabla histórica)
 * Cruce:
 *   - Primero busca diario en DAT_ORDINI (tabla activa)
 *   - Si no existe, busca en STA_STO_ORDINI (histórico)
 *   - Filtra por almacén (ORD_ELEAREE = ',Bog,')
 * 
 * Misma lógica que día, pero para el mes completo.
 * 
 * @returns {Array} Ranking ordenado por score descendente
 */
export async function getTopUsuariosMes() {
  const pool = await getPool();
  const r = pool.request();
  r.input("CompSub1", COMPANY_SUB1);
  r.input("Ds",       ONLY_DS);
  r.input("OrdAlmacen", ORD_ALMACEN);

  const sql = `
    WITH diarios_almacen AS (
      -- Diarios activos (DAT_ORDINI)
      SELECT ORD_ORDINE
      FROM dbo.DAT_ORDINI
      WHERE ORD_ORDINE LIKE @Ds
        AND ORD_ELEAREE = @OrdAlmacen
        AND ORD_RIG_NESE_SOSP <> '1'
      
      UNION ALL
      
      -- Diarios históricos (STA_STO_ORDINI) si no están en activos
      SELECT ORD_ORDINE
      FROM dbo.STA_STO_ORDINI
      WHERE ORD_ORDINE LIKE @Ds
        AND ORD_ELEAREE = @OrdAlmacen
        AND ORD_ORDINE NOT IN (
          SELECT ORD_ORDINE FROM dbo.DAT_ORDINI
          WHERE ORD_ORDINE LIKE @Ds
                AND ORD_RIG_NESE_SOSP <> '1'
        )
    )
    SELECT
      A.STO_EXE_OPERATORE AS usuario,
      AVG(A.STO_DURATA / 60.0)  AS avg_minutos,
      COUNT(*)                  AS lineas_completadas,
      COUNT(*) * (${META_MIN} / NULLIF(AVG(A.STO_DURATA / 60.0), 0)) AS score_productividad
    FROM dbo.STA_STORICO A
    INNER JOIN diarios_almacen D ON D.ORD_ORDINE = A.STO_ORDINE
    WHERE
      A.STO_SUB1      = @CompSub1
      AND A.STO_ORDINE LIKE @Ds
      AND A.STO_STARIORD = 'C'
      AND A.STO_DURATA IS NOT NULL
      AND YEAR(A.STO_TIME) = YEAR(GETDATE())
      AND MONTH(A.STO_TIME) = MONTH(GETDATE())
      AND NULLIF(LTRIM(RTRIM(ISNULL(A.STO_EXE_OPERATORE, ''))), '') IS NOT NULL
    GROUP BY A.STO_EXE_OPERATORE
    ORDER BY score_productividad DESC, lineas_completadas DESC, avg_minutos ASC;
  `;

  const out = await r.query(sql);
  return out.recordset;
}

/**
 * Wrapper compatible con la interfaz antigua getTopUsuarios({ periodo })
 * Valida el periodo y delega a getTopUsuariosDia o getTopUsuariosMes
 */
export async function getTopUsuarios({ periodo = "dia" } = {}) {
  const p = String(periodo)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!["dia", "mes"].includes(p)) {
    throw new Error(`Período inválido: "${periodo}". Use "dia" o "mes".`);
  }

  return p === "dia" ? getTopUsuariosDia() : getTopUsuariosMes();
}

// ─────────────────────────────────────────────────────────────────────────
// SLIDER 3 — Detalle de Diarios en Proceso
// ─────────────────────────────────────────────────────────────────────────

/**
 * TOP 20 diarios activos con detalle de líneas y tiempo abierto.
 * 
 * Cuenta líneas por diario desde DAT_ORDINI_RIGHE (líneas activas).
 * Obtiene info del diario desde DAT_ORDINI (tabla activa).
 * Excluye estados: C, I, CI, (S)E
 * 
 * Fuente: DAT_ORDINI + DAT_ORDINI_RIGHE
 */
export async function getSlider3Detalle() {
  const pool = await getPool();
  const r = pool.request();
  r.input("Ds",         ONLY_DS);
  r.input("OrdAlmacen", ORD_ALMACEN);
  r.input("RigAlmacen", RIG_ALMACEN);
  r.input("FromDate",   FROM_DATE);

  const sql = `
    WITH lineas AS (
      -- Conteo de líneas por diario (excluye líneas canceladas)
      SELECT
        B.RIG_ORDINE AS documento,
        COUNT(CASE WHEN B.RIG_STARIORD <> 'I' THEN 1 END) AS lineas_total
      FROM dbo.DAT_ORDINI_RIGHE B
      WHERE
        B.RIG_ORDINE   LIKE @Ds
        AND B.RIG_DCREA >= @FromDate
        AND B.RIG_ELERUOLI_GEST = @RigAlmacen
        AND B.RIG_NESE_SOSP <> '1'
      GROUP BY B.RIG_ORDINE
    ),
    base AS (
      SELECT TOP (20)
        A.ORD_ORDINE AS documento,
        A.ORD_DES    AS tipo,
        A.ORD_STATO  AS estado_diario,
        A.ORD_DCREA  AS fecha_creado,
        NULLIF(LTRIM(RTRIM(ISNULL(A.ORD_ESE_OPERATORE, ''))), '') AS asignado,
        ISNULL(L.lineas_total, 0) AS lineas_total,
        DATEDIFF(MINUTE, A.ORD_DCREA, GETDATE()) AS minutos_abierto
      FROM dbo.DAT_ORDINI A
      LEFT JOIN lineas L ON L.documento = A.ORD_ORDINE
      WHERE
        A.ORD_ORDINE LIKE @Ds
        AND A.ORD_DCREA    >= @FromDate
        AND A.ORD_ELEAREE   = @OrdAlmacen
        AND ISNULL(LTRIM(RTRIM(A.ORD_STATO)), '') <> ''
        AND A.ORD_STATO NOT IN ('C', 'I', 'CI')
        AND A.ORD_STATO    <> '(S)E'
        AND A.ORD_RIG_NESE_SOSP <> '1'
      ORDER BY A.ORD_DCREA DESC
    )
    SELECT
      documento,
      tipo,
      estado_diario,
      fecha_creado,
      asignado,
      lineas_total,
      minutos_abierto,
      RIGHT('00' + CAST(minutos_abierto / 60 AS VARCHAR(10)), 2) + ':' +
      RIGHT('00' + CAST(minutos_abierto % 60 AS VARCHAR(10)), 2) AS tiempo_hhmm
    FROM base
    ORDER BY fecha_creado DESC;
  `;

  const out = await r.query(sql);
  return out.recordset;
}
