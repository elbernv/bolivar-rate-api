import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  "Accept-Language": "es-ES,es;q=0.9",
  Referer: "https://www.bcv.org.ve/",
};

export const scrapeBCV = async () => {
  try {
    const response = await axios.get("https://www.bcv.org.ve/", {
      httpsAgent: agent,
      headers,
    });
    const $ = cheerio.load(response.data);
    const exchangeRates = {};

    ["dolar", "euro", "yuan", "lira", "rublo"].forEach((currency) => {
      const div = $(`#${currency}`);

      const rate = div.find("strong").text().trim() || "No disponible";
      exchangeRates[currency.toUpperCase()] = rate;
    });
    return exchangeRates;
  } catch (error) {
    console.error("Error al hacer scraping:", error.message);
    return null;
  }
};
