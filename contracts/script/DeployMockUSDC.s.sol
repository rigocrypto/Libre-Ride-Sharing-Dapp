// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../MockUSDC.sol";

contract DeployMockUSDC is Script {
    function run() external {
        address initialRecipient = vm.envOr("MOCK_USDC_RECIPIENT", msg.sender);
        uint256 initialMint = vm.envOr("MOCK_USDC_INITIAL_MINT", uint256(1_000 * 10 ** 6));

        vm.startBroadcast();
        MockUSDC usdc = new MockUSDC();
        if (initialMint > 0) {
            usdc.mint(initialRecipient, initialMint);
        }
        vm.stopBroadcast();

        console.log("MockUSDC deployed:", address(usdc));
        console.log("MockUSDC recipient:", initialRecipient);
        console.log("MockUSDC minted:", initialMint);
    }
}
