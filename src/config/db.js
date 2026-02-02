const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const connectionString = process.env.SUPABASE_URL;

if (!connectionString) {
  console.error('Missing SUPABASE_URL file');
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
