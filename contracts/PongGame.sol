// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title PongGame Smart Contract
/// @author Original Developer
/// @notice This contract manages a blockchain-based Pong game with tournament functionality
/// @dev Implements game mechanics, tournament tracking, and leaderboard systems
contract PongGame {
    // === Structs ===
    
    /// @notice Stores individual player data
    /// @dev All player-specific data is stored in this struct to minimize separate storage reads
    struct Player {
        uint256 score;          // Player's current score
        uint256 boosterBalls;   // Number of booster balls available to the player
        bool isActive;          // Whether the player has participated in the game
    }

    /// @notice Represents a single entry in the leaderboard
    struct LeaderboardEntry {
        address player;         // Player's address
        uint256 score;         // Player's score
    }

    /// @notice Stores tournament-specific data
    /// @dev Fixed arrays are used to save gas and maintain consistent leaderboard size
    struct Tournament {
        uint256 startTime;              // Tournament start timestamp
        uint256 endTime;                // Tournament end timestamp
        address[10] topPlayers;         // Addresses of top 10 players
        uint256[10] topScores;          // Scores of top 10 players
    }

    // === State Variables ===
    
    address public owner;                                   // Contract owner address
    address public server;                                  // Server address for privileged operations
    mapping(address => Player) private players;             // Maps player addresses to their data
    address[10] public currentLeaderboardPlayers;          // Current tournament's top players
    uint256[10] public currentLeaderboardScores;           // Current tournament's top scores
    mapping(uint256 => Tournament) public tournaments;      // Maps tournament IDs to tournament data
    uint256 public currentTournamentId;                    // Current tournament identifier
    uint256 public tournamentStartTime;                    // Current tournament start timestamp
    address[] private playerAddresses;                     // Array of all player addresses
    
    // === Constants ===
    
    /// @notice Duration of each tournament (30 days)
    uint256 public constant TOURNAMENT_DURATION = 30 days;
    
    /// @notice Price for purchasing booster balls (10 XFI)
    uint256 public constant BOOSTER_BALL_PRICE = 10 ether;
    
    /// @notice Number of booster balls received per purchase
    uint256 public constant BOOSTER_BALL_PACKAGE = 100;
    
    /// @notice Rate for converting game scores to MPX tokens (1 score = 0.0001 MPX)
    uint256 public constant MPX_CONVERSION_RATE = 10000;

    // === Events ===
    
    /// @notice Emitted when a player's score is updated
    event ScoreUpdated(address indexed player, uint256 newScore, uint256 remainingBoosterBalls, bool isNewPlayer);
    
    /// @notice Emitted when the leaderboard changes
    event LeaderboardUpdated(address indexed player, uint256 score, uint256 rank);
    
    /// @notice Emitted when a player purchases booster balls
    event BoosterBallsPurchased(address indexed player, uint256 amount);
    
    /// @notice Emitted when a tournament is reset
    event TournamentReset(uint256 tournamentId, uint256 startTime, uint256 endTime);
    
    /// @notice Emitted when contract ownership is transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    /// @notice Emitted when a new player joins the game
    event NewPlayerAdded(address indexed player);

    // === Modifiers ===
    
    /// @notice Restricts function access to owner or server
    /// @dev Used for administrative functions
    modifier onlyOwnerOrServer() {
        require(msg.sender == owner || msg.sender == server, "Only owner/server can call this function");
        _;
    }

    /// @notice Initializes the contract with the deployer as owner
    constructor() {
        owner = msg.sender;
        tournamentStartTime = block.timestamp;
        currentTournamentId = 1;
    }

    // === Administrative Functions ===

    /// @notice Transfers contract ownership to a new address
    /// @param newOwner Address of the new owner
    function transferOwnership(address newOwner) public onlyOwnerOrServer {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Changes the server address
    /// @param newServer Address of the new server
    function changeServer(address newServer) public onlyOwnerOrServer {
        require(newServer != address(0), "New server cannot be zero address");
        emit OwnershipTransferred(server, newServer);
        server = newServer;
    }

    // === Game Mechanics ===

    /// @notice Updates player's score and consumes booster balls
    /// @param points Points to add to the player's score
    /// @param boosterBallsUsed Number of booster balls to consume
    /// @param user Address of the player
    function incrementScore(uint256 points, uint256 boosterBallsUsed, address user) public {
        require(points > 0, "Points must be greater than 0");
        require(boosterBallsUsed <= players[user].boosterBalls, "Not enough booster balls");
        
        bool isNewPlayer = !players[user].isActive;
        if (isNewPlayer) {
            playerAddresses.push(user);
            emit NewPlayerAdded(user);
        }
        
        // Update player data atomically
        players[user].score += points;
        players[user].boosterBalls -= boosterBallsUsed;
        players[user].isActive = true;
        
        updateLeaderboard(user, players[user].score);
        
        emit ScoreUpdated(user, players[user].score, players[user].boosterBalls, isNewPlayer);
    }

/// @notice Updates the tournament leaderboard
/// @dev Maintains a sorted list of top 10 players
/// @param player Address of the player to update
/// @param score New score of the player
function updateLeaderboard(address player, uint256 score) private {
    // First, remove the existing entry of the player if it exists
    int256 existingPosition = -1;
    for (uint256 i = 0; i < 10; i++) {
        if (currentLeaderboardPlayers[i] == player) {
            existingPosition = int256(i);
            break;
        }
    }
    
    // If player was found, remove them by shifting all elements up
    if (existingPosition != -1) {
        for (uint256 i = uint256(existingPosition); i < 9; i++) {
            currentLeaderboardPlayers[i] = currentLeaderboardPlayers[i + 1];
            currentLeaderboardScores[i] = currentLeaderboardScores[i + 1];
        }
        // Clear the last position
        currentLeaderboardPlayers[9] = address(0);
        currentLeaderboardScores[9] = 0;
    }
    
    // Find the correct position for the new score
    uint256 insertPosition = 10;
    for (uint256 i = 0; i < 10; i++) {
        if (currentLeaderboardScores[i] < score || currentLeaderboardPlayers[i] == address(0)) {
            insertPosition = i;
            break;
        }
    }
    
    // Only proceed if the score qualifies for the leaderboard
    if (insertPosition < 10) {
        // Shift lower scores down
        for (uint256 i = 9; i > insertPosition; i--) {
            currentLeaderboardPlayers[i] = currentLeaderboardPlayers[i - 1];
            currentLeaderboardScores[i] = currentLeaderboardScores[i - 1];
        }
        
        // Insert new score
        currentLeaderboardPlayers[insertPosition] = player;
        currentLeaderboardScores[insertPosition] = score;
        
        emit LeaderboardUpdated(player, score, insertPosition);
    }
}

    // === Tournament Management ===

    /// @notice Ends current tournament and starts a new one
    /// @dev Preserves current tournament data in storage
    function resetTournament() public onlyOwnerOrServer {
        Tournament storage newTournament = tournaments[currentTournamentId];
        newTournament.startTime = tournamentStartTime;
        newTournament.endTime = block.timestamp;
        
        // Archive current leaderboard
        for(uint256 i = 0; i < 10; i++) {
            newTournament.topPlayers[i] = currentLeaderboardPlayers[i];
            newTournament.topScores[i] = currentLeaderboardScores[i];
        }
        
        currentTournamentId++;
        tournamentStartTime = block.timestamp;
        
        emit TournamentReset(
            currentTournamentId,
            tournamentStartTime,
            tournamentStartTime + TOURNAMENT_DURATION
        );
    }

    // === View Functions ===

    /// @notice Gets current tournament information
    /// @return tournamentId Current tournament ID
    /// @return startTime Tournament start timestamp
    /// @return endTime Tournament end timestamp
    /// @return timeRemaining Time remaining in current tournament
    function getCurrentTournamentInfo() public view returns (
        uint256 tournamentId,
        uint256 startTime,
        uint256 endTime,
        uint256 timeRemaining
    ) {
        uint256 tournamentEnd = tournamentStartTime + TOURNAMENT_DURATION;
        uint256 remaining = block.timestamp >= tournamentEnd ? 0 : tournamentEnd - block.timestamp;
        
        return (
            currentTournamentId,
            tournamentStartTime,
            tournamentEnd,
            remaining
        );
    }

    /// @notice Gets current leaderboard
    /// @return _players Array of top player addresses
    /// @return _scores Array of top player scores
    function getCurrentLeaderboard() public view returns (
        address[10] memory _players,
        uint256[10] memory _scores
    ) {
        return (currentLeaderboardPlayers, currentLeaderboardScores);
    }

    /// @notice Gets historical tournament leaderboard
    /// @param tournamentId ID of the tournament to query
    /// @return startTime Tournament start time
    /// @return endTime Tournament end time
    /// @return _players Array of top player addresses
    /// @return _scores Array of top player scores
    function getTournamentLeaderboard(uint256 tournamentId) public view returns (
        uint256 startTime,
        uint256 endTime,
        address[10] memory _players,
        uint256[10] memory _scores
    ) {
        require(tournamentId > 0 && tournamentId < currentTournamentId, "Invalid tournament ID");
        Tournament storage tournament = tournaments[tournamentId];
        return (
            tournament.startTime,
            tournament.endTime,
            tournament.topPlayers,
            tournament.topScores
        );
    }

    /// @notice Gets all eligible players and their scores
    /// @dev Only accessible by owner or server
    /// @return addresses Array of player addresses
    /// @return scores Array of player scores
    function getAllPlayers() public view onlyOwnerOrServer returns (address[] memory addresses, uint256[] memory scores) {
        uint256 length = playerAddresses.length;
        addresses = new address[](length);
        scores = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            if(!isEligibleForAirdrop(playerAddresses[i])){
                continue;
            }
            address playerAddress = playerAddresses[i];
            addresses[i] = playerAddress;
            scores[i] = players[playerAddress].score;
        }
        return (addresses, scores);
    }

    /// @notice Checks if a player is eligible for airdrop
    /// @param player Address of the player to check
    /// @return isEligible True if player is eligible
    function isEligibleForAirdrop(address player) public view returns (bool isEligible) {
        return (players[player].isActive && players[player].score > 10000);
    }

    /// @notice Allows players to purchase booster balls
    /// @dev Requires exact payment in XFI
    function buyBoosterBalls() public payable {
        require(msg.value == BOOSTER_BALL_PRICE, "Incorrect payment amount");
        players[msg.sender].boosterBalls += BOOSTER_BALL_PACKAGE;
        emit BoosterBallsPurchased(msg.sender, BOOSTER_BALL_PACKAGE);
    }

    /// @notice Gets player statistics
    /// @param player Address of the player
    /// @return score Player's current score
    /// @return boosterBalls Number of booster balls owned
    /// @return isActive Whether player is active
    function getPlayerStats(address player) public view returns (uint256 score, uint256 boosterBalls, bool isActive) {
        Player memory p = players[player];
        return (p.score, p.boosterBalls, p.isActive);
    }

    /// @notice Converts player scores to MPX tokens
    /// @param player Address of the player
    /// @return Converted MPX amount
    function convertScoresToMPX(address player) public view onlyOwnerOrServer returns (uint256) {
        return players[player].score / MPX_CONVERSION_RATE;
    }

    /// @notice Withdraws contract balance to owner
    /// @dev Only callable by owner or server
    function withdrawFunds() public onlyOwnerOrServer {
        payable(owner).transfer(address(this).balance);
    }
}