import { Router } from 'express';
import { storage } from '../data/storage.js';

const router = Router();

// ── GET /api/eventos/delay/:ms (Demostración no bloqueante - TEO_06) ──────────
// Simula demora en backend con Promise/setTimeout para evidenciar que el
// event loop de Node.js sigue atendiendo otras peticiones simultáneamente.
router.get('/delay/:ms', async (req, res) => {
  const ms = Math.min(Number(req.params.ms) || 1000, 10000);
  const start = Date.now();
  await new Promise((resolve) => setTimeout(resolve, ms));
  const elapsed = Date.now() - start;
  res.json({
    message: `Respuesta asíncrona no bloqueante tras ${elapsed}ms`,
    delayedMs: elapsed,
    timestamp: new Date().toISOString(),
  });
});

// ── GET /api/eventos (Listado con filtros) ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, cost, status, search } = req.query;
    const events = await storage.getEvents({ category, cost, status, search });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/eventos/:id (Detalle de un evento) ──────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const event = await storage.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /api/eventos/estudiante/:email (Inscripciones del alumno) ────────────
router.get('/estudiante/:email', async (req, res) => {
  try {
    const events = await storage.getInscriptionsByStudent(req.params.email);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /api/eventos/:id/inscripciones (Inscribir estudiante) ───────────────
router.post('/:id/inscripciones', async (req, res) => {
  try {
    const { student } = req.body;
    if (!student || !student.email || !student.name) {
      return res.status(400).json({
        error: 'Datos de estudiante incompletos: se requiere name y email',
      });
    }

    // Validación de dominio institucional UNMSM (regla de negocio del frontend)
    const validDomain =
      student.email.endsWith('@unmsm.edu.pe') || student.email.endsWith('@universidad.edu.pe');
    if (!validDomain) {
      return res.status(400).json({
        error: 'El correo debe pertenecer al dominio institucional (@unmsm.edu.pe)',
      });
    }

    const result = await storage.registerInscription(req.params.id, student);
    res.status(201).json({
      message: 'Inscripción registrada exitosamente',
      ...result,
    });
  } catch (error) {
    if (error.message.includes('cupos')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('ya se encuentra inscrito')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// ── DELETE /api/eventos/:id/inscripciones (Cancelar inscripción) ─────────────
router.delete('/:id/inscripciones', async (req, res) => {
  try {
    const { studentEmail } = req.body;
    if (!studentEmail) {
      return res.status(400).json({ error: 'Se requiere studentEmail en el cuerpo' });
    }

    const result = await storage.cancelInscription(req.params.id, studentEmail);
    res.json({
      message: 'Inscripción cancelada correctamente',
      ...result,
    });
  } catch (error) {
    if (error.message.includes('no encontrada') || error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
