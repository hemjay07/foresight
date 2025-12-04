/**
 * Contract ABIs for CT league
 * Simplified ABIs containing only the functions needed by the frontend
 */

// ============================================
// REPUTATION ENGINE
// ============================================

export const REPUTATION_ENGINE_ABI = [
  {
    type: 'function',
    name: 'getReputation',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'draftRank', type: 'uint256' },
          { name: 'ctIQ', type: 'uint256' },
          { name: 'voteScore', type: 'uint256' },
          { name: 'ctMasteryScore', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getDraftScore',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// ============================================
// FORESIGHT NFT
// ============================================

export const FORESIGHT_NFT_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerToTokenId',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// ============================================
// TREASURY
// ============================================

export const TREASURY_ABI = [
  {
    type: 'function',
    name: 'getCurrentMonth',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getMonthlyRevenue',
    inputs: [{ name: 'month', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// ============================================
// CT DRAFT
// ============================================

export const CT_DRAFT_ABI = [
  {
    type: 'function',
    name: 'setTeam',
    inputs: [
      {
        name: 'influencerIds',
        type: 'uint256[5]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getTeam',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'user', type: 'address' },
          { name: 'influencerIds', type: 'uint256[5]' },
          { name: 'lastUpdated', type: 'uint256' },
          { name: 'exists', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'TeamUpdated',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'influencerIds', type: 'uint256[5]' },
    ],
  },
] as const;
