/**
 * server.mjs
 * Punto de entrada del servidor Express.
 * IMPORTANTE: los routers se registran ANTES de app.listen().
 */

import { config } from "./core/env.mjs";
import { createApp } from "./app.mjs";
import dashboardRouter from "./modules/dashboard/dashboard.routes.mjs";

const app = createApp();

// ── Rutas ────────────────────────────────────────────────────────────────────
// Los use() deben ir ANTES de listen(); de lo contrario Express nunca los registra.
app.use("/api/dashboard", dashboardRouter);

// ── Arranque ─────────────────────────────────────────────────────────────────
const PORT = config.app.port;

app.listen(PORT, () => {
  console.log(`🚀  API corriendo en http://localhost:${PORT}`);
  console.log(`    Ambiente  : ${process.env.NODE_ENV ?? "development"}`);
  console.log(`    SQL Server: ${config.sql.server} / ${config.sql.database}`);
});
