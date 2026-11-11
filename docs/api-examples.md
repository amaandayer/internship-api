# API Examples (real responses from the running server)

Base URL: `http://localhost:3000`

All JSON responses use one envelope:

```json
{ "success": true,  "data": ..., "meta": { ... } }
{ "success": false, "error": { "status": 422, "message": "...", "details": [ { "field": "...", "message": "..." } ] } }
```

## 1. List (pagination)
```bash
curl "http://localhost:3000/api/internships?page=1&limit=2"
```
```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "Frontend Developer Intern", "company": "BrightPixel Labs", "location": "Jaipur", "mode": "hybrid", "stipend": 8000, "duration_weeks": 12, "status": "open", "deadline": "2026-12-15", "description": "Build responsive UI components with React and work with the design team.", "created_at": "2026-11-10 03:36:48", "updated_at": "2026-11-10 03:36:48" },
    { "id": 2, "title": "Backend Developer Intern", "company": "CloudNest Systems", "location": "Bengaluru", "mode": "remote", "stipend": 12000, "duration_weeks": 12, "status": "open", "deadline": "2026-12-20", "description": "Create REST APIs with Node.js and PostgreSQL under a senior mentor.", "created_at": "2026-11-10 03:36:48", "updated_at": "2026-11-10 03:36:48" }
  ],
  "meta": { "page": 1, "limit": 2, "total": 12, "totalPages": 6 }
}
```

Filters / search / sort:
```bash
curl "http://localhost:3000/api/internships?status=open&mode=remote"
curl "http://localhost:3000/api/internships?q=jaipur&sort=stipend&order=desc"
```

Invalid query -> `400`
```bash
curl "http://localhost:3000/api/internships?limit=500&status=foo"
```
```json
{ "success": false, "error": { "status": 400, "message": "Invalid query parameters", "details": [
  { "field": "limit", "message": "limit must be an integer between 1 and 100" },
  { "field": "status", "message": "status must be one of: open, closed" } ] } }
```

## 2. Detail
```bash
curl http://localhost:3000/api/internships/2          # 200
curl http://localhost:3000/api/internships/999        # 404
curl http://localhost:3000/api/internships/abc        # 400
```
404 body:
```json
{ "success": false, "error": { "status": 404, "message": "Internship with id 999 not found" } }
```

## 3. Create -> `201 Created` (+ `Location` header)
```bash
curl -X POST http://localhost:3000/api/internships \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend Intern","company":"Acme Corp","location":"Jaipur","mode":"remote","stipend":5000}'
```
```json
{ "success": true, "data": { "id": 13, "title": "Backend Intern", "company": "Acme Corp", "location": "Jaipur", "mode": "remote", "stipend": 5000, "duration_weeks": 8, "status": "open", "deadline": null, "description": "", "created_at": "2026-11-10 03:36:50", "updated_at": "2026-11-10 03:36:50" } }
```

Validation failure -> `422`
```bash
curl -X POST http://localhost:3000/api/internships -H "Content-Type: application/json" \
  -d '{"title":"x","mode":"office","stipend":-5,"deadline":"2026-13-45"}'
```
```json
{ "success": false, "error": { "status": 422, "message": "Validation failed", "details": [
  { "field": "title", "message": "title is required and must be 3-120 characters" },
  { "field": "company", "message": "company is required and must be 2-120 characters" },
  { "field": "location", "message": "location is required and must be at most 120 characters" },
  { "field": "mode", "message": "mode must be one of: remote, onsite, hybrid" },
  { "field": "stipend", "message": "stipend must be an integer between 0 and 1000000" },
  { "field": "deadline", "message": "deadline must be a valid date in YYYY-MM-DD format or null" } ] } }
```

Malformed JSON -> `400`
```json
{ "success": false, "error": { "status": 400, "message": "Invalid JSON body" } }
```

## 4. Update
Partial update (PATCH) -> `200`
```bash
curl -X PATCH http://localhost:3000/api/internships/13 \
  -H "Content-Type: application/json" -d '{"status":"closed","stipend":6000}'
```
Empty PATCH body -> `422` (`Provide at least one valid field to update`).

Full replace (PUT) -> `200`; omitted optional fields reset to defaults.
```bash
curl -X PUT http://localhost:3000/api/internships/13 \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend Intern II","company":"Acme Corp","location":"Remote","mode":"remote"}'
```

## 5. Delete
```bash
curl -i -X DELETE http://localhost:3000/api/internships/13   # 204 No Content
curl -i -X DELETE http://localhost:3000/api/internships/13   # 404 (already deleted)
```

## Unknown route -> `404`
```json
{ "success": false, "error": { "status": 404, "message": "Route GET /nope not found" } }
```
