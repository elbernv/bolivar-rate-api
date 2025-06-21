import express from "express";
import { schedule } from "node-cron";
import dotenv from "dotenv";

dotenv.config();

import { scrapeBCV } from "./scraper.js";
import { getBinanceP2PAvg } from "./binance.js";
import {
  insertarTasas,
  obtenerUltimasTasasPorFecha,
  insertarPromedioBinance,
  obtenerUltimoPromedioBinancePorFecha,
} from "./db.js";
import { setupSwagger } from "./swagger.js";

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;

setupSwagger(app);

const actualizarTasas = async () => {
  try {
    console.log(
      `[${new Date().toISOString()}] Iniciando actualización de tasas...`
    );
    const data = await scrapeBCV();
    await insertarTasas(data);
    const binanceP2PAvg = await getBinanceP2PAvg();
    await insertarPromedioBinance(parseFloat(binanceP2PAvg).toFixed(2));

    console.log(
      `[${new Date().toISOString()}] Actualización completada exitosamente`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error en la actualización:`,
      error.message
    );
  }
};

actualizarTasas();

const cronJob = schedule("0 0 */4 * * *", actualizarTasas, {
  scheduled: true,
  timezone: "America/Caracas",
});

/**
 * @swagger
 * /tasas:
 *   get:
 *     summary: Obtener las últimas tasas de cambio
 *     tags: [Tasas]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para filtrar tasas (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de tasas de cambio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tasa'
 *       500:
 *         description: Error al obtener las tasas
 */
app.get("/tasas", async (req, res) => {
  try {
    const fecha = req.query.fecha; // Espera formato 'YYYY-MM-DD'
    const tasas = await obtenerUltimasTasasPorFecha(fecha);
    res.json(tasas);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al obtener las tasas" });
  }
});

/**
 * @swagger
 * /binance-promedio:
 *   get:
 *     summary: Obtener el ultimo promedio de binance
 *     tags: [Binance]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha para filtrar el promedio (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: el ultimo promedio de binance registrado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BinanceUSDT'
 *       500:
 *         description: Error al obtener las tasas
 */
app.get("/binance-promedio", async (req, res) => {
  try {
    const fecha = req.query.fecha; // Espera formato 'YYYY-MM-DD'
    const tasas = await obtenerUltimoPromedioBinancePorFecha(fecha);
    res.json(tasas);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al obtener las tasas" });
  }
});

// Definición del esquema Tasa
/**
 * @swagger
 * components:
 *   schemas:
 *     Tasa:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "USD"
 *         valor:
 *           type: number
 *           format: float
 *           example: 36.5
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2023-06-15T12:00:00Z"
 *         fuente:
 *           type: string
 *           example: "BCV"
 */

// Definición del esquema BinanceUSDT
/**
 * @swagger
 * components:
 *   schemas:
 *     BinanceUSDT:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           example: "BINANCE_USDT"
 *         promedio:
 *           type: number
 *           format: float
 *           example: 36.5
 *         fecha_actualizacion:
 *           type: string
 *           format: date-time
 *           example: "2023-06-15T12:00:00Z"
 *         fuente:
 *           type: string
 *           example: "BINANCE"
 */

process.on("SIGTERM", () => {
  cronJob.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  cronJob.stop();
  process.exit(0);
});

app.listen(port, host, () => {
  console.log(`Servidor iniciado en http://${host}:${port}`);
});
