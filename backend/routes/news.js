import { Router } from 'express';
import { getNewsForSymbol } from '../services/yahooFinance.js';

const router = Router();

router.get('/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const news = await getNewsForSymbol(symbol);
    res.json({ news });
  } catch (err) {
    console.error(`Error fetching news for ${symbol}:`, err.message);
    res.status(502).json({
      error: `Failed to fetch news for ${symbol}`,
      details: err.message,
    });
  }
});

export default router;
