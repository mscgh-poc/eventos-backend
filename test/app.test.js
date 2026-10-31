import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('Health & Smoke Tests (TEO_08 EARS Requirement)', () => {
  test('GET /health debe responder 200 con status UP', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'UP');
    assert.ok(data.uptimeSeconds >= 0);
    assert.ok(data.timestamp);
  });
});

describe('Eventos API Tests (TEO_06)', () => {
  test('GET /api/eventos debe retornar la lista de eventos', async () => {
    const res = await fetch(`${baseUrl}/api/eventos`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    assert.ok(data[0].id);
    assert.ok(data[0].title);
  });

  test('GET /api/eventos/:id retorna un evento existente', async () => {
    const res = await fetch(`${baseUrl}/api/eventos/1`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.id, 1);
    assert.equal(data.title, 'Introducción a la Inteligencia Artificial');
  });

  test('GET /api/eventos/:id retorna 404 si no existe', async () => {
    const res = await fetch(`${baseUrl}/api/eventos/99999`);
    assert.equal(res.status, 404);
  });

  test('GET /api/eventos/delay/:ms demuestra respuesta asíncrona no bloqueante', async () => {
    const start = Date.now();
    const res = await fetch(`${baseUrl}/api/eventos/delay/150`);
    const elapsed = Date.now() - start;
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.delayedMs >= 140);
    assert.ok(elapsed >= 140);
  });

  test('POST /api/eventos/:id/inscripciones valida dominio institucional', async () => {
    const res = await fetch(`${baseUrl}/api/eventos/4/inscripciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student: {
          name: 'Estudiante Prueba',
          email: 'prueba@gmail.com', // NO es institucional
          phone: '999888777',
        },
      }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /institucional/);
  });

  test('POST y GET /api/eventos/:id/resenas permite calificar y recalcular rating (Feature v2.0.0 MAJOR)', async () => {
    const resPost = await fetch(`${baseUrl}/api/eventos/1/resenas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 5,
        comment: 'Excelente ponencia del Dr. Mendoza, muy clara la explicación de redes neuronales.',
        author: 'Miguel Solis',
      }),
    });
    assert.equal(resPost.status, 201);
    const dataPost = await resPost.json();
    assert.equal(dataPost.review.rating, 5);

    const resGet = await fetch(`${baseUrl}/api/eventos/1`);
    assert.equal(resGet.status, 200);
    const dataGet = await resGet.json();
    assert.equal(dataGet.averageRating, 5);
    assert.equal(dataGet.reviewsCount, 1);
    assert.ok(dataGet.reviews.length >= 1);
  });
});
