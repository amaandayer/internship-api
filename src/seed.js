const path = require('path');
const db = require('./db');
const records = require(path.join(__dirname, '..', 'data', 'internship-records-sample.json'));

const insert = db.prepare(
  `INSERT INTO internships (title, company, location, mode, stipend, duration_weeks, status, deadline, description)
   VALUES (@title, @company, @location, @mode, @stipend, @duration_weeks, @status, @deadline, @description)`
);

const defaults = { stipend: 0, duration_weeks: 8, status: 'open', deadline: null, description: '' };

db.exec('BEGIN');
try {
  db.exec("DELETE FROM internships; DELETE FROM sqlite_sequence WHERE name = 'internships';");
  records.forEach((r) => insert.run({ ...defaults, ...r }));
  db.exec('COMMIT');
} catch (e) {
  db.exec('ROLLBACK');
  throw e;
}

console.log(`Seeded ${records.length} internship records.`);
