import { Router } from 'express';
import { loadProfiles, saveProfiles, invalidateCache } from '../utils/stockProfiles.js';

const router = Router();

// GET /api/profiles — list all profiles
router.get('/', (req, res) => {
  const profiles = loadProfiles();
  res.json(profiles);
});

// GET /api/profiles/industry/:key
router.get('/industry/:key', (req, res) => {
  const profiles = loadProfiles();
  const profile = profiles.industries[req.params.key];
  if (!profile) return res.status(404).json({ error: 'Industry profile not found' });
  res.json({ key: req.params.key, ...profile });
});

// GET /api/profiles/ticker/:symbol
router.get('/ticker/:symbol', (req, res) => {
  const profiles = loadProfiles();
  const upper = req.params.symbol.toUpperCase();
  const profile = profiles.tickers[upper];
  if (!profile) return res.status(404).json({ error: 'Ticker profile not found' });
  res.json({ symbol: upper, ...profile });
});

// PUT /api/profiles/industry/:key — create or update
router.put('/industry/:key', (req, res) => {
  const profiles = loadProfiles();
  const key = req.params.key;
  profiles.industries[key] = { ...profiles.industries[key], ...req.body };
  saveProfiles(profiles);
  res.json({ key, ...profiles.industries[key] });
});

// PUT /api/profiles/ticker/:symbol — create or update
router.put('/ticker/:symbol', (req, res) => {
  const profiles = loadProfiles();
  const upper = req.params.symbol.toUpperCase();
  profiles.tickers[upper] = { ...profiles.tickers[upper], ...req.body };
  saveProfiles(profiles);
  res.json({ symbol: upper, ...profiles.tickers[upper] });
});

// DELETE /api/profiles/industry/:key
router.delete('/industry/:key', (req, res) => {
  const profiles = loadProfiles();
  if (!profiles.industries[req.params.key]) {
    return res.status(404).json({ error: 'Industry profile not found' });
  }
  delete profiles.industries[req.params.key];
  saveProfiles(profiles);
  res.json({ deleted: req.params.key });
});

// DELETE /api/profiles/ticker/:symbol
router.delete('/ticker/:symbol', (req, res) => {
  const profiles = loadProfiles();
  const upper = req.params.symbol.toUpperCase();
  if (!profiles.tickers[upper]) {
    return res.status(404).json({ error: 'Ticker profile not found' });
  }
  delete profiles.tickers[upper];
  saveProfiles(profiles);
  res.json({ deleted: upper });
});

export default router;
