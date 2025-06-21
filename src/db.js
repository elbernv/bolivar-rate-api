import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});
/**
 * Inserta las tasas de cambio en la tabla tasas_cambio.
 *
 * @param {Object} tasas - Objeto con las tasas de cambio, donde la clave es el nombre de la moneda
 *   y el valor es un string con la tasa (ejemplo: { DOLAR: '102,15700000', EURO: '117,90450155', ... }).
 *
 * Inserta cada tasa con el nombre, el valor convertido a número (usando punto decimal)
 * y la fuente 'BCV'.
 */
export const insertarTasas = async (tasa) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const fecha = new Date();
    const resultados = [];

    for (const [nombre, valorStr] of Object.entries(tasa)) {
      const valor = parseFloat(
        valorStr.replace(/[^\d,]/g, "").replace(",", ".")
      ).toFixed(2);

      const query = {
        text: `INSERT INTO tasas_cambio (nombre, valor, fecha_actualizacion)
               VALUES ($1, $2, $3)
               RETURNING id`,
        values: [nombre, valor, fecha],
      };

      const result = await client.query(query);
      resultados.push(result.rows[0]);
    }

    await client.query("COMMIT");
    return resultados;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const insertarPromedioBinance = async (promedio) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const fecha = new Date();
    const query = {
      text: `INSERT INTO exchanges_promedios (nombre, promedio, fecha_actualizacion, fuente)
               VALUES ($1, $2, $3, $4)
               RETURNING id`,
      values: ["BINANCE_USDT", promedio, fecha, "BINANCE"],
    };

    await client.query(query);

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Obtiene la última tasa de cada moneda para una fecha dada.
 * @param {string} [fecha] - Fecha en formato 'YYYY-MM-DD'. Si no se pasa, usa la fecha de hoy.
 * @returns {Promise<Array>} - Array de objetos con nombre, valor, fecha_actualizacion y fuente.
 */
export const obtenerUltimasTasasPorFecha = async (fecha) => {
  const fechaConsulta = fecha || new Date().toLocaleDateString();

  const query = `
        SELECT DISTINCT ON (nombre)
            nombre, valor, fecha_actualizacion, fuente
        FROM tasas_cambio
        WHERE fecha_actualizacion::date = $1
        ORDER BY nombre, fecha_actualizacion DESC
    `;

  const { rows } = await pool.query(query, [fechaConsulta]);
  return rows;
};

export const obtenerUltimoPromedioBinancePorFecha = async (fecha) => {
  const fechaConsulta = fecha || new Date().toLocaleDateString();

  const query = `
        SELECT DISTINCT ON (nombre)
            nombre, promedio, fecha_actualizacion, fuente
        FROM exchanges_promedios
        WHERE fecha_actualizacion::date = $1
        ORDER BY nombre, fecha_actualizacion DESC
    `;

  const { rows } = await pool.query(query, [fechaConsulta]);
  return rows;
};
