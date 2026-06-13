# GEOMINE Ball Mill Health Monitoring API

## Project Overview

GEOMINE is a backend API for a Ball Mill Health Monitoring & Predictive Maintenance System. It collects sensor readings from ball mills, assesses equipment health, predicts maintenance actions, and stores alerts and maintenance records.

## Features

- JWT authentication with Admin and Miner roles
- Ball mill registration and management
- Sensor reading ingestion and historical lookup
- Health score calculation for ball mills
- Predictive maintenance recommendations
- Alert generation and retrieval
- Maintenance event recording
- Dashboard and summary reporting endpoints
- Modular monolith architecture with TypeScript and Prisma

## Architecture Diagram

```
Client -> Express API -> Modules (Auth, Users, BallMills, Sensors, Health, Predictions, Alerts, Maintenance, Dashboard, Reports) -> Prisma -> PostgreSQL
```

## Folder Structure

```
src/
├── app.ts
├── server.ts
├── config/
├── middleware/
├── modules/
├── prisma/
├── shared/
├── tests/
├── docs/
└── scripts/
```

## Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
```

## Environment Variables

Create a `.env` file based on the sample values.

```env
PORT=4000
DATABASE_URL=postgresql://geomine_user:geomine_password@localhost:5432/geomine_db?schema=public
JWT_SECRET=supersecretjwtkey
JWT_EXPIRES_IN=1h
SALT_ROUNDS=12
LOG_LEVEL=info
```

## Running Locally

```bash
npm run dev
```

## Prisma Migration Commands

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Docker Commands

```bash
docker compose up --build
```

## Testing Commands

```bash
npm test
npm run test:watch
```

## API Documentation

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `GET /api/ballmills`
- `GET /api/ballmills/:id`
- `POST /api/ballmills`
- `PUT /api/ballmills/:id`
- `POST /api/sensors`
- `GET /api/sensors/:ballMillId`
- `GET /api/health/:ballMillId`
- `GET /api/predictions/:ballMillId`
- `GET /api/alerts`
- `POST /api/maintenance`
- `GET /api/maintenance/:ballMillId`
- `GET /api/dashboard`
- `GET /api/reports/summary`

## Development Workflow

- Use `npm run lint` before commits
- Format with `npm run format`
- Pre-commit hooks run lint-staged
- Use Docker Compose for local service orchestration

## Considerations

- Make sure the .env file you set up is in the same directory as .env.local for the server to pick it up.
- Check your Node version as well (npm --version) Node 18 and higher is preferred.
- Familiarize yourself with prisma commands (npm run prisma:generate, npm run prisma:migrate, npm run prisma:studio)
- Make sure your commits are done to your branch and not the main branch for code reviews.
- To use your personal Github branch (git checkout <your-branch-name>). This is necessary for code reviews.
- Do not push the node_modules folder.

