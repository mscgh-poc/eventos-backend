import fs from 'node:fs/promises';
import path from 'node:path';
import { initialEvents } from './mockEvents.js';

const DATA_DIR = path.resolve('data');
const DATA_FILE = path.join(DATA_DIR, 'storage.json');

class Storage {
  constructor() {
    this.events = JSON.parse(JSON.stringify(initialEvents));
    this.inscriptions = []; // Array of { eventId, studentEmail, studentName, studentPhone, registeredAt }
    this.reviews = []; // For MAJOR v2.0.0
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const raw = await fs.readFile(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.events) this.events = parsed.events;
      if (parsed.inscriptions) this.inscriptions = parsed.inscriptions;
      if (parsed.reviews) this.reviews = parsed.reviews;
    } catch {
      // If file doesn't exist yet, seed and persist initial state
      await this.persist();
    }
    this.initialized = true;
  }

  async persist() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        DATA_FILE,
        JSON.stringify(
          {
            events: this.events,
            inscriptions: this.inscriptions,
            reviews: this.reviews,
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.error('Error persisting storage:', err.message);
    }
  }

  async getEvents(filters = {}) {
    await this.init();
    let result = [...this.events];
    const today = new Date().toISOString().split('T')[0];

    if (filters.status === 'upcoming') {
      result = result.filter((e) => e.date >= today);
    } else if (filters.status === 'past') {
      result = result.filter((e) => e.date < today);
    }

    if (filters.category && filters.category !== 'all') {
      result = result.filter((e) => e.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.cost === 'free') {
      result = result.filter((e) => e.isFree);
    } else if (filters.cost === 'paid') {
      result = result.filter((e) => !e.isFree);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.speaker.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    return result;
  }

  async getEventById(id) {
    await this.init();
    const event = this.events.find((e) => e.id === Number(id));
    if (!event) return null;

    // Attach event reviews if any
    const eventReviews = this.reviews.filter((r) => r.eventId === Number(id));
    return { ...event, reviews: eventReviews };
  }

  async registerInscription(eventId, student) {
    await this.init();
    const event = this.events.find((e) => e.id === Number(eventId));
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    // Check capacity
    if (event.enrolled >= event.capacity) {
      throw new Error('No quedan cupos disponibles para este evento');
    }

    // Check duplicate inscription
    const alreadyRegistered = this.inscriptions.some(
      (ins) => ins.eventId === Number(eventId) && ins.studentEmail === student.email
    );
    if (alreadyRegistered) {
      throw new Error('El estudiante ya se encuentra inscrito en este evento');
    }

    // Register
    const newInscription = {
      id: Date.now(),
      eventId: Number(eventId),
      studentEmail: student.email,
      studentName: student.name,
      studentPhone: student.phone,
      registeredAt: new Date().toISOString(),
    };

    this.inscriptions.push(newInscription);
    event.enrolled += 1;
    await this.persist();

    return { event, inscription: newInscription };
  }

  async cancelInscription(eventId, studentEmail) {
    await this.init();
    const event = this.events.find((e) => e.id === Number(eventId));
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    const idx = this.inscriptions.findIndex(
      (ins) => ins.eventId === Number(eventId) && ins.studentEmail === studentEmail
    );
    if (idx === -1) {
      throw new Error('Inscripción no encontrada');
    }

    this.inscriptions.splice(idx, 1);
    if (event.enrolled > 0) {
      event.enrolled -= 1;
    }
    await this.persist();

    return { event, cancelled: true };
  }

  async getInscriptionsByStudent(email) {
    await this.init();
    const insList = this.inscriptions.filter((ins) => ins.studentEmail === email);
    const eventIds = insList.map((i) => i.eventId);
    const studentEvents = this.events.filter((e) => eventIds.includes(e.id));
    return studentEvents;
  }

  async resetData() {
    this.events = JSON.parse(JSON.stringify(initialEvents));
    this.inscriptions = [];
    this.reviews = [];
    await this.persist();
  }
}

export const storage = new Storage();
