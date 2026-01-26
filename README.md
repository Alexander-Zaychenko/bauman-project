# SkillUp

This is a small static project. Added a lightweight Node + SQLite backend for students to experiment with.

Server quickstart

- Install dependencies:

```bash
npm install
```

- Initialize DB (creates `db/data.sqlite3` and seeds one user):

```bash
npm run init-db
```

- Start server (serves static files and API on port 3000):

```bash
# SkillUp

Lightweight Node + SQLite backend for the SkillUp student project.

## Server quickstart

- Install dependencies:

```bash
npm install
```

- Initialize DB (creates `db/data.sqlite3` and seeds sample users/requests):

```bash
npm run init-db
```

- Start server (serves static files and API on port 3000):

```bash
npm start
```

## Skillpoints (новая валюта)

- Each user has a `skillpoints` integer balance (`users.skillpoints`).
- When creating a request you must provide `skillpoints` (integer >= 0). That amount is reserved for the request.
- Available balance for new requests is calculated as: `users.skillpoints - SUM(skillpoints of user's active requests)`, where active requests are `status = 'open'` or `status = 'accepted'`.
- Request statuses: `open`, `accepted`, `completed`, `cancelled` (`requests.status`).

## API (важные изменения)

- `POST /api/register` — register user (json body) (returns `user.skillpoints`).
- `POST /api/login` — login (json body) (returns `user.skillpoints`).
- `GET /api/users/:id` — fetch user (includes `skillpoints`).
- `POST /api/users/:id` — update user (same as before).
- `GET /api/requests` — lists requests with `status = 'open'` by default.
- `POST /api/requests` — create request. Body example:

```json
{
	"title": "Помочь с задачами",
	"subject": "Математика",
	"text": "Описание",
	"classFrom": "9",
	"classTo": "11",
	"type": "ask",
	"skillpoints": 10,
	"creator": { "id": 1, "name": "Иванов Иван" }
}
```

Server validates the creator has enough available `skillpoints` across all active requests.

- `POST /api/requests/:id/cancel` — creator cancels their request (body: `{ "userId": <creatorId> }`), this frees reserved points.
- `POST /api/requests/:id/accept` — accepter accepts a request; request moves to `status = 'accepted'` (body: `{ "userId": <accepterId> }`).
- `POST /api/chats/:id/confirm` — creator confirms completion; server transfers the request's `skillpoints` from creator to accepter and marks request `completed`.
- `POST /api/chats/:id/cancel` — accepter cancels; chat marked `cancelled` and request returns to `open`.

## Quick examples

- Create request (user id=1):

```bash
curl -X POST http://localhost:3000/api/requests \
	-H "Content-Type: application/json" \
	-d '{"title":"Тест","subject":"Математика","text":"Тест","classFrom":"9","classTo":"11","type":"ask","skillpoints":10,"creator":{"id":1,"name":"Иванов Иван"}}'
```

- Accept request (user id=2 accepts request id=5):

```bash
curl -X POST http://localhost:3000/api/requests/5/accept \
	-H "Content-Type: application/json" \
	-d '{"userId":2}'
```

- Confirm chat (complete and transfer points, chat id from accept response):

```bash
curl -X POST http://localhost:3000/api/chats/7/confirm
```

## Migration / notes

- `server.js` includes runtime `ALTER TABLE` checks to add `skillpoints` and `status` columns to existing databases created before this change.
- `db/init_db.js` and `server.js` were updated to include these columns for fresh DBs and seeds.

Frontend: `create-request.html` now has a `skillpoints` input and `scripts.js` sends it when creating requests.

If you'd like, I can add a small integration test script to exercise the full flow (create two requests, verify balance check, accept, confirm transfer).
