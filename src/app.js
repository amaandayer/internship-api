const express = require('express');
const db = require('./db');
const { validateInternship, MODES, STATUSES } = require('./validate');

const app = express();
app.use(express.json({ limit: '100kb' }));

// ---------- consistent response helpers ----------
const ok = (res, data, status = 200, meta) =>
  res.status(status).json({ success: true, data, ...(meta && { meta }) });

const fail = (res, status, message, details) =>
  res.status(status).json({ success: false, error: { status, message, ...(details && { details }) } });

const parseId = (v) => (/^[1-9]\d*$/.test(v) ? Number(v) : null);
const getById = (id) => db.prepare('SELECT * FROM internships WHERE id = ?').get(id);

const SORTABLE = ['id', 'title', 'company', 'stipend', 'deadline', 'created_at'];
const DEFAULTS = { stipend: 0, duration_weeks: 8, status: 'open', deadline: null, description: '' };

// ---------- health ----------
app.get('/health', (req, res) => ok(res, { status: 'ok' }));

// ---------- 1. LIST (pagination, filters, search, sort) ----------
app.get('/api/internships', (req, res) => {
  const { status, mode, q, sort = 'id', order = 'asc' } = req.query;

  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
  const problems = [];

  if (!Number.isInteger(page) || page < 1) problems.push({ field: 'page', message: 'page must be an integer >= 1' });
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    problems.push({ field: 'limit', message: 'limit must be an integer between 1 and 100' });
  if (status !== undefined && !STATUSES.includes(status))
    problems.push({ field: 'status', message: `status must be one of: ${STATUSES.join(', ')}` });
  if (mode !== undefined && !MODES.includes(mode))
    problems.push({ field: 'mode', message: `mode must be one of: ${MODES.join(', ')}` });
  if (!SORTABLE.includes(sort))
    problems.push({ field: 'sort', message: `sort must be one of: ${SORTABLE.join(', ')}` });
  if (!['asc', 'desc'].includes(String(order).toLowerCase()))
    problems.push({ field: 'order', message: 'order must be asc or desc' });
  if (problems.length) return fail(res, 400, 'Invalid query parameters', problems);

  const where = [];
  const params = [];
  if (status) { where.push('status = ?'); params.push(status); }
  if (mode) { where.push('mode = ?'); params.push(mode); }
  if (q) {
    where.push('(title LIKE ? OR company LIKE ? OR location LIKE ?)');
    const like = `%${String(q).trim()}%`;
    params.push(like, like, like);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const dir = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const offset = (page - 1) * limit;

  const total = db.prepare(`SELECT COUNT(*) AS c FROM internships ${clause}`).get(...params).c;
  const rows = db
    .prepare(`SELECT * FROM internships ${clause} ORDER BY ${sort} ${dir}, id ASC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset);

  ok(res, rows, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

// ---------- 2. DETAIL ----------
app.get('/api/internships/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'id must be a positive integer');
  const row = getById(id);
  if (!row) return fail(res, 404, `Internship with id ${id} not found`);
  ok(res, row);
});

// ---------- 3. CREATE ----------
app.post('/api/internships', (req, res) => {
  const { errors, value } = validateInternship(req.body);
  if (errors.length) return fail(res, 422, 'Validation failed', errors);

  const rec = { ...DEFAULTS, ...value };
  const info = db
    .prepare(
      `INSERT INTO internships (title, company, location, mode, stipend, duration_weeks, status, deadline, description)
       VALUES (@title, @company, @location, @mode, @stipend, @duration_weeks, @status, @deadline, @description)`
    )
    .run(rec);

  res.set('Location', `/api/internships/${info.lastInsertRowid}`);
  ok(res, getById(info.lastInsertRowid), 201);
});

// ---------- 4. UPDATE (PUT = full replace, PATCH = partial) ----------
const update = (partial) => (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'id must be a positive integer');
  const existing = getById(id);
  if (!existing) return fail(res, 404, `Internship with id ${id} not found`);

  const { errors, value } = validateInternship(req.body, { partial });
  if (errors.length) return fail(res, 422, 'Validation failed', errors);

  // PUT resets omitted optional fields to defaults; PATCH keeps existing values
  const base = partial ? existing : DEFAULTS;
  const merged = { ...base, ...value, id };

  db.prepare(
    `UPDATE internships SET title=@title, company=@company, location=@location, mode=@mode,
       stipend=@stipend, duration_weeks=@duration_weeks, status=@status, deadline=@deadline,
       description=@description, updated_at=CURRENT_TIMESTAMP
     WHERE id=@id`
  ).run({
    id: merged.id, title: merged.title, company: merged.company, location: merged.location,
    mode: merged.mode, stipend: merged.stipend, duration_weeks: merged.duration_weeks,
    status: merged.status, deadline: merged.deadline, description: merged.description,
  });

  ok(res, getById(id));
};
app.put('/api/internships/:id', update(false));
app.patch('/api/internships/:id', update(true));

// ---------- 5. DELETE ----------
app.delete('/api/internships/:id', (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'id must be a positive integer');
  const info = db.prepare('DELETE FROM internships WHERE id = ?').run(id);
  if (!info.changes) return fail(res, 404, `Internship with id ${id} not found`);
  res.status(204).send();
});

// ---------- fallbacks ----------
app.use((req, res) => fail(res, 404, `Route ${req.method} ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'Invalid JSON body');
  if (err.type === 'entity.too.large') return fail(res, 413, 'Request body too large');
  console.error(err);
  fail(res, 500, 'Internal server error');
});

module.exports = app;
