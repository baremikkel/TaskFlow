# TaskFlow

En simpel to-do-app, der dækker CRUD (Create, Read, Update, Delete) hele vejen fra UI til database.

| Lag      | Teknologi                          | Placering        |
|----------|------------------------------------|------------------|
| Frontend | HTML, CSS, vanilla JavaScript      | `frontend/`      |
| Backend  | Node.js + Express (REST API)       | `backend/`       |
| Database | PostgreSQL 16 (via Docker Compose) | `db/init.sql`    |

## Kom i gang

Kræver Node.js 20.6+ og Docker.

```bash
# 1. Start databasen (opretter tasks-tabellen automatisk første gang)
docker compose up -d

# 2. Start backend'en
cd backend
cp .env.example .env   # hvis .env ikke findes
npm install
npm run dev            # eller: npm start
```

Åbn <http://localhost:3000>. Express serverer både API'et og frontend'en.

## Database

```sql
CREATE TABLE tasks (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## REST API

| Metode   | Endpoint          | Beskrivelse                     | Body (JSON)                                   |
|----------|-------------------|---------------------------------|-----------------------------------------------|
| `GET`    | `/api/tasks`      | Hent alle opgaver               | –                                             |
| `GET`    | `/api/tasks/:id`  | Hent én opgave                  | –                                             |
| `POST`   | `/api/tasks`      | Opret opgave → `201`            | `{ "title": "...", "description": "..." }`    |
| `PATCH`  | `/api/tasks/:id`  | Opdater felter                  | `{ "title"?, "description"?, "is_completed"? }` |
| `DELETE` | `/api/tasks/:id`  | Slet opgave → `204`             | –                                             |

Fejl returneres som `{ "error": "..." }` med `400` (ugyldigt input), `404` (findes ikke) eller `500`.

### Eksempler med curl

```bash
curl -X POST localhost:3000/api/tasks -H 'Content-Type: application/json' \
     -d '{"title":"Køb mælk","description":"Letmælk"}'
curl localhost:3000/api/tasks
curl -X PATCH localhost:3000/api/tasks/1 -H 'Content-Type: application/json' \
     -d '{"is_completed":true}'
curl -X DELETE localhost:3000/api/tasks/1
```

## Sådan hænger det sammen

1. Brugeren klikker i UI'et → `frontend/app.js` sender en `fetch`-request til `/api/tasks`.
2. Express-routeren i `backend/src/tasks.js` validerer input og kører en parametriseret SQL-query via `pg`.
3. PostgreSQL returnerer rækken, API'et sender den tilbage som JSON, og frontend'en gen-renderer listen.
