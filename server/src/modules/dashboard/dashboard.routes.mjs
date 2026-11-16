/**
 * dashboard.routes.mjs
 * Definición de rutas del módulo Dashboard.
 *
 * Prefijo base (montado en server.mjs): /api/dashboard
 *
 * Slider 1:
 *   GET /api/dashboard/slider1/diarios-por-estado
 *   GET /api/dashboard/slider1/lineas-por-estado
 *   GET /api/dashboard/slider1/diarios-por-tipo
 *   GET /api/dashboard/slider1/top-sin-asignar
 *   GET /api/dashboard/slider1/aging
 *
 * Slider 2:
 *   GET /api/dashboard/slider2/top?periodo=dia
 *   GET /api/dashboard/slider2/top?periodo=mes
 *
 * Slider 3:
 *   GET /api/dashboard/slider3/detalle
 */

import { Router } from "express";
import {
  ctrlDiariosPorEstado,
  ctrlLineasPorEstado,
  ctrlDiariosPorTipo,
  ctrlTopSinAsignar,
  ctrlAging,
  ctrlTopUsuarios,
  ctrlDetalle,
} from "./dashboard.controller.mjs";

const router = Router();

// ── Slider 1 ──────────────────────────────────────────────────────────────────
router.get("/slider1/diarios-por-estado", ctrlDiariosPorEstado);
router.get("/slider1/lineas-por-estado",  ctrlLineasPorEstado);
router.get("/slider1/diarios-por-tipo",   ctrlDiariosPorTipo);
router.get("/slider1/top-sin-asignar",    ctrlTopSinAsignar);
router.get("/slider1/aging",              ctrlAging);

// ── Slider 2 ──────────────────────────────────────────────────────────────────
router.get("/slider2/top",                ctrlTopUsuarios);  // ?periodo=dia|mes

// ── Slider 3 ──────────────────────────────────────────────────────────────────
router.get("/slider3/detalle",            ctrlDetalle);

export default router;
