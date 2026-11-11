# Internship Records API

A REST API for managing internship records, built with **Node.js**, **Express** and **SQLite** (built-in `node:sqlite`).
Data is stored in a SQLite file, so it persists across server restarts.

**Features:** full CRUD, pagination, filtering, search, sorting, input validation, consistent JSON responses and correct HTTP status codes.

## Tech stack
- Node.js 22.13+
- Express 4
- SQLite via Node's built-in `node:sqlite` (no native build step)

## Setup

```bash
git clone https://github.com/amaandayer/internship-api.git
cd internship-api
npm install
npm run seed      # creates internships.db and loads 12 sample records
npm run dev       # development (nodemon)  -- or: npm start
```

Server runs on `http://localhost:3000` (change with `PORT=4000 npm start`).
Database file location can be changed with `DATABASE_PATH`.

Health check: `GET /health`

## Project structure

```
internship-api/
├── src/
│   ├── app.js        # Express app, routes, error handling
│   ├── server.js     # starts the HTTP server
│   ├── db.js         # SQLite connection + applies schema.sql
│   ├── validate.js   # request validation
│   └── seed.js       # loads data/internship-records-sample.json
├── data/internship-records-sample.json
├── schema.sql        # table definition
├── seed.sql          # same sample data as plain SQL
├── docs/api-examples.md
└── README.md
```

## Data model (`schema.sql`)

| Field | Type | Rules |
|---|---|---|
| id | integer | primary key, auto-increment |
| title | text | required, 3-120 chars |
| company | text | required, 2-120 chars |
| location | text | required, max 120 chars |
| mode | text | required: `remote`, `onsite`, `hybrid` |
| stipend | integer | optional, 0-1000000, default 0 |
| duration_weeks | integer | optional, 1-52, default 8 |
| status | text | optional: `open` / `closed`, default `open` |
| deadline | text | optional, `YYYY-MM-DD` or null |
| description | text | optional, max 2000 chars |
| created_at, updated_at | text | set automatically |

Full SQL: [`schema.sql`](schema.sql). Seed data: [`data/internship-records-sample.json`](data/internship-records-sample.json) / [`seed.sql`](seed.sql).

## Endpoints

| Method | URL | Description | Success | Errors |
|---|---|---|---|---|
| GET | `/api/internships` | List with pagination, filters, search, sort | 200 | 400 |
| GET | `/api/internships/:id` | Get one record | 200 | 400, 404 |
| POST | `/api/internships` | Create | 201 | 400, 422 |
| PUT | `/api/internships/:id` | Replace (full update) | 200 | 400, 404, 422 |
| PATCH | `/api/internships/:id` | Partial update | 200 | 400, 404, 422 |
| DELETE | `/api/internships/:id` | Delete | 204 | 400, 404 |

**List query parameters:** `page` (default 1), `limit` (default 10, max 100), `status`, `mode`, `q` (searches title/company/location), `sort` (`id`, `title`, `company`, `stipend`, `deadline`, `created_at`), `order` (`asc`/`desc`).

## Response format

Success:
```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 10, "total": 12, "totalPages": 2 } }
```
(`meta` appears only on list responses.)

Error:
```json
{
  "success": false,
  "error": {
    "status": 422,
    "message": "Validation failed",
    "details": [ { "field": "title", "message": "title is required and must be 3-120 characters" } ]
  }
}
```

## Status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | Deleted (no body) |
| 400 | Bad request: invalid id, invalid query params, malformed JSON |
| 404 | Record or route not found |
| 422 | Validation failed |
| 500 | Unexpected server error |

## Quick test

```bash
curl "http://localhost:3000/api/internships?page=1&limit=5"
curl http://localhost:3000/api/internships/1
curl -X POST http://localhost:3000/api/internships -H "Content-Type: application/json" \
  -d '{"title":"Backend Intern","company":"Acme Corp","location":"Jaipur","mode":"remote","stipend":5000}'
curl -X PATCH http://localhost:3000/api/internships/1 -H "Content-Type: application/json" -d '{"status":"closed"}'
curl -X DELETE http://localhost:3000/api/internships/1
```

More examples with full responses: [`docs/api-examples.md`](docs/api-examples.md).

## Design notes
- SQL uses prepared statements everywhere (no SQL injection); `sort` is checked against a whitelist.
- Validation lives in one place (`src/validate.js`) and is shared by POST, PUT and PATCH.
- Responses always use the same envelope so a frontend can handle them predictably.

## License
MIT
