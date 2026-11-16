/**
 * env.mjs
 * Única fuente de verdad para la configuración del servidor.
 *
 * Lee las variables de entorno UNA sola vez al arrancar.
 * Si falta alguna variable requerida, el proceso termina con un mensaje claro
 * en lugar de fallar silenciosamente más adelante.
 *
 * Variables requeridas en .env:
 *   SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD
 *
 * Variables opcionales:
 *   PORT            (default: 4000)
 *   SQL_ENCRYPT     (default: false)
 *   SQL_TRUST_CERT  (default: true)
 *   CORS_ORIGINS    (default: http://localhost:5173)
 *   NODE_ENV        (default: development)
 */

import dotenv from "dotenv";
dotenv.config();

/**
 * Obtiene una variable de entorno requerida.
 * Lanza un error descriptivo si no está definida.
 * @param {string} name
 * @returns {string}
 */
function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Variable de entorno requerida no definida: "${name}". ` +
      `Verifica tu archivo .env.`
    );
  }
  return value.trim();
}

/**
 * Obtiene una variable de entorno opcional con valor por defecto.
 * @param {string} name
 * @param {string} defaultValue
 * @returns {string}
 */
function optional(name, defaultValue) {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : defaultValue;
}

export const config = {
  app: {
    port: Number(optional("PORT", "4000")),
    nodeEnv: optional("NODE_ENV", "development"),
    // Lista de orígenes permitidos por CORS separados por coma.
    // Ejemplo en .env: CORS_ORIGINS=http://tv-almacen.gecolsa.local,http://localhost:5173
    corsOrigins: optional("CORS_ORIGINS", "http://localhost:5173")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  },
  sql: {
    server:   required("SQL_SERVER"),
    database: required("SQL_DATABASE"),
    user:     required("SQL_USER"),
    password: required("SQL_PASSWORD"),
    encrypt:  optional("SQL_ENCRYPT", "false") === "true",
    trustCert: optional("SQL_TRUST_CERT", "true") === "true",
  },
};
