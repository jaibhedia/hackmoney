"use client"

import { createThirdwebClient, defineChain } from "thirdweb"

/**
 * Thirdweb Client Configuration
 * 
 * Production-ready wallet integration.
 * No KYC required - permissionless access.
 * 
 * Get your client ID from https://thirdweb.com/dashboard
 */
export const thirdwebClient = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
})

/**
 * Arc Chain Definition for Thirdweb
 * EVM-compatible Layer-1 by Circle, uses USDC for gas
 */
export const arcChain = defineChain({
    id: 5042002,
    name: 'Arc',
    nativeCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
    },
    rpc: 'https://5042002.rpc.thirdweb.com',
    testnet: true,
})

// Alias for backwards compatibility
export const arcTestnetChain = arcChain

/**
 * Spending Cap Configuration
 * Pre-approved spending limit for seamless transactions
 */
export const SPENDING_CAP = {
    DEFAULT_AMOUNT: 150, // $150 USD equivalent in USDC
    MAX_AMOUNT: 1000,    // Maximum spending cap allowed
    CURRENCY: "USDC",
} as const

/**
 * Wallet Configuration
 */
export const WALLET_CONFIG = {
    // Supported authentication methods for embedded wallet
    AUTH_OPTIONS: ["email", "google", "apple", "phone"] as const,

    // Default chain for new wallets
    DEFAULT_CHAIN: arcTestnetChain,

    // Session timeout (30 days in ms)
    SESSION_DURATION: 30 * 24 * 60 * 60 * 1000,
} as const
