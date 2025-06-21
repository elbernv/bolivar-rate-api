import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// tradeType = SELL / BUY
const getBinanceP2P = async (tradeType) => {
  const url = process.env.BINANCE_P2P_URL;
  const body = {
    fiat: "VES",
    page: 1,
    rows: 20,
    tradeType: tradeType,
    asset: "USDT",
    countries: [],
    proMerchantAds: false,
    shieldMerchantAds: false,
    filterType: "all",
    periods: [],
    additionalKycVerifyFilter: 0,
    publisherType: "merchant",
    payTypes: [],
    classifies: ["mass", "profession", "fiat_trade"],
    tradedWith: false,
    followed: false,
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Binance P2P data:", error.message);
    return null;
  }
};

export const getBinanceP2PAvg = async () => {
  const binanceSellResponse = await getBinanceP2P("SELL");
  const binanceBuyResponse = await getBinanceP2P("BUY");

  const filteredSellAds = binanceSellResponse?.data?.filter(
    (ad) => ad.privilegeDesc !== "Promoted Ad"
  );
  const filteredBuyAds = binanceBuyResponse?.data?.filter(
    (ad) => ad.privilegeDesc !== "Promoted Ad"
  );

  const finalAds = [...filteredBuyAds, ...filteredSellAds];

  const suma = finalAds?.reduce((sum, ad) => {
    return sum + parseFloat(ad.adv.price);
  }, 0);

  const avg = suma / finalAds?.length;

  return avg;
};
