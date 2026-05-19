// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../RideEscrow.sol";

contract DeployRideEscrow is Script {
    function run() external {
        address platformWallet = vm.envAddress("PLATFORM_WALLET_ADDRESS");
        address arbiter = vm.envAddress("ARBITER_ADDRESS");

        vm.startBroadcast();
        RideEscrow escrow = new RideEscrow(platformWallet, arbiter);
        vm.stopBroadcast();

        console.log("RideEscrow deployed:", address(escrow));
    }
}
