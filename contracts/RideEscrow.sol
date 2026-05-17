// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RideEscrow
 * @notice Minimal, secure escrow contract for Libre RideShare
 * 
 * Design Principles:
 * - One escrow per ride (identified by bytes32 rideId)
 * - Simple state machine (NONE → FUNDED → RELEASED/REFUNDED/DISPUTED)
 * - Backend controls when, contract enforces money rules
 * - Platform fee support (configurable)
 * - Future DAO arbitration hook
 * 
 * Security:
 * - Deposit only once
 * - Release only once
 * - Refund only if not released
 * - No self-dealing
 * - Platform fee capped
 */
contract RideEscrow {
    // ============ State ============
    
    enum State {
        NONE,      // Escrow doesn't exist
        FUNDED,    // Funds deposited, ride in progress
        RELEASED,  // Ride completed, driver paid
        REFUNDED,  // Ride cancelled, rider refunded
        DISPUTED   // Dispute initiated, funds frozen
    }

    struct RideEscrow {
        address rider;
        address driver;
        uint256 amount;
        State state;
        uint256 platformFeeBps; // Platform fee in basis points (e.g., 300 = 3%)
    }

    // Mapping: rideId (bytes32) → Escrow
    mapping(bytes32 => RideEscrow) public escrows;

    // Platform configuration
    address public platformTreasury;
    uint256 public defaultPlatformFeeBps; // Default platform fee (e.g., 300 = 3%)
    uint256 public maxPlatformFeeBps = 1000; // Max 10%

    // Access control
    address public owner;
    mapping(address => bool) public arbitrators; // Future DAO addresses

    // ============ Events ============

    event Deposited(
        bytes32 indexed rideId,
        address indexed rider,
        address indexed driver,
        uint256 amount,
        uint256 platformFeeBps
    );

    event Released(
        bytes32 indexed rideId,
        address indexed driver,
        uint256 driverAmount,
        uint256 platformFeeAmount
    );

    event Refunded(
        bytes32 indexed rideId,
        address indexed rider,
        uint256 amount
    );

    event Disputed(
        bytes32 indexed rideId,
        address indexed disputer
    );

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyArbitrator() {
        require(arbitrators[msg.sender] || msg.sender == owner, "Not arbitrator");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _platformTreasury,
        uint256 _defaultPlatformFeeBps
    ) {
        require(_platformTreasury != address(0), "Invalid treasury");
        require(_defaultPlatformFeeBps <= maxPlatformFeeBps, "Fee too high");
        
        owner = msg.sender;
        platformTreasury = _platformTreasury;
        defaultPlatformFeeBps = _defaultPlatformFeeBps;
    }

    // ============ Core Functions ============

    /**
     * @notice Deposit funds for a ride
     * @param rideId Unique ride identifier (bytes32 hash)
     * @param driver Driver wallet address
     * @param platformFeeBps Platform fee in basis points (0 = use default)
     * 
     * Requirements:
     * - msg.value > 0
     * - Escrow doesn't already exist
     * - Driver != rider
     * - Driver != address(0)
     */
    function deposit(
        bytes32 rideId,
        address driver,
        uint256 platformFeeBps
    ) external payable {
        require(msg.value > 0, "Amount must be > 0");
        require(escrows[rideId].state == State.NONE, "Escrow already exists");
        require(driver != address(0), "Invalid driver");
        require(driver != msg.sender, "Driver cannot be rider");

        uint256 feeBps = platformFeeBps > 0 ? platformFeeBps : defaultPlatformFeeBps;
        require(feeBps <= maxPlatformFeeBps, "Fee too high");

        escrows[rideId] = RideEscrow({
            rider: msg.sender,
            driver: driver,
            amount: msg.value,
            state: State.FUNDED,
            platformFeeBps: feeBps
        });

        emit Deposited(rideId, msg.sender, driver, msg.value, feeBps);
    }

    /**
     * @notice Release funds to driver (ride completed)
     * @param rideId Ride identifier
     * 
     * Requirements:
     * - Escrow exists and is FUNDED
     * - Can be called by rider, driver, or backend signer
     * 
     * Transfers:
     * - Platform fee → platformTreasury
     * - Remaining → driver
     */
    function release(bytes32 rideId) external {
        RideEscrow storage escrow = escrows[rideId];
        require(escrow.state == State.FUNDED, "Escrow not funded");
        require(
            msg.sender == escrow.rider ||
            msg.sender == escrow.driver ||
            arbitrators[msg.sender] ||
            msg.sender == owner,
            "Not authorized"
        );

        escrow.state = State.RELEASED;

        uint256 platformFeeAmount = (escrow.amount * escrow.platformFeeBps) / 10000;
        uint256 driverAmount = escrow.amount - platformFeeAmount;

        // Transfer platform fee
        if (platformFeeAmount > 0) {
            (bool feeSuccess, ) = platformTreasury.call{value: platformFeeAmount}("");
            require(feeSuccess, "Platform fee transfer failed");
        }

        // Transfer to driver
        (bool driverSuccess, ) = escrow.driver.call{value: driverAmount}("");
        require(driverSuccess, "Driver payment failed");

        emit Released(rideId, escrow.driver, driverAmount, platformFeeAmount);
    }

    /**
     * @notice Refund rider (ride cancelled)
     * @param rideId Ride identifier
     * 
     * Requirements:
     * - Escrow exists and is FUNDED
     * - Can be called by rider, driver, or backend signer
     * 
     * Transfers:
     * - Full amount → rider
     */
    function refund(bytes32 rideId) external {
        RideEscrow storage escrow = escrows[rideId];
        require(escrow.state == State.FUNDED, "Escrow not funded");
        require(
            msg.sender == escrow.rider ||
            msg.sender == escrow.driver ||
            arbitrators[msg.sender] ||
            msg.sender == owner,
            "Not authorized"
        );

        escrow.state = State.REFUNDED;

        // Full refund to rider
        (bool success, ) = escrow.rider.call{value: escrow.amount}("");
        require(success, "Refund failed");

        emit Refunded(rideId, escrow.rider, escrow.amount);
    }

    /**
     * @notice Initiate dispute (freeze funds)
     * @param rideId Ride identifier
     * 
     * Requirements:
     * - Escrow exists and is FUNDED
     * - Can be called by rider or driver
     * 
     * Effect:
     * - State → DISPUTED
     * - Funds frozen until arbitrator resolves
     */
    function dispute(bytes32 rideId) external {
        RideEscrow storage escrow = escrows[rideId];
        require(escrow.state == State.FUNDED, "Escrow not funded");
        require(
            msg.sender == escrow.rider ||
            msg.sender == escrow.driver,
            "Not authorized"
        );

        escrow.state = State.DISPUTED;

        emit Disputed(rideId, msg.sender);
    }

    /**
     * @notice Resolve dispute (arbitrator only)
     * @param rideId Ride identifier
     * @param releaseToRider If true, refund rider; if false, release to driver
     * 
     * Requirements:
     * - Escrow is DISPUTED
     * - Called by arbitrator or owner
     */
    function resolveDispute(bytes32 rideId, bool releaseToRider) external onlyArbitrator {
        RideEscrow storage escrow = escrows[rideId];
        require(escrow.state == State.DISPUTED, "Escrow not disputed");

        if (releaseToRider) {
            escrow.state = State.REFUNDED;
            (bool success, ) = escrow.rider.call{value: escrow.amount}("");
            require(success, "Refund failed");
            emit Refunded(rideId, escrow.rider, escrow.amount);
        } else {
            escrow.state = State.RELEASED;
            uint256 platformFeeAmount = (escrow.amount * escrow.platformFeeBps) / 10000;
            uint256 driverAmount = escrow.amount - platformFeeAmount;

            if (platformFeeAmount > 0) {
                (bool feeSuccess, ) = platformTreasury.call{value: platformFeeAmount}("");
                require(feeSuccess, "Platform fee transfer failed");
            }

            (bool driverSuccess, ) = escrow.driver.call{value: driverAmount}("");
            require(driverSuccess, "Driver payment failed");
            emit Released(rideId, escrow.driver, driverAmount, platformFeeAmount);
        }
    }

    // ============ View Functions ============

    /**
     * @notice Get escrow details
     */
    function getEscrow(bytes32 rideId) external view returns (RideEscrow memory) {
        return escrows[rideId];
    }

    /**
     * @notice Check if escrow exists and is active (FUNDED)
     */
    function isEscrowActive(bytes32 rideId) external view returns (bool) {
        return escrows[rideId].state == State.FUNDED;
    }

    /**
     * @notice Get escrow state
     */
    function getEscrowState(bytes32 rideId) external view returns (State) {
        return escrows[rideId].state;
    }

    // ============ Admin Functions ============

    function setPlatformTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        platformTreasury = _treasury;
    }

    function setDefaultPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= maxPlatformFeeBps, "Fee too high");
        defaultPlatformFeeBps = _feeBps;
    }

    function addArbitrator(address _arbitrator) external onlyOwner {
        require(_arbitrator != address(0), "Invalid address");
        arbitrators[_arbitrator] = true;
    }

    function removeArbitrator(address _arbitrator) external onlyOwner {
        arbitrators[_arbitrator] = false;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }

    // Emergency: Withdraw stuck funds (should never be needed)
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}
