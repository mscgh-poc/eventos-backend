import { Router } from 'express';
import { readFileSync } from 'node:fs';

const router = Router();
let version = '1.0.0';
try {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'));
  version = pkg.version;
} catch {
  // fallback
}

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'eventos-backend',
    version,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});

export default router;
