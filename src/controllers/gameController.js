const db = require('../config/db');

exports.getGamesByGrade = async (req, res) => {
  const { grade } = req.query;

  if (!grade) {
    return res.status(400).json({ error: 'Grade parameter is required' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM games WHERE grade_level = $1', [grade]);
    res.status(200).json({ games: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllGames = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM games');
        res.status(200).json({ games: rows });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};
