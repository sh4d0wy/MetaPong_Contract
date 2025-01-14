// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract PongGame {
    struct Player {
        uint256 score;
        uint256 boosterBalls;
        bool isActive;
    }

    struct LeaderboardEntry {
        address player;
        uint256 score;
    }

    struct Tournament {
        uint256 startTime;
        uint256 endTime;
        address[10] topPlayers;
        uint256[10] topScores;
    }

    address public owner;
    address public server;
    mapping(address => Player) private players;
    address[10] public currentLeaderboardPlayers;
    uint256[10] public currentLeaderboardScores;
    mapping(uint256 => Tournament) public tournaments;
    uint256 public currentTournamentId;
    uint256 public tournamentStartTime;
    address[] private playerAddresses;
    
    uint256 public constant TOURNAMENT_DURATION = 30 days;
    uint256 public constant BOOSTER_BALL_PRICE = 10 ether; // 10 XFI
    uint256 public constant BOOSTER_BALL_PACKAGE = 100;
    uint256 public constant MPX_CONVERSION_RATE = 10000; // 1 score = 0.0001 MPX

    event ScoreUpdated(address indexed player, uint256 newScore, uint256 remainingBoosterBalls, bool isNewPlayer);
    event LeaderboardUpdated(address indexed player, uint256 score, uint256 rank);
    event BoosterBallsPurchased(address indexed player, uint256 amount);
    event TournamentReset(uint256 tournamentId, uint256 startTime, uint256 endTime);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event NewPlayerAdded(address indexed player);

    modifier onlyOwnerOrServer() {
        require(msg.sender == owner || msg.sender == server, "Only owner/server can call this function");
        _;
    }


    constructor() {
        owner = msg.sender;
        tournamentStartTime = block.timestamp;
        currentTournamentId = 1;
    }

    function transferOwnership(address newOwner) public onlyOwnerOrServer {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function changeServer(address newServer) public onlyOwnerOrServer{
        require(newServer != address(0),"New server cannot be zero address");
        emit OwnershipTransferred(server, newServer);
        server = newServer;
    }

    function incrementScore(uint256 points, uint256 boosterBallsUsed) public {
        require(points > 0, "Points must be greater than 0");
        require(boosterBallsUsed <= players[msg.sender].boosterBalls, "Not enough booster balls");
        
        bool isNewPlayer = !players[msg.sender].isActive;
        if (isNewPlayer) {
            playerAddresses.push(msg.sender);
            emit NewPlayerAdded(msg.sender);
        }
        
        // Update score and booster balls in one transaction
        players[msg.sender].score += points;
        players[msg.sender].boosterBalls -= boosterBallsUsed;
        players[msg.sender].isActive = true;
        
        updateLeaderboard(msg.sender, players[msg.sender].score);
        
        emit ScoreUpdated(
            msg.sender, 
            players[msg.sender].score, 
            players[msg.sender].boosterBalls, 
            isNewPlayer
        );
    }

    function updateLeaderboard(address player, uint256 score) private  {
        uint256 position = 10;
        
        // Find position for the new score
        for (uint256 i = 0; i < 10; i++) {
            if (currentLeaderboardPlayers[i] == player) {
                currentLeaderboardScores[i] = score;
                position = i;
                break;
            } else if (currentLeaderboardScores[i] < score || currentLeaderboardPlayers[i] == address(0)) {
                position = i;
                break;
            }
        }

        if (position < 10) {
            // Shift existing entries down
            for (uint256 i = 9; i > position; i--) {
                currentLeaderboardPlayers[i] = currentLeaderboardPlayers[i-1];
                currentLeaderboardScores[i] = currentLeaderboardScores[i-1];
            }
            
            // Insert new entry
            currentLeaderboardPlayers[position] = player;
            currentLeaderboardScores[position] = score;
            
            emit LeaderboardUpdated(player, score, position);
        }
    }

    function resetTournament() private onlyOwnerOrServer{
        // Store current tournament data
        Tournament storage newTournament = tournaments[currentTournamentId];
        newTournament.startTime = tournamentStartTime;
        newTournament.endTime = block.timestamp;
        
        // Copy current leaderboard to tournament storage
        for(uint256 i = 0; i < 10; i++) {
            newTournament.topPlayers[i] = currentLeaderboardPlayers[i];
            newTournament.topScores[i] = currentLeaderboardScores[i];
        }
        
        // Start new tournament without resetting scores
        currentTournamentId++;
        tournamentStartTime = block.timestamp;
        
        emit TournamentReset(
            currentTournamentId,
            tournamentStartTime,
            tournamentStartTime + TOURNAMENT_DURATION
        );
    }

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

    function getCurrentLeaderboard() public view returns (
        address[10] memory _players,
        uint256[10] memory _scores
    ) {
        return (currentLeaderboardPlayers, currentLeaderboardScores);
    }

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

    function isEligibleForAirdrop(address player) public view returns (bool isEligible)  {
        return (players[player].isActive && players[player].score > 10000) ? true : false;
    }
    function buyBoosterBalls() public payable  {
        require(msg.value == BOOSTER_BALL_PRICE, "Incorrect payment amount");
        players[msg.sender].boosterBalls += BOOSTER_BALL_PACKAGE;
        emit BoosterBallsPurchased(msg.sender, BOOSTER_BALL_PACKAGE);
    }

    function getPlayerStats(address player) public view returns (uint256 score, uint256 boosterBalls, bool isActive) {
        Player memory p = players[player];
        return (p.score, p.boosterBalls, p.isActive);
    }

    function convertScoresToMPX(address player) public view onlyOwnerOrServer returns (uint256) {
        return players[player].score / MPX_CONVERSION_RATE;
    }

    function withdrawFunds() public onlyOwnerOrServer {
        payable(owner).transfer(address(this).balance);
    }
}