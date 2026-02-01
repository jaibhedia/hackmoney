"use client"

import { createThirdwebClient, defineChain } from "thirdweb"

/**
 * Thirdweb Client Configuration
 * Get your client ID from https://thirdweb.com/dashboard
 */
export const thirdwebClient = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "demo-client-id",
})

/**
 * Arc Testnet Chain Definition for Thirdweb
 * EVM-compatible Layer-1 by Circle, uses USDC for gas
 */
export const arcTestnetChain = defineChain({
    id: 5042002,
    name: "Arc Testnet",
    nativeCurrency: {
        decimals: 6,
        name: "USDC",
        symbol: "USDC",
    },
    rpc: "https://rpc.arc.network",
    blockExplorers: [
        {
            name: "Arc Explorer",
            url: "https://explorer.arc.network",
        },
    ],
    testnet: true,
})

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
