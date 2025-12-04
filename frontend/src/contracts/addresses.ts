/**
 * Contract Addresses
 * Foresight CT Fantasy League Contracts
 * Last updated: 2025-12-04
 */

export const CONTRACT_ADDRESSES = {
  // Base Sepolia Testnet
  baseSepolia: {
    ctDraft: '0x378105C2081Cc2235e6637DC9757a63F20263aa9' as `0x${string}`,
    foresightNFT: '0x8DCEb1aC97d3Ab305b6d7B2D44305d3F52c26bfa' as `0x${string}`,
    reputationEngine: '0x24C8171af3e2EbA7fCF53BDB5B958Ed2AB36fb0c' as `0x${string}`,
    treasury: '0x7A395d0B4E1542335DB3478171a08Cf34E97180f' as `0x${string}`,
    questRewards: '0xE3a2f682A5F22221F5f67c3cda917D7058aAbfe8' as `0x${string}`,
  },

  // Base Mainnet (for future deployment)
  base: {
    ctDraft: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    foresightNFT: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    reputationEngine: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    treasury: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    questRewards: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
} as const;

// Helper to get addresses for current network
export function getContractAddresses(chainId: number) {
  switch (chainId) {
    case 84532: // Base Sepolia
      return CONTRACT_ADDRESSES.baseSepolia;
    case 8453: // Base Mainnet
      return CONTRACT_ADDRESSES.base;
    default:
      return CONTRACT_ADDRESSES.baseSepolia; // Default to testnet
  }
}
