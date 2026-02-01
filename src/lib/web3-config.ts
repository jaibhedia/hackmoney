import { defineChain } from 'viem'

/**
 * Arc Testnet Configuration
 * EVM-compatible Layer-1 by Circle, uses USDC for gas
 */
export const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    network: 'arc-testnet',
    nativeCurrency: {
        decimals: 6,
        name: 'USDC',
        symbol: 'USDC',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.arc.network'],
        },
        public: {
            http: ['https://rpc.arc.network'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Arc Explorer',
            url: 'https://explorer.arc.network',
        },
    },
    testnet: true,
})

/**
 * Sui Configuration for Logs/Storage
 */
export const suiConfig = {
    network: 'testnet' as const,
    fullnode: 'https://fullnode.testnet.sui.io:443',
}



/**
 * Smart Contract Addresses on Arc Testnet
 * TODO: Update these after deployment
 */
export const CONTRACT_ADDRESSES = {
    P2P_ESCROW: '0x0000000000000000000000000000000000000000',
    TRUST_SCORE: '0x0000000000000000000000000000000000000000',
    LIQUIDITY_POOL: '0x0000000000000000000000000000000000000000',
} as const

/**
 * USDC Token Address on Arc Testnet
 */
export const USDC_ADDRESS = '0x0000000000000000000000000000000000000000' // TODO: Update

/**
 * Supported Fiat Currencies
 */
export const SUPPORTED_CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
] as const

/**
 * Platform Configuration
 */
export const PLATFORM_CONFIG = {
    MERCHANT_MIN_STAKE: 500, // Minimum USDC to stake as merchant
    MERCHANT_FEE_PERCENTAGE: 2, // 2% fee for merchants
    ORDER_TIMEOUT_MINUTES: 15, // Order expires after 15 minutes
    MIN_TRANSACTION_AMOUNT: 10, // Minimum transaction amount in USDC
    MAX_TRANSACTION_AMOUNT: 10000, // Maximum transaction amount in USDC
} as const

/**
 * ENS Configuration
 * Using Ethereum Sepolia testnet for ENS names
 */
export const ENS_CONFIG = {
    chainId: 11155111, // Sepolia testnet
    rpcUrl: 'https://rpc.sepolia.org',
} as const
