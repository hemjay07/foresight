import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

/**
 * Wagmi Configuration for Foresight
 *
 * Note: Get your Project ID from https://cloud.reown.com
 * (Reown is the new name for WalletConnect Cloud)
 */
export const config = getDefaultConfig({
  appName: 'Foresight',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'b0b5e1d0f7a1c8e3d9f2a4b6c8e0d2f4',
  chains: [baseSepolia],
  ssr: false,
});

/**
 * Contract Addresses - Update after deployment
 */

// Core Infrastructure
export const TREASURY_ADDRESS = (import.meta.env.VITE_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const REPUTATION_ENGINE_ADDRESS = (import.meta.env.VITE_REPUTATION_ENGINE_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const FORESIGHT_NFT_ADDRESS = (import.meta.env.VITE_FORESIGHT_NFT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Game Contracts
export const CT_DRAFT_ADDRESS = (import.meta.env.VITE_CT_DRAFT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const TIMECASTER_ARENA_ADDRESS = (import.meta.env.VITE_TIMECASTER_ARENA_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
export const DAILY_GAUNTLET_ADDRESS = (import.meta.env.VITE_DAILY_GAUNTLET_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
