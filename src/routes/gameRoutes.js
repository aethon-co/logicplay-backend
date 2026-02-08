const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { optionalAuth, requireAuth } = require('../middleware/auth');

router.get('/', optionalAuth, gameController.getGamesByGrade);
router.get('/all', requireAuth, gameController.getAllGames);

module.exports = router;
