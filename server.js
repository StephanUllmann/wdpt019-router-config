const express = require('express');
const cors = require('cors');
require('colors');
// require('dotenv').config()
const { body, validationResult } = require('express-validator');

const { checkUser } = require('./middlewares/checkUser.js');

const { pool } = require('./db.js');

const createSQL = `
  DROP TABLE IF EXISTS users;
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL
  );
  INSERT INTO users (firstname, lastname) VALUES ('Brendan', 'Eich') RETURNING *;
`;

const seedDB = async () => {
  const result = await pool.query(createSQL);
  console.log(result);
};

// seedDB();

const app = express();

const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/users', async (req, res) => {
  try {
    const { rows, rowCount } = await pool.query('SELECT * FROM users;');
    // console.log(rows);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'No User found' });
    }
    res.json({ data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows, rowCount } = await pool.query('SELECT * FROM users WHERE id=$1;', [id]);
    // console.log(rows);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const validationChain = [
  body('firstname').exists().notEmpty().isLength({ min: 1, max: 12 }).withMessage('Needs a first name'),
  body('lastname').isString(),
];

app.post('/users', validationChain, async (req, res) => {
  const valRes = validationResult(res);
  console.log(valRes);
  if (!valRes.isEmpty()) {
    return res.status(400).json({ error: valRes.array() });
  }

  const { firstname, lastname } = req.body;
  try {
    const { rows, rowCount } = await pool.query(
      'INSERT INTO users (firstname, lastname) VALUES ($1, $2) RETURNING *;',
      [firstname, lastname]
    );
    if (rowCount === 0) {
      throw new Error('Posting new User failed');
    }
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/users/:id', checkUser, async (req, res) => {
  const { id } = req.params;
  const { firstname, lastname } = req.body;

  const user = req.user;

  if (!firstname && !lastname) {
    return res.status(400).json({ error: 'Please fill in your name' });
  }
  try {
    const userFirstName = user.firstname;
    const userLastName = user.lastname;

    const newFirstName = firstname || userFirstName;
    const newLastName = lastname || userLastName;

    const { rows, rowCount } = await pool.query(
      'UPDATE users SET firstname = $1, lastname = $2 WHERE id = $3 RETURNING *',
      [newFirstName, newLastName, id]
    );
    if (rowCount === 0) {
      throw new Error('Updating new User failed');
    }
    res.json({ data: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`CRUD app listening on http://localhost:${port}`.bgGreen);
});
