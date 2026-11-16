/**
 * db.mjs
 * Gestión del pool de conexiones a SQL Server.
 *
 * - Usa config de env.mjs (única fuente de verdad).
 * - Patrón singleton: el pool se crea una vez y se reutiliza.
 * - Si el pool muere, el siguiente getPool() intenta reconectar.
 */

import sql from "mssql";
import { config } from "./env.mjs";

/** @type {sql.ConnectionPool | null} */
let pool = null;

const sqlConfig = {
  server:   config.sql.server,
  database: config.sql.database,
  user:     config.sql.user,
  password: config.sql.password,
  options: {
    encrypt:                config.sql.encrypt,
    trustServerCertificate: config.sql.trustCert,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30_000,
  },
  requestTimeout:    120_000,  // 2 min — queries complejas del dashboard
  connectionTimeout:  30_000,
};

/**
 * Retorna el pool de conexiones activo.
 * Si no existe o está cerrado, crea uno nuevo.
 * @returns {Promise<sql.ConnectionPool>}
 */
export async function getPool() {
  if (pool && pool.connected) return pool;

  try {
    pool = await sql.connect(sqlConfig);

    pool.on("error", (err) => {
      console.error("[DB] Error en el pool:", err.message);
      pool = null; // fuerza reconexión en la próxima llamada
    });

    console.log(
      `[DB] Pool conectado → ${config.sql.server}/${config.sql.database}`
    );
    return pool;
  } catch (err) {
    pool = null;
    throw new Error(`[DB] No se pudo conectar a SQL Server: ${err.message}`);
  }
}
