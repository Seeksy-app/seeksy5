/**
 * Centralized Blockchain Configuration
 * 
 * All blockchain-related constants and URLs in one place.
 * Ensures consistency across identity and clip certification flows.
 */

export const BLOCKCHAIN_CONFIG = {
  // Network: Polygon Amoy Testnet
  CHAIN_ID: 80002,
  CHAIN_NAME: 'Polygon Amoy',
  NETWORK_NAME: 'Polygon Amoy Testnet',
  
  // Explorer
  EXPLORER_BASE_URL: 'https://amoy.polygonscan.com',
  EXPLORER_TX_PATH: '/tx',
  EXPLORER_ADDRESS_PATH: '/address',
  
  // Contracts
  IDENTITY_CERTIFICATE_CONTRACT: '0xB5627bDbA3ab392782E7E542a972013E3e7F37C3',
  
  // RPC (environment variable)
  getRpcUrl: () => import.meta.env.VITE_POLYGON_RPC_URL,
} as const;

/**
 * Generate explorer URL for a transaction
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}${BLOCKCHAIN_CONFIG.EXPLORER_TX_PATH}/${txHash}`;
}

/**
 * Generate explorer URL for an address
 */
export function getExplorerAddressUrl(address: string): string {
  return `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}${BLOCKCHAIN_CONFIG.EXPLORER_ADDRESS_PATH}/${address}`;
}

/**
 * Truncate hash for display
 */
export function truncateHash(hash: string, prefixLength = 8, suffixLength = 6): string {
  if (!hash || hash.length < prefixLength + suffixLength) return hash;
  return `${hash.slice(0, prefixLength)}...${hash.slice(-suffixLength)}`;
}
