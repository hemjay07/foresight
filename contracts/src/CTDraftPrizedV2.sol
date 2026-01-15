// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CTDraftPrizedV2
 * @notice Multi-tier fantasy CT Draft leagues with variable entry fees, team sizes, and prize structures
 * @dev Supports Weekly (5 picks + captain) and Daily Flash (3 picks, no captain) contests
 */
contract CTDraftPrizedV2 {
    // ============ ENUMS ============

    enum ContestType {
        WEEKLY_STARTER,     // 0.002 ETH, 5 picks, captain, 168 hours, 10% rake
        WEEKLY_STANDARD,    // 0.01 ETH, 5 picks, captain, 168 hours, 12% rake
        WEEKLY_PRO,         // 0.05 ETH, 5 picks, captain, 168 hours, 8% rake
        DAILY_FLASH         // 0.001 ETH, 3 picks, no captain, 24 hours, 10% rake
    }

    enum ContestStatus {
        OPEN,       // Accepting entries
        LOCKED,     // No more entries/changes, contest running
        FINALIZED,  // Rankings submitted, prizes claimable
        CANCELLED   // Contest cancelled, refunds available
    }

    // ============ STRUCTS ============

    struct ContestConfig {
        ContestType contestType;
        uint256 entryFee;           // Entry fee in wei
        uint8 teamSize;             // 3 or 5
        uint8 rakePercent;          // 8, 10, or 12
        bool hasCaptain;            // True for weekly, false for daily
        uint256 durationHours;      // 168 for weekly, 24 for daily
    }

    struct Contest {
        uint256 id;
        ContestType contestType;
        uint256 entryFee;           // Entry fee in wei
        uint8 teamSize;             // 3 or 5
        uint8 rakePercent;          // Platform fee percentage
        bool hasCaptain;            // Whether captain scoring applies
        uint256 minPlayers;         // Minimum players to run
        uint256 maxPlayers;         // Maximum players (0 = unlimited)
        uint256 lockTime;           // Timestamp when entries lock
        uint256 endTime;            // Timestamp when contest ends
        uint256 prizePool;          // Total prize pool
        uint256 playerCount;        // Current number of entries
        ContestStatus status;
        bool prizesClaimed;
    }

    struct Entry {
        address player;
        uint256[] teamIds;          // Dynamic array: 3 or 5 influencer IDs
        uint256 captainId;          // Captain ID (0 if no captain)
        uint256 paidAmount;         // Amount paid (for refund tracking)
        uint256 rank;               // Final rank (0 = not ranked yet)
        uint256 prizeAmount;        // Prize won
        bool claimed;               // Has player claimed their prize
        bool exists;
    }

    // Prize distribution tier
    struct PrizeTier {
        uint256 minPlayers;
        uint256 maxPlayers;         // 0 = no max
        uint256[] rankBps;          // Basis points for each rank (1st, 2nd, etc.)
    }

    // ============ STATE ============

    address public owner;
    address public treasury;
    uint256 public contestCount;

    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_INFLUENCER_ID = 100;

    // Contest type configurations
    mapping(ContestType => ContestConfig) public contestConfigs;

    // Contest storage
    mapping(uint256 => Contest) public contests;
    mapping(uint256 => mapping(address => Entry)) public entries;
    mapping(uint256 => address[]) public contestPlayers;

    // Prize distribution tiers
    PrizeTier[] public prizeTiers;

    // ============ EVENTS ============

    event ContestCreated(
        uint256 indexed contestId,
        ContestType contestType,
        uint256 entryFee,
        uint8 teamSize,
        uint8 rakePercent,
        uint256 lockTime,
        uint256 endTime
    );

    event ContestEntered(
        uint256 indexed contestId,
        address indexed player,
        uint256[] teamIds,
        uint256 captainId
    );

    event TeamUpdated(
        uint256 indexed contestId,
        address indexed player,
        uint256[] teamIds,
        uint256 captainId
    );

    event ContestLocked(uint256 indexed contestId, uint256 playerCount, uint256 prizePool);
    event ContestFinalized(uint256 indexed contestId, uint256 prizePool, uint256 winnersCount);
    event ContestCancelled(uint256 indexed contestId, uint256 refundCount);
    event EntryWithdrawn(uint256 indexed contestId, address indexed player, uint256 refundAmount);
    event PrizeClaimed(uint256 indexed contestId, address indexed player, uint256 rank, uint256 amount);
    event PlatformFeeCollected(uint256 indexed contestId, uint256 amount);

    // ============ ERRORS ============

    error OnlyOwner();
    error ContestNotFound();
    error ContestNotOpen();
    error ContestNotLocked();
    error ContestNotFinalized();
    error ContestFull();
    error AlreadyEntered();
    error NotEntered();
    error InvalidEntryFee();
    error InvalidTeamSize();
    error InvalidInfluencerId(uint256 id);
    error InvalidCaptain();
    error CaptainNotAllowed();
    error DuplicateInfluencer();
    error ContestIsLocked();
    error ContestNotEnded();
    error BelowMinPlayers();
    error InvalidRankings();
    error AlreadyClaimed();
    error NoPrize();
    error TransferFailed();
    error TooEarlyToLock();
    error InvalidTimeWindow();
    error InvalidContestType();

    // ============ MODIFIERS ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;

        // Initialize contest type configurations
        // WEEKLY_STARTER: 0.002 ETH, 5 picks, captain, 168 hours, 10% rake
        contestConfigs[ContestType.WEEKLY_STARTER] = ContestConfig({
            contestType: ContestType.WEEKLY_STARTER,
            entryFee: 0.002 ether,
            teamSize: 5,
            rakePercent: 10,
            hasCaptain: true,
            durationHours: 168
        });

        // WEEKLY_STANDARD: 0.01 ETH, 5 picks, captain, 168 hours, 12% rake
        contestConfigs[ContestType.WEEKLY_STANDARD] = ContestConfig({
            contestType: ContestType.WEEKLY_STANDARD,
            entryFee: 0.01 ether,
            teamSize: 5,
            rakePercent: 12,
            hasCaptain: true,
            durationHours: 168
        });

        // WEEKLY_PRO: 0.05 ETH, 5 picks, captain, 168 hours, 8% rake
        contestConfigs[ContestType.WEEKLY_PRO] = ContestConfig({
            contestType: ContestType.WEEKLY_PRO,
            entryFee: 0.05 ether,
            teamSize: 5,
            rakePercent: 8,
            hasCaptain: true,
            durationHours: 168
        });

        // DAILY_FLASH: 0.001 ETH, 3 picks, no captain, 24 hours, 10% rake
        contestConfigs[ContestType.DAILY_FLASH] = ContestConfig({
            contestType: ContestType.DAILY_FLASH,
            entryFee: 0.001 ether,
            teamSize: 3,
            rakePercent: 10,
            hasCaptain: false,
            durationHours: 24
        });

        // Initialize prize distribution tiers
        _initializePrizeTiers();
    }

    function _initializePrizeTiers() internal {
        // Small contests (10-20 players) - Top 30% win
        uint256[] memory small = new uint256[](6);
        small[0] = 4000;  // 1st: 40%
        small[1] = 2500;  // 2nd: 25%
        small[2] = 1500;  // 3rd: 15%
        small[3] = 700;   // 4th: 7%
        small[4] = 500;   // 5th: 5%
        small[5] = 800;   // 6th+: split 8%
        prizeTiers.push(PrizeTier(10, 20, small));

        // Medium contests (21-50 players) - Top 35% win
        uint256[] memory medium = new uint256[](11);
        medium[0] = 3000;   // 1st: 30%
        medium[1] = 2000;   // 2nd: 20%
        medium[2] = 1200;   // 3rd: 12%
        medium[3] = 600;    // 4th: 6%
        medium[4] = 500;    // 5th: 5%
        medium[5] = 400;    // 6th: 4%
        medium[6] = 300;    // 7th: 3%
        medium[7] = 300;    // 8th: 3%
        medium[8] = 200;    // 9th: 2%
        medium[9] = 200;    // 10th: 2%
        medium[10] = 1300;  // 11th+: split 13%
        prizeTiers.push(PrizeTier(21, 50, medium));

        // Large contests (51+ players) - Top 40% win
        uint256[] memory large = new uint256[](11);
        large[0] = 2500;    // 1st: 25%
        large[1] = 1500;    // 2nd: 15%
        large[2] = 1000;    // 3rd: 10%
        large[3] = 500;     // 4th: 5%
        large[4] = 500;     // 5th: 5%
        large[5] = 300;     // 6th: 3%
        large[6] = 300;     // 7th: 3%
        large[7] = 250;     // 8th: 2.5%
        large[8] = 250;     // 9th: 2.5%
        large[9] = 200;     // 10th: 2%
        large[10] = 2700;   // 11th+: split 27%
        prizeTiers.push(PrizeTier(51, 0, large));
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Create a new contest of a specific type
     * @param contestType Type of contest (determines entry fee, team size, etc.)
     * @param minPlayers Minimum players required (0 = no minimum)
     * @param maxPlayers Maximum players allowed (0 = unlimited)
     * @param lockTime Timestamp when entries lock
     * @param endTime Timestamp when contest ends
     */
    function createContest(
        ContestType contestType,
        uint256 minPlayers,
        uint256 maxPlayers,
        uint256 lockTime,
        uint256 endTime
    ) external onlyOwner returns (uint256) {
        if (lockTime <= block.timestamp) revert InvalidTimeWindow();
        if (endTime <= lockTime) revert InvalidTimeWindow();

        ContestConfig memory config = contestConfigs[contestType];

        contestCount++;
        uint256 contestId = contestCount;

        contests[contestId] = Contest({
            id: contestId,
            contestType: contestType,
            entryFee: config.entryFee,
            teamSize: config.teamSize,
            rakePercent: config.rakePercent,
            hasCaptain: config.hasCaptain,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            lockTime: lockTime,
            endTime: endTime,
            prizePool: 0,
            playerCount: 0,
            status: ContestStatus.OPEN,
            prizesClaimed: false
        });

        emit ContestCreated(
            contestId,
            contestType,
            config.entryFee,
            config.teamSize,
            config.rakePercent,
            lockTime,
            endTime
        );

        return contestId;
    }

    /**
     * @notice Create a custom contest with specific parameters (for flexibility)
     */
    function createCustomContest(
        uint256 entryFee,
        uint8 teamSize,
        uint8 rakePercent,
        bool hasCaptain,
        uint256 minPlayers,
        uint256 maxPlayers,
        uint256 lockTime,
        uint256 endTime
    ) external onlyOwner returns (uint256) {
        if (lockTime <= block.timestamp) revert InvalidTimeWindow();
        if (endTime <= lockTime) revert InvalidTimeWindow();
        if (teamSize != 3 && teamSize != 5) revert InvalidTeamSize();
        if (rakePercent > 20) revert InvalidContestType(); // Max 20% rake

        contestCount++;
        uint256 contestId = contestCount;

        contests[contestId] = Contest({
            id: contestId,
            contestType: ContestType.WEEKLY_STARTER, // Default type for custom
            entryFee: entryFee,
            teamSize: teamSize,
            rakePercent: rakePercent,
            hasCaptain: hasCaptain,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            lockTime: lockTime,
            endTime: endTime,
            prizePool: 0,
            playerCount: 0,
            status: ContestStatus.OPEN,
            prizesClaimed: false
        });

        emit ContestCreated(
            contestId,
            ContestType.WEEKLY_STARTER,
            entryFee,
            teamSize,
            rakePercent,
            lockTime,
            endTime
        );

        return contestId;
    }

    /**
     * @notice Lock contest (called after lockTime)
     */
    function lockContest(uint256 contestId) external onlyOwner {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.OPEN) revert ContestNotOpen();
        if (block.timestamp < contest.lockTime) revert TooEarlyToLock();

        // Check minimum players
        if (contest.playerCount < contest.minPlayers) {
            _cancelContest(contestId);
            return;
        }

        contest.status = ContestStatus.LOCKED;
        emit ContestLocked(contestId, contest.playerCount, contest.prizePool);
    }

    /**
     * @notice Finalize contest with rankings from backend
     * @param contestId Contest ID
     * @param rankedPlayers Ordered array of player addresses (1st place first)
     */
    function finalizeContest(
        uint256 contestId,
        address[] calldata rankedPlayers
    ) external onlyOwner {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.LOCKED) revert ContestNotLocked();
        if (block.timestamp < contest.endTime) revert ContestNotEnded();
        if (rankedPlayers.length != contest.playerCount) revert InvalidRankings();

        // Calculate platform fee using contest's rake percent
        uint256 platformFee = (contest.prizePool * contest.rakePercent * 100) / BPS_DENOMINATOR;
        uint256 distributablePool = contest.prizePool - platformFee;

        // Send platform fee to treasury
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
            emit PlatformFeeCollected(contestId, platformFee);
        }

        // Determine prize tier based on player count
        uint256[] memory rankBps = _getPrizeTierBps(contest.playerCount);
        uint256 winnersCount = _calculateWinnersCount(contest.playerCount);

        // Assign ranks and calculate prizes
        uint256 lastRankBps = rankBps[rankBps.length - 1];

        for (uint256 i = 0; i < rankedPlayers.length; i++) {
            address player = rankedPlayers[i];
            Entry storage entry = entries[contestId][player];

            if (!entry.exists) revert InvalidRankings();

            uint256 rank = i + 1;
            entry.rank = rank;

            // Calculate prize based on rank
            uint256 prizeAmount = 0;
            if (rank <= winnersCount) {
                if (rank <= rankBps.length - 1) {
                    // Fixed percentage for top ranks
                    prizeAmount = (distributablePool * rankBps[rank - 1]) / BPS_DENOMINATOR;
                } else {
                    // Split remaining among lower winning ranks
                    uint256 remainingWinners = winnersCount - (rankBps.length - 1);
                    if (remainingWinners > 0) {
                        uint256 poolForRemaining = (distributablePool * lastRankBps) / BPS_DENOMINATOR;
                        prizeAmount = poolForRemaining / remainingWinners;
                    }
                }
            }
            entry.prizeAmount = prizeAmount;
        }

        contest.status = ContestStatus.FINALIZED;
        emit ContestFinalized(contestId, contest.prizePool, winnersCount);
    }

    /**
     * @notice Cancel contest and enable refunds
     */
    function cancelContest(uint256 contestId) external onlyOwner {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.OPEN) revert ContestNotOpen();

        _cancelContest(contestId);
    }

    // ============ USER FUNCTIONS ============

    /**
     * @notice Enter a contest with team selection
     * @param contestId Contest ID
     * @param teamIds Array of influencer IDs (3 or 5 depending on contest type)
     * @param captainId Captain influencer ID (0 for contests without captain)
     */
    function enterContest(
        uint256 contestId,
        uint256[] calldata teamIds,
        uint256 captainId
    ) external payable {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.OPEN) revert ContestNotOpen();
        if (block.timestamp >= contest.lockTime) revert ContestIsLocked();
        if (entries[contestId][msg.sender].exists) revert AlreadyEntered();
        if (contest.maxPlayers > 0 && contest.playerCount >= contest.maxPlayers) revert ContestFull();
        if (msg.value != contest.entryFee) revert InvalidEntryFee();

        // Validate team size matches contest
        if (teamIds.length != contest.teamSize) revert InvalidTeamSize();

        // Validate team
        _validateTeam(teamIds, captainId, contest.hasCaptain);

        // Create entry
        entries[contestId][msg.sender] = Entry({
            player: msg.sender,
            teamIds: teamIds,
            captainId: captainId,
            paidAmount: msg.value,
            rank: 0,
            prizeAmount: 0,
            claimed: false,
            exists: true
        });

        contestPlayers[contestId].push(msg.sender);
        contest.playerCount++;
        contest.prizePool += msg.value;

        emit ContestEntered(contestId, msg.sender, teamIds, captainId);
    }

    /**
     * @notice Update team selection (before lock time)
     */
    function updateTeam(
        uint256 contestId,
        uint256[] calldata teamIds,
        uint256 captainId
    ) external {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.OPEN) revert ContestNotOpen();
        if (block.timestamp >= contest.lockTime) revert ContestIsLocked();

        Entry storage entry = entries[contestId][msg.sender];
        if (!entry.exists) revert NotEntered();

        // Validate team size
        if (teamIds.length != contest.teamSize) revert InvalidTeamSize();

        // Validate new team
        _validateTeam(teamIds, captainId, contest.hasCaptain);

        // Update entry
        entry.teamIds = teamIds;
        entry.captainId = captainId;

        emit TeamUpdated(contestId, msg.sender, teamIds, captainId);
    }

    /**
     * @notice Withdraw entry and get refund (before lock time)
     */
    function withdrawEntry(uint256 contestId) external {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.OPEN) revert ContestNotOpen();
        if (block.timestamp >= contest.lockTime) revert ContestIsLocked();

        Entry storage entry = entries[contestId][msg.sender];
        if (!entry.exists) revert NotEntered();

        uint256 refundAmount = entry.paidAmount;

        entry.exists = false;
        contest.playerCount--;
        contest.prizePool -= refundAmount;

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit EntryWithdrawn(contestId, msg.sender, refundAmount);
    }

    /**
     * @notice Claim prize after contest is finalized
     */
    function claimPrize(uint256 contestId) external {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.FINALIZED) revert ContestNotFinalized();

        Entry storage entry = entries[contestId][msg.sender];
        if (!entry.exists) revert NotEntered();
        if (entry.claimed) revert AlreadyClaimed();
        if (entry.prizeAmount == 0) revert NoPrize();

        entry.claimed = true;

        (bool success, ) = msg.sender.call{value: entry.prizeAmount}("");
        if (!success) revert TransferFailed();

        emit PrizeClaimed(contestId, msg.sender, entry.rank, entry.prizeAmount);
    }

    /**
     * @notice Claim refund after contest is cancelled
     */
    function claimRefund(uint256 contestId) external {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.CANCELLED) revert ContestNotOpen();

        Entry storage entry = entries[contestId][msg.sender];
        if (!entry.exists) revert NotEntered();
        if (entry.claimed) revert AlreadyClaimed();

        uint256 refundAmount = entry.paidAmount;
        entry.claimed = true;

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit EntryWithdrawn(contestId, msg.sender, refundAmount);
    }

    // ============ VIEW FUNCTIONS ============

    function getContest(uint256 contestId) external view returns (Contest memory) {
        return contests[contestId];
    }

    function getEntry(uint256 contestId, address player) external view returns (Entry memory) {
        return entries[contestId][player];
    }

    function getContestPlayers(uint256 contestId) external view returns (address[] memory) {
        return contestPlayers[contestId];
    }

    function hasEntered(uint256 contestId, address player) external view returns (bool) {
        return entries[contestId][player].exists;
    }

    function getDistributablePrizePool(uint256 contestId) external view returns (uint256) {
        Contest memory contest = contests[contestId];
        return contest.prizePool - (contest.prizePool * contest.rakePercent * 100 / BPS_DENOMINATOR);
    }

    function getContestConfig(ContestType contestType) external view returns (ContestConfig memory) {
        return contestConfigs[contestType];
    }

    function getEntryTeam(uint256 contestId, address player) external view returns (uint256[] memory) {
        return entries[contestId][player].teamIds;
    }

    // ============ INTERNAL FUNCTIONS ============

    function _validateTeam(
        uint256[] calldata teamIds,
        uint256 captainId,
        bool hasCaptain
    ) internal pure {
        bool captainFound = false;

        for (uint256 i = 0; i < teamIds.length; i++) {
            // Validate ID range
            if (teamIds[i] == 0 || teamIds[i] > MAX_INFLUENCER_ID) {
                revert InvalidInfluencerId(teamIds[i]);
            }

            // Check captain is in team
            if (hasCaptain && teamIds[i] == captainId) {
                captainFound = true;
            }

            // Check for duplicates
            for (uint256 j = i + 1; j < teamIds.length; j++) {
                if (teamIds[i] == teamIds[j]) {
                    revert DuplicateInfluencer();
                }
            }
        }

        // Validate captain
        if (hasCaptain) {
            if (captainId == 0) revert InvalidCaptain();
            if (!captainFound) revert InvalidCaptain();
        } else {
            if (captainId != 0) revert CaptainNotAllowed();
        }
    }

    function _getPrizeTierBps(uint256 playerCount) internal view returns (uint256[] memory) {
        for (uint256 i = 0; i < prizeTiers.length; i++) {
            PrizeTier storage tier = prizeTiers[i];
            if (playerCount >= tier.minPlayers &&
                (tier.maxPlayers == 0 || playerCount <= tier.maxPlayers)) {
                return tier.rankBps;
            }
        }
        // Default to small tier for very small contests
        return prizeTiers[0].rankBps;
    }

    function _calculateWinnersCount(uint256 playerCount) internal pure returns (uint256) {
        // Small contests (10-20): top 30%
        if (playerCount <= 20) {
            uint256 winners = (playerCount * 30) / 100;
            return winners > 0 ? winners : 1;
        }
        // Medium contests (21-50): top 35%
        if (playerCount <= 50) {
            return (playerCount * 35) / 100;
        }
        // Large contests (51+): top 40%
        return (playerCount * 40) / 100;
    }

    function _cancelContest(uint256 contestId) internal {
        Contest storage contest = contests[contestId];
        contest.status = ContestStatus.CANCELLED;
        emit ContestCancelled(contestId, contest.playerCount);
    }

    // ============ OWNER FUNCTIONS ============

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function updateContestConfig(
        ContestType contestType,
        uint256 entryFee,
        uint8 teamSize,
        uint8 rakePercent,
        bool hasCaptain
    ) external onlyOwner {
        if (teamSize != 3 && teamSize != 5) revert InvalidTeamSize();
        if (rakePercent > 20) revert InvalidContestType();

        contestConfigs[contestType] = ContestConfig({
            contestType: contestType,
            entryFee: entryFee,
            teamSize: teamSize,
            rakePercent: rakePercent,
            hasCaptain: hasCaptain,
            durationHours: contestConfigs[contestType].durationHours
        });
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }
}
