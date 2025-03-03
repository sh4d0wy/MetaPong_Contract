// src/controllers/GameController.js
const ContractModel = require('../models/ContractModel');

class GameController {
    async getCurrentTournament(req, res) {
        try {
            const tournamentInfo = await ContractModel.getCurrentTournamentInfo();
            res.json({ success: true, data: tournamentInfo });
        } catch (error) {
            console.error('Tournament fetch error:', error);
            res.status(400).json({ 
                success: false, 
                error: error.message || 'Failed to fetch tournament information'
            });
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
            const { points, boosterBallsUsed,userAddress } = req.body;
            const receipt = await ContractModel.incrementScore(points, boosterBallsUsed,userAddress);
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

    async getBoosterBallPurchaseData(req, res) {
        try {
            const { userAddress } = req.body;
            if (!userAddress) {
                return res.status(400).json({ error: 'User address is required' });
            }

            const purchaseData = await ContractModel.getBoosterBallPurchaseData(userAddress);
            res.json({ transaction: purchaseData });
        } catch (error) {
            console.error('Error getting purchase data:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async getTournamentLeaderboard(req, res) {
        try {
            const tournamentId = parseInt(req.params.tournamentId);
            if (isNaN(tournamentId) || tournamentId <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid tournament ID' 
                });
            }

            // Get current tournament info to check if the requested tournament is current
            const currentTournament = await ContractModel.getCurrentTournamentInfo();
            
            // If requesting current tournament, return current leaderboard
            if (tournamentId === currentTournament.tournamentId) {
                const currentLeaderboard = await ContractModel.getCurrentLeaderboard();
                return res.json({ 
                    success: true, 
                    data: {
                        startTime: currentTournament.startTime,
                        endTime: currentTournament.endTime,
                        leaderboard: currentLeaderboard,
                        isCurrentTournament: true
                    }
                });
            }

            // Otherwise, get historical tournament data
            const leaderboard = await ContractModel.getTournamentLeaderboard(tournamentId);
            res.json({ 
                success: true, 
                data: {
                    ...leaderboard,
                    isCurrentTournament: false
                }
            });
        } catch (error) {
            console.error('Tournament leaderboard fetch error:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message || 'Failed to fetch tournament leaderboard' 
            });
        }
    }
}

module.exports = new GameController();
