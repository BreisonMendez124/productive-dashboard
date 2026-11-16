/**
 * dashboard.controller.mjs
 * Controladores HTTP del dashboard.
 *
 * Responsabilidad única: recibir la request, llamar al servicio
 * y devolver la respuesta. Sin lógica de negocio ni SQL aquí.
 */

import {
  getSlider1DiariosPorEstado,
  getSlider1LineasPorEstado,
  getSlider1DiariosPorTipo,
  getSlider1TopSinAsignar,
  getSlider1Aging,
  getTopUsuarios,
  getSlider3Detalle,
} from "./dashboard.service.mjs";

/** Helper para respuesta exitosa uniforme */
function ok(res, rows) {
  res.json({ rows, total: rows.length, ts: new Date().toISOString() });
}

/** Helper para error uniforme */
function fail(res, err, context = "") {
  console.error(`[CTRL] ${context}:`, err.message);
  res.status(500).json({
    error: context || "Error interno",
    message: err.message,
  });
}

// ── Slider 1 ──────────────────────────────────────────────────────────────────

export async function ctrlDiariosPorEstado(req, res) {
  try {
    ok(res, await getSlider1DiariosPorEstado());
  } catch (e) {
    fail(res, e, "diarios-por-estado");
  }
}

export async function ctrlLineasPorEstado(req, res) {
  try {
    ok(res, await getSlider1LineasPorEstado());
  } catch (e) {
    fail(res, e, "lineas-por-estado");
  }
}

export async function ctrlDiariosPorTipo(req, res) {
  try {
    ok(res, await getSlider1DiariosPorTipo());
  } catch (e) {
    fail(res, e, "diarios-por-tipo");
  }
}

export async function ctrlTopSinAsignar(req, res) {
  try {
    ok(res, await getSlider1TopSinAsignar());
  } catch (e) {
    fail(res, e, "top-sin-asignar");
  }
}

export async function ctrlAging(req, res) {
  try {
    ok(res, await getSlider1Aging());
  } catch (e) {
    fail(res, e, "aging");
  }
}

// ── Slider 2 ──────────────────────────────────────────────────────────────────

export async function ctrlTopUsuarios(req, res) {
  try {
    const { periodo = "dia" } = req.query;

    if (!["dia", "mes"].includes(periodo)) {
      return res.status(400).json({
        error: "Parámetro inválido",
        message: `"periodo" debe ser "dia" o "mes". Recibido: "${periodo}"`,
      });
    }

    ok(res, await getTopUsuarios({ periodo }));
  } catch (e) {
    fail(res, e, "top-usuarios");
  }
}

// ── Slider 3 ──────────────────────────────────────────────────────────────────

export async function ctrlDetalle(req, res) {
  try {
    ok(res, await getSlider3Detalle());
  } catch (e) {
    fail(res, e, "detalle-diarios");
  }
}
