// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CTDraftPrized.sol";

/**
 * @title DeployCTDraftPrized
 * @notice Deploy script for CTDraftPrized contract
 *
 * Usage:
 * forge script script/DeployCTDraftPrized.s.sol:DeployCTDraftPrized \
 *   --rpc-url $BASE_SEPOLIA_RPC_URL \
 *   --private-key $PRIVATE_KEY \
 *   --broadcast \
 *   --verify
 */
contract DeployCTDraftPrized is Script {
    function run() external {
        // Get treasury address from environment or use deployer
        address treasury = vm.envOr("TREASURY_ADDRESS", address(0));

        vm.startBroadcast();

        // If no treasury set, use the deployer for now
        if (treasury == address(0)) {
            treasury = msg.sender;
            console.log("Warning: Using deployer as treasury");
        }

        // Deploy the contract
        CTDraftPrized prized = new CTDraftPrized(treasury);

        console.log("=========================================");
        console.log("CTDraftPrized deployed!");
        console.log("=========================================");
        console.log("Contract Address:", address(prized));
        console.log("Treasury Address:", treasury);
        console.log("Owner Address:", prized.owner());
        console.log("Platform Fee:", prized.PLATFORM_FEE_BPS(), "bps (15%)");
        console.log("=========================================");

        vm.stopBroadcast();
    }
}
