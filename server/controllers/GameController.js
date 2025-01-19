// src/controllers/GameController.js
const ContractModel = require('../models/ContractModel');

class GameController {
    async getCurrentTournament(req, res) {
        try {
            const tournamentInfo = await ContractModel.getCurrentTournamentInfo();
            res.json(tournamentInfo);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getLeaderboard(req, res) {
        try {
            const leaderboard = await ContractModel.getCurrentLeaderboard();
            res.json(leaderboard);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getPlayerStats(req, res) {
        try {
            const stats = await ContractModel.getPlayerStats(req.params.address);
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async incrementScore(req, res) {
        try {
            const { points, boosterBallsUsed } = req.body;
            const receipt = await ContractModel.incrementScore(points, boosterBallsUsed);
            res.json({ success: true, transactionHash: receipt.hash });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async resetTournament(req, res) {
        try {
            const receipt = await ContractModel.resetTournament();
            res.json({ success: true, transactionHash: receipt.hash });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getAllPlayers(req, res) {
        try {
            const players = await ContractModel.getAllPlayers();
            res.json(players);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getMPXScore(req, res) {
        try {
            const mpxScore = await ContractModel.convertScoresToMPX(req.params.address);
            res.json({ mpxScore });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new GameController();
