const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.PG_URI,
});

module.exports = { pool };

// `postgres://${process.env.USER_NAME}:${PASSWORD}@${HOST}/${DATABASE}`;
