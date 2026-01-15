// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CTDraftPrized
 * @notice Prized fantasy CT Draft leagues with ETH entry fees and automated payouts
 * @dev Handles payment escrow, refunds, and prize distribution
 */
contract CTDraftPrized {
    // ============ STRUCTS ============

    enum ContestStatus {
        OPEN,       // Accepting entries
        LOCKED,     // No more entries/changes, contest running
        FINALIZED,  // Rankings submitted, prizes claimable
        CANCELLED   // Contest cancelled, refunds available
    }

    struct Contest {
        uint256 id;
        uint256 entryFee;           // Entry fee in wei
        uint256 minPlayers;         // Minimum players to run (else cancel)
        uint256 maxPlayers;         // Maximum players (0 = unlimited)
        uint256 lockTime;           // Timestamp when entries lock
        uint256 endTime;            // Timestamp when contest ends
        uint256 prizePool;          // Total prize pool (accumulates from entries)
        uint256 playerCount;        // Current number of entries
        ContestStatus status;
        bool prizesClaimed;         // Track if all prizes distributed
    }

    struct Entry {
        address player;
        uint256[5] teamIds;         // Influencer IDs (1-100)
        uint256 captainId;          // Captain influencer ID (1.5x multiplier)
        uint256 paidAmount;         // Amount paid (for refund tracking)
        uint256 rank;               // Final rank (0 = not ranked yet)
        uint256 prizeAmount;        // Prize won (0 = not calculated yet)
        bool claimed;               // Has player claimed their prize
        bool exists;
    }

    // Prize distribution in basis points (out of 10000)
    // After 15% platform fee, remaining 85% distributed as:
    struct PrizeDistribution {
        uint256 rankStart;   // Starting rank (1-indexed)
        uint256 rankEnd;     // Ending rank (inclusive)
        uint256 bps;         // Basis points of prize pool
    }

    // ============ STATE ============

    address public owner;
    address public treasury;
    uint256 public contestCount;

    // Platform fee: 15% (1500 basis points)
    uint256 public constant PLATFORM_FEE_BPS = 1500;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Team constraints
    uint256 public constant TEAM_SIZE = 5;
    uint256 public constant MAX_INFLUENCER_ID = 100;

    // Mappings
    mapping(uint256 => Contest) public contests;
    mapping(uint256 => mapping(address => Entry)) public entries;
    mapping(uint256 => address[]) public contestPlayers; // All players in a contest

    // Default prize distribution (can be customized per contest in future)
    // 1st: 40%, 2nd: 25%, 3rd: 15%, 4-5th: 5% each, 6-10th: 2% each
    PrizeDistribution[] public defaultDistribution;

    // ============ EVENTS ============

    event ContestCreated(
        uint256 indexed contestId,
        uint256 entryFee,
        uint256 minPlayers,
        uint256 lockTime,
        uint256 endTime
    );
    event ContestEntered(
        uint256 indexed contestId,
        address indexed player,
        uint256[5] teamIds,
        uint256 captainId
    );
    event TeamUpdated(
        uint256 indexed contestId,
        address indexed player,
        uint256[5] teamIds,
        uint256 captainId
    );
    event ContestLocked(uint256 indexed contestId, uint256 playerCount, uint256 prizePool);
    event ContestFinalized(uint256 indexed contestId, uint256 prizePool);
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
    error ContestAlreadyFinalized();
    error ContestFull();
    error AlreadyEntered();
    error NotEntered();
    error InvalidEntryFee();
    error InvalidTeamSize();
    error InvalidInfluencerId(uint256 id);
    error InvalidCaptain();
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

    // ============ MODIFIERS ============

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;

        // Initialize default prize distribution
        // 1st place: 40%
        defaultDistribution.push(PrizeDistribution(1, 1, 4000));
        // 2nd place: 25%
        defaultDistribution.push(PrizeDistribution(2, 2, 2500));
        // 3rd place: 15%
        defaultDistribution.push(PrizeDistribution(3, 3, 1500));
        // 4-5th place: 5% each
        defaultDistribution.push(PrizeDistribution(4, 5, 500));
        // 6-10th place: 2% each
        defaultDistribution.push(PrizeDistribution(6, 10, 200));
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Create a new prized contest
     * @param entryFee Entry fee in wei
     * @param minPlayers Minimum players required (0 = no minimum)
     * @param maxPlayers Maximum players allowed (0 = unlimited)
     * @param lockTime Timestamp when entries lock
     * @param endTime Timestamp when contest ends
     */
    function createContest(
        uint256 entryFee,
        uint256 minPlayers,
        uint256 maxPlayers,
        uint256 lockTime,
        uint256 endTime
    ) external onlyOwner returns (uint256) {
        if (lockTime <= block.timestamp) revert InvalidTimeWindow();
        if (endTime <= lockTime) revert InvalidTimeWindow();

        contestCount++;
        uint256 contestId = contestCount;

        contests[contestId] = Contest({
            id: contestId,
            entryFee: entryFee,
            minPlayers: minPlayers,
            maxPlayers: maxPlayers,
            lockTime: lockTime,
            endTime: endTime,
            prizePool: 0,
            playerCount: 0,
            status: ContestStatus.OPEN,
            prizesClaimed: false
        });

        emit ContestCreated(contestId, entryFee, minPlayers, lockTime, endTime);
        return contestId;
    }

    /**
     * @notice Lock contest (called after lockTime, or manually by admin)
     * @param contestId Contest ID
     */
    function lockContest(uint256 contestId) external onlyOwner {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.OPEN) revert ContestNotOpen();
        if (block.timestamp < contest.lockTime) revert TooEarlyToLock();

        // Check minimum players
        if (contest.playerCount < contest.minPlayers) {
            // Auto-cancel if below minimum
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

        // Calculate platform fee
        uint256 platformFee = (contest.prizePool * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 distributablePool = contest.prizePool - platformFee;

        // Send platform fee to treasury
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
            emit PlatformFeeCollected(contestId, platformFee);
        }

        // Assign ranks and calculate prizes
        for (uint256 i = 0; i < rankedPlayers.length; i++) {
            address player = rankedPlayers[i];
            Entry storage entry = entries[contestId][player];

            if (!entry.exists) revert InvalidRankings();

            uint256 rank = i + 1; // 1-indexed rank
            entry.rank = rank;

            // Calculate prize based on rank
            uint256 prizeAmount = _calculatePrize(rank, distributablePool, contest.playerCount);
            entry.prizeAmount = prizeAmount;
        }

        contest.status = ContestStatus.FINALIZED;
        emit ContestFinalized(contestId, contest.prizePool);
    }

    /**
     * @notice Cancel contest and enable refunds
     * @param contestId Contest ID
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
     * @param teamIds Array of 5 influencer IDs
     * @param captainId Captain influencer ID (must be in team)
     */
    function enterContest(
        uint256 contestId,
        uint256[5] calldata teamIds,
        uint256 captainId
    ) external payable {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.OPEN) revert ContestNotOpen();
        if (block.timestamp >= contest.lockTime) revert ContestIsLocked();
        if (entries[contestId][msg.sender].exists) revert AlreadyEntered();
        if (contest.maxPlayers > 0 && contest.playerCount >= contest.maxPlayers) revert ContestFull();
        if (msg.value != contest.entryFee) revert InvalidEntryFee();

        // Validate team
        _validateTeam(teamIds, captainId);

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
     * @param contestId Contest ID
     * @param teamIds New team influencer IDs
     * @param captainId New captain ID
     */
    function updateTeam(
        uint256 contestId,
        uint256[5] calldata teamIds,
        uint256 captainId
    ) external {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.OPEN) revert ContestNotOpen();
        if (block.timestamp >= contest.lockTime) revert ContestIsLocked();

        Entry storage entry = entries[contestId][msg.sender];
        if (!entry.exists) revert NotEntered();

        // Validate new team
        _validateTeam(teamIds, captainId);

        // Update entry
        entry.teamIds = teamIds;
        entry.captainId = captainId;

        emit TeamUpdated(contestId, msg.sender, teamIds, captainId);
    }

    /**
     * @notice Withdraw entry and get refund (before lock time)
     * @param contestId Contest ID
     */
    function withdrawEntry(uint256 contestId) external {
        Contest storage contest = contests[contestId];
        if (contest.id == 0) revert ContestNotFound();
        if (contest.status != ContestStatus.OPEN) revert ContestNotOpen();
        if (block.timestamp >= contest.lockTime) revert ContestIsLocked();

        Entry storage entry = entries[contestId][msg.sender];
        if (!entry.exists) revert NotEntered();

        uint256 refundAmount = entry.paidAmount;

        // Remove entry
        entry.exists = false;
        contest.playerCount--;
        contest.prizePool -= refundAmount;

        // Send refund
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit EntryWithdrawn(contestId, msg.sender, refundAmount);
    }

    /**
     * @notice Claim prize after contest is finalized
     * @param contestId Contest ID
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
     * @param contestId Contest ID
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

    /**
     * @notice Get contest details
     */
    function getContest(uint256 contestId) external view returns (Contest memory) {
        return contests[contestId];
    }

    /**
     * @notice Get user's entry in a contest
     */
    function getEntry(uint256 contestId, address player) external view returns (Entry memory) {
        return entries[contestId][player];
    }

    /**
     * @notice Get all players in a contest
     */
    function getContestPlayers(uint256 contestId) external view returns (address[] memory) {
        return contestPlayers[contestId];
    }

    /**
     * @notice Check if user has entered a contest
     */
    function hasEntered(uint256 contestId, address player) external view returns (bool) {
        return entries[contestId][player].exists;
    }

    /**
     * @notice Get prize pool after platform fee
     */
    function getDistributablePrizePool(uint256 contestId) external view returns (uint256) {
        Contest memory contest = contests[contestId];
        return contest.prizePool - (contest.prizePool * PLATFORM_FEE_BPS / BPS_DENOMINATOR);
    }

    // ============ INTERNAL FUNCTIONS ============

    function _validateTeam(uint256[5] calldata teamIds, uint256 captainId) internal pure {
        bool captainFound = false;

        for (uint256 i = 0; i < TEAM_SIZE; i++) {
            // Validate ID range
            if (teamIds[i] == 0 || teamIds[i] > MAX_INFLUENCER_ID) {
                revert InvalidInfluencerId(teamIds[i]);
            }

            // Check captain is in team
            if (teamIds[i] == captainId) {
                captainFound = true;
            }

            // Check for duplicates
            for (uint256 j = i + 1; j < TEAM_SIZE; j++) {
                if (teamIds[i] == teamIds[j]) {
                    revert DuplicateInfluencer();
                }
            }
        }

        if (!captainFound) revert InvalidCaptain();
    }

    function _calculatePrize(
        uint256 rank,
        uint256 distributablePool,
        uint256 totalPlayers
    ) internal view returns (uint256) {
        // For small contests, adjust distribution
        if (totalPlayers < 10) {
            return _calculateSmallContestPrize(rank, distributablePool, totalPlayers);
        }

        // Standard distribution for 10+ players
        for (uint256 i = 0; i < defaultDistribution.length; i++) {
            PrizeDistribution memory pd = defaultDistribution[i];
            if (rank >= pd.rankStart && rank <= pd.rankEnd) {
                return (distributablePool * pd.bps) / BPS_DENOMINATOR;
            }
        }

        return 0; // No prize for ranks outside distribution
    }

    function _calculateSmallContestPrize(
        uint256 rank,
        uint256 distributablePool,
        uint256 totalPlayers
    ) internal pure returns (uint256) {
        // For contests with < 10 players, pay out top 30% (minimum 1)
        uint256 paidPositions = totalPlayers * 30 / 100;
        if (paidPositions == 0) paidPositions = 1;

        if (rank > paidPositions) return 0;

        if (paidPositions == 1) {
            // Winner takes all
            return distributablePool;
        } else if (paidPositions == 2) {
            // 1st: 65%, 2nd: 35%
            return rank == 1
                ? (distributablePool * 6500) / BPS_DENOMINATOR
                : (distributablePool * 3500) / BPS_DENOMINATOR;
        } else if (paidPositions == 3) {
            // 1st: 50%, 2nd: 30%, 3rd: 20%
            if (rank == 1) return (distributablePool * 5000) / BPS_DENOMINATOR;
            if (rank == 2) return (distributablePool * 3000) / BPS_DENOMINATOR;
            return (distributablePool * 2000) / BPS_DENOMINATOR;
        } else {
            // Distribute evenly among remaining
            return distributablePool / paidPositions;
        }
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

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    /**
     * @notice Emergency withdraw (only if contract has stuck funds)
     * @dev Should only be used if there's a bug and funds are stuck
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        if (!success) revert TransferFailed();
    }
}
