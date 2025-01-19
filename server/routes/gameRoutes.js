// src/routes/gameRoutes.js
const express = require('express');
const GameController = require('../controllers/GameController');

const router = express.Router();

router.get('/tournament/current', GameController.getCurrentTournament);
router.get('/leaderboard', GameController.getLeaderboard);
router.get('/player/:address', GameController.getPlayerStats);
router.post('/score/increment', GameController.incrementScore);
router.post('/tournament/reset', GameController.resetTournament);
router.get('/players', GameController.getAllPlayers);
router.get('/player/:address/mpx', GameController.getMPXScore);

module.exports = router;
