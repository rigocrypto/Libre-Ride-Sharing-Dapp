// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RideEscrow is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    enum EscrowStatus {
        None,
        Deposited,
        Released,
        Refunded,
        Disputed,
        Resolved
    }

    struct Escrow {
        address rider;
        address driver;
        address token;
        uint256 amount;
        uint256 platformFee;
        EscrowStatus status;
    }

    mapping(bytes32 => Escrow) public escrows;
    address public platformWallet;
    address public arbiter;

    event Deposited(
        bytes32 indexed rideId, address indexed token, uint256 amount, address indexed rider, address driver
    );
    event Released(bytes32 indexed rideId, address driver, uint256 driverAmount, uint256 platformFee);
    event Refunded(bytes32 indexed rideId, address rider, uint256 amount);
    event DisputeOpened(bytes32 indexed rideId);
    event DisputeResolved(bytes32 indexed rideId, address recipient, uint256 amount);

    constructor(address _platformWallet, address _arbiter) Ownable(msg.sender) {
        platformWallet = _platformWallet;
        arbiter = _arbiter;
    }

    function deposit(bytes32 rideId, address driver, uint256 amount, uint256 platformFeeBps, address token)
        external
        nonReentrant
    {
        require(escrows[rideId].status == EscrowStatus.None, "Escrow already exists");
        require(amount > 0, "Amount must be > 0");
        require(platformFeeBps <= 2000, "Platform fee too high");
        require(driver != address(0), "Invalid driver");

        uint256 platformFee = (amount * platformFeeBps) / 10000;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        escrows[rideId] = Escrow({
            rider: msg.sender,
            driver: driver,
            token: token,
            amount: amount,
            platformFee: platformFee,
            status: EscrowStatus.Deposited
        });

        emit Deposited(rideId, token, amount, msg.sender, driver);
    }

    function release(bytes32 rideId) external nonReentrant {
        Escrow storage e = escrows[rideId];
        require(e.status == EscrowStatus.Deposited, "Invalid escrow state");
        require(msg.sender == e.rider || msg.sender == owner() || msg.sender == arbiter, "Unauthorized");

        e.status = EscrowStatus.Released;
        uint256 driverAmount = e.amount - e.platformFee;

        IERC20(e.token).safeTransfer(e.driver, driverAmount);
        if (e.platformFee > 0) {
            IERC20(e.token).safeTransfer(platformWallet, e.platformFee);
        }

        emit Released(rideId, e.driver, driverAmount, e.platformFee);
    }

    function refund(bytes32 rideId) external nonReentrant {
        Escrow storage e = escrows[rideId];
        require(e.status == EscrowStatus.Deposited || e.status == EscrowStatus.Disputed, "Invalid escrow state");
        require(msg.sender == owner() || msg.sender == arbiter, "Unauthorized");

        e.status = EscrowStatus.Refunded;
        IERC20(e.token).safeTransfer(e.rider, e.amount);

        emit Refunded(rideId, e.rider, e.amount);
    }

    function openDispute(bytes32 rideId) external nonReentrant {
        Escrow storage e = escrows[rideId];
        require(e.status == EscrowStatus.Deposited, "Invalid escrow state");
        require(msg.sender == e.rider || msg.sender == e.driver, "Unauthorized");

        e.status = EscrowStatus.Disputed;
        emit DisputeOpened(rideId);
    }

    function resolveDispute(bytes32 rideId, address recipient, uint256 amount) external nonReentrant {
        require(msg.sender == arbiter || msg.sender == owner(), "Unauthorized");
        Escrow storage e = escrows[rideId];
        require(e.status == EscrowStatus.Disputed, "Not disputed");
        require(amount <= e.amount, "Amount exceeds escrow");
        require(recipient == e.rider || recipient == e.driver, "Invalid recipient");

        e.status = EscrowStatus.Resolved;
        IERC20(e.token).safeTransfer(recipient, amount);

        uint256 remainder = e.amount - amount;
        if (remainder > 0) {
            address other = recipient == e.rider ? e.driver : e.rider;
            IERC20(e.token).safeTransfer(other, remainder);
        }

        emit DisputeResolved(rideId, recipient, amount);
    }

    function getEscrow(bytes32 rideId) external view returns (Escrow memory) {
        return escrows[rideId];
    }

    function updatePlatformWallet(address _platformWallet) external onlyOwner {
        platformWallet = _platformWallet;
    }

    function updateArbiter(address _arbiter) external onlyOwner {
        arbiter = _arbiter;
    }
}
