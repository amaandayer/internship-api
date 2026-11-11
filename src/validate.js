const MODES = ['remote', 'onsite', 'hybrid'];
const STATUSES = ['open', 'closed'];

const isString = (v) => typeof v === 'string';
const isIsoDate = (v) =>
  isString(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 10) === v;

/**
 * Validates an internship payload.
 * - partial=false  -> POST / PUT  (required fields must be present)
 * - partial=true   -> PATCH       (only provided fields are checked)
 * Returns { errors: [{field, message}], value: cleanedObject }
 */
function validateInternship(body, { partial = false } = {}) {
  const errors = [];
  const value = {};

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: [{ field: 'body', message: 'Request body must be a JSON object' }], value };
  }

  const has = (f) => body[f] !== undefined;
  const needed = (f) => !partial || has(f);
  const err = (field, message) => errors.push({ field, message });

  if (needed('title')) {
    if (!isString(body.title) || body.title.trim().length < 3 || body.title.trim().length > 120)
      err('title', 'title is required and must be 3-120 characters');
    else value.title = body.title.trim();
  }
  if (needed('company')) {
    if (!isString(body.company) || body.company.trim().length < 2 || body.company.trim().length > 120)
      err('company', 'company is required and must be 2-120 characters');
    else value.company = body.company.trim();
  }
  if (needed('location')) {
    if (!isString(body.location) || !body.location.trim() || body.location.trim().length > 120)
      err('location', 'location is required and must be at most 120 characters');
    else value.location = body.location.trim();
  }
  if (needed('mode')) {
    if (!MODES.includes(body.mode)) err('mode', `mode must be one of: ${MODES.join(', ')}`);
    else value.mode = body.mode;
  }
  if (has('stipend')) {
    if (!Number.isInteger(body.stipend) || body.stipend < 0 || body.stipend > 1000000)
      err('stipend', 'stipend must be an integer between 0 and 1000000');
    else value.stipend = body.stipend;
  }
  if (has('duration_weeks')) {
    if (!Number.isInteger(body.duration_weeks) || body.duration_weeks < 1 || body.duration_weeks > 52)
      err('duration_weeks', 'duration_weeks must be an integer between 1 and 52');
    else value.duration_weeks = body.duration_weeks;
  }
  if (has('status')) {
    if (!STATUSES.includes(body.status)) err('status', `status must be one of: ${STATUSES.join(', ')}`);
    else value.status = body.status;
  }
  if (has('deadline')) {
    if (body.deadline === null) value.deadline = null;
    else if (!isIsoDate(body.deadline)) err('deadline', 'deadline must be a valid date in YYYY-MM-DD format or null');
    else value.deadline = body.deadline;
  }
  if (has('description')) {
    if (!isString(body.description) || body.description.length > 2000)
      err('description', 'description must be a string of at most 2000 characters');
    else value.description = body.description.trim();
  }

  if (partial && errors.length === 0 && Object.keys(value).length === 0)
    errors.push({ field: 'body', message: 'Provide at least one valid field to update' });

  return { errors, value };
}

module.exports = { validateInternship, MODES, STATUSES };
