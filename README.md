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
npm start
```

API endpoints (examples):

- `POST /api/register`  — register user (json body)
- `POST /api/login` — login (json body)
- `GET /api/users/:id` — fetch user
- `POST /api/users/:id` — update user

The frontend currently uses localStorage by default. You can adapt `scripts.js` to call these API endpoints instead.
