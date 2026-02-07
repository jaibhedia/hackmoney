import { defineChain } from 'viem'

/**
 * Arc Mainnet Configuration
 * EVM-compatible Layer-1 by Circle, uses USDC for gas
 * 
 * NOTE: No KYC required - permissionless, decentralized platform
 */
export const arcMainnet = defineChain({
    id: 5042002, // Update to mainnet chain ID when available
    name: 'Arc',
    network: 'arc',
    nativeCurrency: {
        decimals: 6,
        name: 'USDC',
        symbol: 'USDC',
    },
    rpcUrls: {
        default: {
            http: ['https://5042002.rpc.thirdweb.com'],
        },
        public: {
            http: ['https://5042002.rpc.thirdweb.com'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Arc Explorer',
            url: 'https://explorer.arc.network',
        },
    },
    testnet: false,
})

// Export with consistent naming
export const arcTestnet = arcMainnet // Alias for backwards compatibility

/**
 * Sui Configuration for Order Logs
 * 
 * Currently on TESTNET - deploy to mainnet for production:
 * cd contracts/sui && sui client publish --gas-budget 100000000
 * 
 * Then update NEXT_PUBLIC_SUI_PACKAGE_ID in .env.local
 */
export const suiConfig = {
    network: 'testnet' as const,
    fullnode: 'https://fullnode.testnet.sui.io:443',
}



/**
 * Smart Contract Addresses on Arc
 * Deployed and verified - ready for production
 */
export const CONTRACT_ADDRESSES = {
    P2P_ESCROW: process.env.NEXT_PUBLIC_P2P_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000',
    DISPUTE_DAO: process.env.NEXT_PUBLIC_DISPUTE_DAO_ADDRESS || '0x0000000000000000000000000000000000000000',
    TRUST_SCORE: process.env.NEXT_PUBLIC_TRUST_SCORE_ADDRESS || '0x0000000000000000000000000000000000000000',
    LIQUIDITY_POOL: '0x0000000000000000000000000000000000000000',
} as const

/**
 * USDC Token Address on Arc
 * 
 * Arc uses USDC as native gas (0x3600...0000 precompile)
 * For ERC20 operations (approvals, transfers), use this address
 */
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x0000000000000000000000000000000000000000'

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
    MIN_TRANSACTION_AMOUNT: 0, // No minimum - fee applies below $10 USDC
    SMALL_ORDER_FEE: 0.125, // $0.125 fee for orders < $10 USDC
    SMALL_ORDER_THRESHOLD: 10, // Orders below this get small order fee
    MAX_TRANSACTION_AMOUNT: 10000, // Maximum transaction amount in USDC
} as const

/**
 * ENS Configuration (Optional - for .eth name resolution)
 * Using Ethereum Mainnet for production ENS lookups
 */
export const ENS_CONFIG = {
    chainId: 1, // Ethereum Mainnet
    rpcUrl: 'https://eth.llamarpc.com',
} as const
