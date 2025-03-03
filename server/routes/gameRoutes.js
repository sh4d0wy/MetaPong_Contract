// src/routes/gameRoutes.js
const express = require('express');
const GameController = require('../controllers/GameController');
const ContractModel = require('../models/ContractModel');

const router = express.Router();

router.get('/tournament/current', GameController.getCurrentTournament);
router.get('/leaderboard', GameController.getLeaderboard);
router.get('/leaderboard/:tournamentId', GameController.getTournamentLeaderboard);
router.get('/player/:address', GameController.getPlayerStats);
router.get('/players', GameController.getAllPlayers);
router.get('/player/:address/mpx', GameController.getMPXScore);

router.post('/score/increment', GameController.incrementScore);
router.post('/tournament/reset', GameController.resetTournament);
router.post('/boosterball/purchase-data', GameController.getBoosterBallPurchaseData);

router.get('/contract-status', async (req, res) => {
    try {
        const address = contractModel.contract.address;
        const code = await contractModel.provider.getCode(address);
        
        if (code === '0x') {
            res.status(400).json({ 
                success: false, 
                error: 'No contract found at specified address' 
            });
            return;
        }
        
        res.json({ 
            success: true, 
            contractAddress: address,
            hasCode: code !== '0x'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to check contract status'
        });
    }
});

module.exports = router;
