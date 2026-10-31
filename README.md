# eventos-backend — Microservicio de Eventos Académicos

> **Curso:** Taller de Construcción de Software Web — UNMSM FISI  
> **Integrantes:** Miguel Solis & Mihael Cristobal  
> **Tema:** Backend no bloqueante, persistencia y pipeline CI/CD en la nube (Semana 6 y 8)

## 📌 Descripción
Microservicio REST para la gestión de eventos académicos universitarios, inscripciones y simulación de concurrencia asíncrona no bloqueante.

## 🚀 Tecnologías
- **Runtime:** Node.js v22 (arquitectura Single-Threaded Event Loop sin bloqueo).
- **Framework:** Express 4 con middlewares de CORS y JSON.
- **Testing:** Node.js native test runner (`node:test`).
- **Contenedores:** Dockerfile multi-stage con imagen base `node:22-alpine` y HealthCheck.
- **CI/CD:** GitHub Actions con despliegue automatizado en Azure.

## 📡 Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Healthcheck y estado del servicio (status, uptime, version) |
| `GET` | `/api/eventos` | Listado de eventos con filtros (`category`, `status`, `cost`, `search`) |
| `GET` | `/api/eventos/:id` | Detalle de un evento específico y su agenda |
| `GET` | `/api/eventos/estudiante/:email` | Eventos en los que el estudiante se encuentra inscrito |
| `POST` | `/api/eventos/:id/inscripciones` | Inscripción con validación de correo `@unmsm.edu.pe` |
| `DELETE` | `/api/eventos/:id/inscripciones` | Cancelación de inscripción |
| `GET` | `/api/eventos/delay/:ms` | Endpoint no bloqueante con demora simulada para pruebas de concurrencia |

## 🧪 Pruebas Automatizadas
```bash
npm test
```

## 🐳 Ejecución con Docker
```bash
docker build -t eventos-backend .
docker run -p 3000:3000 eventos-backend
```
