import { Platform } from 'react-native';

// Backend API URL
// - Android emulator: 10.0.2.2 maps to host machine localhost
// - iOS simulator: localhost works directly
// - Physical device: use your LAN IP or production URL
function getDevApiUrl(): string {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }
  // iOS simulator or web
  return 'http://localhost:3001';
}

export const API_URL = __DEV__
  ? getDevApiUrl()
  : 'https://api.ct-foresight.xyz';

export const SOLANA_RPC_URL = __DEV__
  ? 'https://api.devnet.solana.com'
  : 'https://api.mainnet-beta.solana.com';
