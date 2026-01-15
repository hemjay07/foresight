// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CTDraftPrizedV2.sol";

/**
 * @title DeployCTDraftPrizedV2
 * @notice Deploy script for CTDraftPrizedV2 contract (multi-tier contests)
 *
 * Usage:
 * TREASURY_ADDRESS=0x... PRIVATE_KEY=0x... forge script script/DeployCTDraftPrizedV2.s.sol:DeployCTDraftPrizedV2 \
 *   --rpc-url https://sepolia.base.org \
 *   --broadcast
 */
contract DeployCTDraftPrizedV2 is Script {
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
        CTDraftPrizedV2 prized = new CTDraftPrizedV2(treasury);

        console.log("=========================================");
        console.log("CTDraftPrizedV2 deployed!");
        console.log("=========================================");
        console.log("Contract Address:", address(prized));
        console.log("Treasury Address:", treasury);
        console.log("Owner Address:", prized.owner());
        console.log("=========================================");
        console.log("Contest Type Configs:");
        console.log("-----------------------------------------");

        // Log all contest type configurations
        CTDraftPrizedV2.ContestConfig memory weeklyStarter = prized.getContestConfig(CTDraftPrizedV2.ContestType.WEEKLY_STARTER);
        console.log("WEEKLY_STARTER:");
        console.log("  Entry Fee: 0.002 ETH");
        console.log("  Team Size:", weeklyStarter.teamSize);
        console.log("  Rake:", weeklyStarter.rakePercent, "%");
        console.log("  Has Captain:", weeklyStarter.hasCaptain);

        CTDraftPrizedV2.ContestConfig memory weeklyStandard = prized.getContestConfig(CTDraftPrizedV2.ContestType.WEEKLY_STANDARD);
        console.log("WEEKLY_STANDARD:");
        console.log("  Entry Fee: 0.01 ETH");
        console.log("  Team Size:", weeklyStandard.teamSize);
        console.log("  Rake:", weeklyStandard.rakePercent, "%");

        CTDraftPrizedV2.ContestConfig memory weeklyPro = prized.getContestConfig(CTDraftPrizedV2.ContestType.WEEKLY_PRO);
        console.log("WEEKLY_PRO:");
        console.log("  Entry Fee: 0.05 ETH");
        console.log("  Team Size:", weeklyPro.teamSize);
        console.log("  Rake:", weeklyPro.rakePercent, "%");

        CTDraftPrizedV2.ContestConfig memory dailyFlash = prized.getContestConfig(CTDraftPrizedV2.ContestType.DAILY_FLASH);
        console.log("DAILY_FLASH:");
        console.log("  Entry Fee: 0.001 ETH");
        console.log("  Team Size:", dailyFlash.teamSize);
        console.log("  Rake:", dailyFlash.rakePercent, "%");
        console.log("  Has Captain:", dailyFlash.hasCaptain);

        console.log("=========================================");

        vm.stopBroadcast();
    }
}
