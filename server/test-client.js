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

// Example usage in browser
async function testPurchase() {
    const client = new GameClient();
    try {
        const txHash = await client.buyBoosterBalls();
        console.log('Purchase successful! Transaction hash:', txHash);
        
        // Optionally wait for transaction confirmation
        const receipt = await waitForTransaction(txHash);
        console.log('Transaction confirmed:', receipt);
    } catch (error) {
        console.error('Purchase failed:', error);
    }
}

// Helper function to wait for transaction confirmation
async function waitForTransaction(txHash) {
    const checkReceipt = async () => {
        const receipt = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
        });
        return receipt;
    };

    // Poll for transaction receipt
    while (true) {
        const receipt = await checkReceipt();
        if (receipt) {
            return receipt;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again
    }
}

// // Run the tests
const client = new GameClient();
client.testAllFunctions(); 