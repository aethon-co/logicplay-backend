const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.get('/', gameController.getGamesByGrade);
router.get('/all', gameController.getAllGames);

module.exports = router;
