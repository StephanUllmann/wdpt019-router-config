const { pool } = require('../db.js');

const checkUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
    if (user.rowCount === 0) {
      return res.status(404).json({ error: 'No user found' });
    }
    req.user = user.rows[0];
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { checkUser };
