// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../RideEscrow.sol";
import "../MockUSDC.sol";

contract RideEscrowTest is Test {
    RideEscrow public escrow;
    MockUSDC public usdc;

    address platform = makeAddr("platform");
    address arbiter = makeAddr("arbiter");
    address rider = makeAddr("rider");
    address driver = makeAddr("driver");

    bytes32 rideId = keccak256("ride-001");
    uint256 constant AMOUNT = 30 * 10 ** 6;
    uint256 constant FEE_BPS = 500;

    function setUp() public {
        escrow = new RideEscrow(platform, arbiter);
        usdc = new MockUSDC();
        usdc.mint(rider, AMOUNT);
        vm.prank(rider);
        usdc.approve(address(escrow), AMOUNT);
    }

    function test_deposit_success() public {
        vm.prank(rider);
        escrow.deposit(rideId, driver, AMOUNT, FEE_BPS, address(usdc));

        RideEscrow.Escrow memory e = escrow.getEscrow(rideId);
        assertEq(e.rider, rider);
        assertEq(e.amount, AMOUNT);
        assertEq(uint256(e.status), uint256(RideEscrow.EscrowStatus.Deposited));
    }

    function test_release_splits_fee() public {
        vm.prank(rider);
        escrow.deposit(rideId, driver, AMOUNT, FEE_BPS, address(usdc));
        vm.prank(rider);
        escrow.release(rideId);

        uint256 fee = (AMOUNT * FEE_BPS) / 10000;
        assertEq(usdc.balanceOf(driver), AMOUNT - fee);
        assertEq(usdc.balanceOf(platform), fee);
    }

    function test_refund_returns_full_amount() public {
        vm.prank(rider);
        escrow.deposit(rideId, driver, AMOUNT, FEE_BPS, address(usdc));
        escrow.refund(rideId);
        assertEq(usdc.balanceOf(rider), AMOUNT);
    }

    function test_dispute_then_resolve_to_rider() public {
        vm.prank(rider);
        escrow.deposit(rideId, driver, AMOUNT, FEE_BPS, address(usdc));
        vm.prank(rider);
        escrow.openDispute(rideId);
        vm.prank(arbiter);
        escrow.resolveDispute(rideId, rider, AMOUNT);
        assertEq(usdc.balanceOf(rider), AMOUNT);
    }

    function test_cannot_double_deposit() public {
        vm.prank(rider);
        escrow.deposit(rideId, driver, AMOUNT, FEE_BPS, address(usdc));
        usdc.mint(rider, AMOUNT);
        vm.prank(rider);
        usdc.approve(address(escrow), AMOUNT);
        vm.prank(rider);
        vm.expectRevert("Escrow already exists");
        escrow.deposit(rideId, driver, AMOUNT, FEE_BPS, address(usdc));
    }

    function test_fee_cap_enforced() public {
        vm.expectRevert("Platform fee too high");
        vm.prank(rider);
        escrow.deposit(rideId, driver, AMOUNT, 2001, address(usdc));
    }

    function test_driver_cannot_release() public {
        vm.prank(rider);
        escrow.deposit(rideId, driver, AMOUNT, FEE_BPS, address(usdc));
        vm.prank(driver);
        vm.expectRevert("Unauthorized");
        escrow.release(rideId);
    }
}
