// src/models/ContractModel.js
const { ethers } = require('ethers');

class ContractModel {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        this.contractABI = [
            "function incrementScore(uint256 points, uint256 boosterBallsUsed)",
            "function getCurrentLeaderboard() view returns (address[10], uint256[10])",
            "function getCurrentTournamentInfo() view returns (uint256, uint256, uint256, uint256)",
            "function getPlayerStats(address) view returns (uint256, uint256, bool)",
            "function resetTournament()",
            "function getAllPlayers() view returns (address[], uint256[])",
            "function convertScoresToMPX(address) view returns (uint256)"
        ];
        this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.wallet);
    }

    async getCurrentTournamentInfo() {
        const info = await this.contract.getCurrentTournamentInfo();
        return {
            tournamentId: info[0],
            startTime: info[1],
            endTime: info[2],
            timeRemaining: info[3]
        };
    }

    async getCurrentLeaderboard() {
        const [players, scores] = await this.contract.getCurrentLeaderboard();
        return players.map((player, index) => ({
            player,
            score: Number(scores[index])
        }));
    }

    async getPlayerStats(address) {
        const [score, boosterBalls, isActive] = await this.contract.getPlayerStats(address);
        return {
            score: Number(score),
            boosterBalls: Number(boosterBalls),
            isActive
        };
    }

    async incrementScore(points, boosterBallsUsed) {
        const tx = await this.contract.incrementScore(points, boosterBallsUsed);
        return await tx.wait();
    }

    async resetTournament() {
        const tx = await this.contract.resetTournament();
        return await tx.wait();
    }

    async getAllPlayers() {
        const [addresses, scores] = await this.contract.getAllPlayers();
        return addresses.map((address, index) => ({
            address,
            score: Number(scores[index])
        }));
    }

    async convertScoresToMPX(address) {
        const mpxScore = await this.contract.convertScoresToMPX(address);
        return Number(mpxScore);
    }
}

module.exports = new ContractModel();
