// src/models/ContractModel.js
const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const PongGameArtifact = require('../abi.json');

class ContractModel {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        
        // Configure the network after provider creation
        this.provider.network = {
            chainId: parseInt(process.env.CHAIN_ID),
            name: 'CrossFi Testnet',
            nativeCurrency: {
                name: 'XFI',
                symbol: 'XFI',
                decimals: 18
            }
        };
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        console.log('RPC_URL:', process.env.RPC_URL);
        console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        console.log("Contract address from env",process.env.CONTRACT_ADDRESS);
        this.contractAddress = process.env.CONTRACT_ADDRESS;
        this.contractABI = PongGameArtifact.abi;
        
        // Add error handling and validation
        if (!process.env.CONTRACT_ADDRESS) {
            throw new Error('CONTRACT_ADDRESS not found in environment variables');
        }
        
        this.contract = new ethers.Contract(
            process.env.CONTRACT_ADDRESS,
            PongGameArtifact.abi,
            this.wallet
        );
    }

    async getCurrentTournamentInfo() {
        try {
            // Add these debug lines
            const code = await this.provider.getCode(this.contractAddress);
            console.log('Contract code exists:', code !== '0x');
            
            const result = await this.contract.getCurrentTournamentInfo();
            console.log('Raw result:', result);
            
            // In ethers v6, you need to destructure the result properly
            // The result will be an array-like object with both numeric indices and named properties
            const tournamentInfo = {
                tournamentId: result[0], // or result.tournamentId
                startTime: result[1],    // or result.startTime
                endTime: result[2],      // or result.endTime
                timeRemaining: result[3]  // or result.timeRemaining
            };
            
            // Convert BigInts to numbers if needed
            return {
                tournamentId: Number(tournamentInfo.tournamentId),
                startTime: Number(tournamentInfo.startTime),
                endTime: Number(tournamentInfo.endTime),
                timeRemaining: Number(tournamentInfo.timeRemaining)
            };
        } catch (error) {
            console.log('Detailed error:', error);
            // Also log the error code and any additional properties
            console.log('Error code:', error.code);
            console.log('Error data:', error.data);
            throw error;
        }
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
    async getBoosterBallPrice() {
        const price = await this.contract.BOOSTER_BALL_PRICE();
        console.log('price is', price);
        return ethers.formatEther(price); // Convert to ETH
    }

    async buyBoosterBalls() {
        const price = await this.contract.BOOSTER_BALL_PRICE();
        const tx = await this.contract.buyBoosterBalls({ 
            value: price 
        });
        return await tx.wait();
    }
    async incrementScore(points, boosterBallsUsed,userAddress) {
        const tx = await this.contract.incrementScore(points, boosterBallsUsed,userAddress);
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

    async getBoosterBallPurchaseData(userAddress) {
        try {
            // Get the price in Wei (1 XFI = 10^18 Wei)
            const priceInXFI = 10; // Your fixed price
            const priceInWei = BigInt(priceInXFI * (10 ** 18)).toString(); // Convert to Wei and then to string
            
            // Create a new interface with just the function we need
            const iface = new ethers.Interface([
                "function buyBoosterBalls() payable"
            ]);
            
            // Encode the function call
            const txData = iface.encodeFunctionData("buyBoosterBalls", []);
            
            return {
                to: this.contractAddress,
                from: userAddress,
                data: txData,
                value: priceInWei, // Now sending a string representation of the Wei amount
                chainId: parseInt(process.env.CHAIN_ID),
                gasLimit: "300000"
            };
        } catch (error) {
            console.error('Error details:', error);
            throw new Error(`Failed to generate purchase data: ${error.message}`);
        }
    }

    // Add method to get booster ball balance
    async getBoosterBallBalance(address) {
        const [, boosterBalls] = await this.contract.getPlayerStats(address);
        return Number(boosterBalls);
    }

    // Add method to check tournament eligibility
    async isEligibleForAirdrop(address) {
        return await this.contract.isEligibleForAirdrop(address);
    }
}

module.exports = new ContractModel();
