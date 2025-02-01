// const axios = require('axios');
// const { formatEther } = require('ethers');

class GameClient {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        // This is just a test address - in reality, this would come from user's wallet
        this.testAddress = '0xA433cf593297386cea675Aab3e166Ba71A851CB0';
    }

    // Check if wallet is connected
    async checkWalletConnection() {
        if (!window.ethereum) {
            throw new Error('No Web3 wallet found! Please install MetaMask or similar wallet.');
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            return accounts[0];
        } catch (error) {
            throw new Error('Failed to connect wallet: ' + error.message);
        }
    }

    async buyBoosterBalls() {
        try {
            // First ensure wallet is connected and get address
            const userAddress = await this.checkWalletConnection();
            console.log('Connected wallet address:', userAddress);

            // Get transaction data from server
            console.log('Getting purchase data from server...');
            const response = await axios.post(`${this.baseURL}/boosterball/purchase-data`, {
                userAddress: userAddress
            });
            const txData = response.data.transaction;
            console.log('Received transaction data:', txData);

            // Convert the value to hexadecimal string for ethereum
            const valueHex = BigInt(txData.value).toString(16);

            // Request transaction signature from wallet
            console.log('Requesting wallet signature...');
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    to: txData.to,
                    from: userAddress,
                    value: '0x' + valueHex, // Prefix with '0x' for hex string
                    data: txData.data,
                    gasLimit: txData.gasLimit,
                    chainId: txData.chainId
                }]
            });

            console.log('Transaction sent! Hash:', txHash);
            return txHash;

        } catch (error) {
            console.error('Failed to buy booster balls:', error);
            throw error;
        }
    }

    async getCurrentTournament() {
        try {
            const response = await axios.get(`${this.baseURL}/tournament/current`);
            return response.data;
        } catch (error) {
            console.error('Failed to get tournament:', error);
            throw error;
        }
    }

    async resetTournament() {
        try {
            const response = await axios.post(`${this.baseURL}/tournament/reset`);
            return response.data;
        } catch (error) {
            console.error('Failed to reset tournament:', error);
            throw error;
        }
    }

    async incrementScore(points) {
        try {
            const userAddress = await this.checkWalletConnection();
            const response = await axios.post(`${this.baseURL}/score/increment`, {
                points: points,
                boosterBallsUsed: 0,
                userAddress:userAddress
            });
            return response.data;
        } catch (error) {
            console.error('Failed to increment score:', error);
            throw error;
        }
    }

    async getPlayerStats() {
        try {
            const userAddress = await this.checkWalletConnection();
            const response = await axios.get(`${this.baseURL}/player/${userAddress}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get player stats:', error);
            throw error;
        }
    }

    async getMPXScore() {
        try {
            const userAddress = await this.checkWalletConnection();
            const response = await axios.get(`${this.baseURL}/player/${userAddress}/mpx`);
            return response.data;
        } catch (error) {
            console.error('Failed to get MPX score:', error);
            throw error;
        }
    }

    async getLeaderboard() {
        try {
            const response = await axios.get(`${this.baseURL}/leaderboard`);
            return response.data;
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            throw error;
        }
    }

    async getAllPlayers() {
        try {
            const response = await axios.get(`${this.baseURL}/players`);
            return response.data;
        } catch (error) {
            console.error('Failed to get all players:', error);
            throw error;
        }
    }

    async testAllFunctions() {
        try {
            console.log('Starting tests...\n');
            console.log('Testing with address:', this.testAddress);

            // Test regular read functions
            console.log('\n1. Testing getCurrentTournament...');
            const tournament = await axios.get(`${this.baseURL}/tournament/current`);
            console.log('Current Tournament:', tournament.data);

            console.log('\n2. Testing getPlayerStats...');
            const playerStats = await axios.get(`${this.baseURL}/player/${this.testAddress}`);
            console.log('Player Stats:', playerStats.data);

            // Test Booster Ball Purchase Flow
            console.log('\n3. Testing Booster Ball Purchase Flow...');
            
            // Get the purchase transaction data
            console.log('Getting purchase transaction data...');
            const purchaseDataResponse = await axios.post(`${this.baseURL}/boosterball/purchase-data`, {
                userAddress: this.testAddress
            });
            const txData = purchaseDataResponse.data.transaction;
            
            console.log('\nTransaction data received from server:');
            console.log(txData);
            
            console.log('\nIn a real application, this transaction data would be:');
            console.log('1. Sent to the user\'s Web3 wallet (MetaMask, Web3Auth, etc.)');
            console.log('2. Signed by the user\'s wallet');
            console.log('3. Broadcast to the blockchain');
            
            console.log('\nExample wallet prompt would show:');
            console.log({
                to: txData.to,
                value: `${BigInt(txData.value)} Wei (${ethers.formatEther(txData.value)} XFI)`,
                gasLimit: txData.gasLimit,
                chainId: txData.chainId,
                data: txData.data
            });

        } catch (error) {
            console.error('Test failed:', {
                endpoint: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                error: error.response?.data || error.message
            });
        }
    }
}

// Test function handlers
const client = new GameClient();

async function testGetCurrentTournament() {
    try {
        const result = await client.getCurrentTournament();
        document.getElementById('tournamentResult').innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('tournamentResult').innerText = `Error: ${error.message}`;
    }
}

async function testResetTournament() {
    try {
        const result = await client.resetTournament();
        document.getElementById('tournamentResult').innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('tournamentResult').innerText = `Error: ${error.message}`;
    }
}

async function testIncrementScore() {
    try {
        const points = parseInt(document.getElementById('scoreInput').value) || 0;
        const result = await client.incrementScore(points);
        document.getElementById('playerResult').innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('playerResult').innerText = `Error: ${error.message}`;
    }
}

async function testGetPlayerStats() {
    try {
        const result = await client.getPlayerStats();
        document.getElementById('playerResult').innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('playerResult').innerText = `Error: ${error.message}`;
    }
}

async function testGetMPXScore() {
    try {
        const result = await client.getMPXScore();
        document.getElementById('playerResult').innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('playerResult').innerText = `Error: ${error.message}`;
    }
}

async function testGetLeaderboard() {
    try {
        const result = await client.getLeaderboard();
        document.getElementById('leaderboardResult').innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('leaderboardResult').innerText = `Error: ${error.message}`;
    }
}

async function testGetAllPlayers() {
    try {
        const result = await client.getAllPlayers();
        document.getElementById('leaderboardResult').innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('leaderboardResult').innerText = `Error: ${error.message}`;
    }
}

async function testPurchaseBoosterBalls() {
    try {
        const result = await client.buyBoosterBalls();
        document.getElementById('boosterResult').innerText = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('boosterResult').innerText = `Error: ${error.message}`;
    }
}

// // Run the tests
client.testAllFunctions(); 