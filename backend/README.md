# MSL Backend (NestJS + Prisma)

REST API for the Mabar Super League admin panel: tournaments (CRUD), match
scores, and participants.

## Stack

- **NestJS 11** — modules / controllers / services
- **Prisma 6** — ORM; **SQLite** for local dev (swap the `datasource` provider in
  `prisma/schema.prisma` to `postgresql` for production, no model changes needed)
- **class-validator** — request validation

## Setup

```bash
cd backend
npm install
cp .env.example .env          # DATABASE_URL, PORT, CORS_ORIGIN
npm run prisma:generate       # generate the Prisma client
npm run prisma:push           # create the SQLite schema
npm run prisma:seed           # seed demo tournaments/teams/matches
npm run start:dev             # http://localhost:3001/api
```

`npm run db:reset` re-creates and re-seeds the database from scratch.

## API

Base URL: `http://localhost:3001/api`

| Method | Path                      | Description                          |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/health`                 | Liveness check                       |
| GET    | `/tournaments`            | List tournaments (with team counts)  |
| GET    | `/tournaments/:id`        | One tournament + participants + matches |
| POST   | `/tournaments`            | Create tournament                    |
| PATCH  | `/tournaments/:id`        | Update tournament                    |
| DELETE | `/tournaments/:id`        | Delete tournament (cascades)         |
| GET    | `/participants?tournamentId=` | List participants (optionally filtered) |
| POST   | `/participants`           | Add participant                      |
| PATCH  | `/participants/:id`       | Update participant (e.g. status)     |
| DELETE | `/participants/:id`       | Remove participant                   |
| GET    | `/matches?tournamentId=`  | List matches (optionally filtered)   |
| POST   | `/matches`                | Create match                         |
| PATCH  | `/matches/:id`            | Update match                         |
| PATCH  | `/matches/:id/score`      | Record final score (marks completed) |
| DELETE | `/matches/:id`            | Delete match                         |

`tournaments` accept `rules` as a `string[]`; it is stored newline-joined and
returned as an array. `registeredTeams` is computed from the participant count.
