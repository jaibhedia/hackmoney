/**
 * Platform Configuration
 * Centralized configuration for uWu P2P platform
 */

export const PLATFORM_CONFIG = {
    // Payment verification thresholds
    verification: {
        autoReleaseThreshold: 85,      // Confidence % for auto-release
        manualReviewThreshold: 70,     // Below this → dispute
        timeoutMinutes: 15,            // Order timeout
        utrLength: 12,                 // UTR validation
    },

    // Fraud detection parameters
    fraud: {
        maxOrdersPerHour: 5,
        maxOrdersPerDay: 20,
        newWalletAgeHours: 168,        // 7 days
        suspiciousHoursStart: 2,       // 2 AM
        suspiciousHoursEnd: 5,         // 5 AM
        roundNumberThreshold: 100,     // Flag multiples of this
        amountEscalationThreshold: 2.0, // 2x increase = suspicious
    },

    // Risk score thresholds
    riskLevels: {
        low: 20,
        medium: 40,
        high: 60,
        // Above 60 = critical
    },

    // Stake requirements
    stakes: {
        basePercentage: 5,             // 5% of order amount
        minStakeUSDC: 10,
        maxStakeUSDC: 5000,
        riskMultipliers: {
            low: 1.0,
            medium: 1.5,
            high: 2.0,
            critical: 3.0,
        },
    },

    // Stake slashing penalties
    slashing: {
        orderTimeout: 20,              // % of stake
        fakePaymentProof: 100,         // % of stake
        disputeLost: 50,               // % of stake
        paymentReversal: 200,          // % of stake (can exceed 100%)
        lateRelease: 5,                // % of stake (>30 min)
    },

    // Dispute resolution timelines
    disputes: {
        autoResolutionMinutes: 5,
        communityArbitrationHours: 4,
        adminReviewHours: 24,
        arbitratorRewardBps: 50,       // 0.5% of order amount
        minArbitratorStake: 500,       // USDC
        minArbitratorTrades: 50,
        maxArbitratorDisputeRate: 0.02, // 2%
        votesRequired: 3,
    },

    // Payment methods with risk profiles (UPI only)
    paymentMethods: [
        {
            id: 'upi',
            name: 'UPI',
            riskScore: 20,
            reversible: false,
            settlementTime: 'instant',
            requiresExtraVerification: false,
        },
    ],

    // Order limits
    orders: {
        minAmountUSDC: 10,
        maxAmountUSDC: 10000,
        expiryMinutes: 15,
        merchantMinStake: 500,
        merchantFeePercentage: 2,
    },

    // Exchange rates (mock - should be fetched from API)
    exchangeRates: {
        INR: 90.42,
        USD: 1.0,
        BRL: 5.0,
        EUR: 0.92,
    },
} as const

/**
 * Get payment method config by ID
 */
export function getPaymentMethod(id: string) {
    return PLATFORM_CONFIG.paymentMethods.find(m => m.id === id)
}

/**
 * Get risk level from score
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    const { riskLevels } = PLATFORM_CONFIG
    if (score < riskLevels.low) return 'low'
    if (score < riskLevels.medium) return 'medium'
    if (score < riskLevels.high) return 'high'
    return 'critical'
}

/**
 * Get stake multiplier for risk level
 */
export function getStakeMultiplier(riskLevel: 'low' | 'medium' | 'high' | 'critical'): number {
    return PLATFORM_CONFIG.stakes.riskMultipliers[riskLevel]
}

/**
 * Calculate required stake for an order
 */
export function calculateRequiredStake(orderAmount: number, riskScore: number): number {
    const { stakes } = PLATFORM_CONFIG
    const riskLevel = getRiskLevel(riskScore)
    const multiplier = getStakeMultiplier(riskLevel)

    const baseStake = (orderAmount * stakes.basePercentage) / 100
    const requiredStake = baseStake * multiplier

    return Math.max(
        stakes.minStakeUSDC,
        Math.min(stakes.maxStakeUSDC, requiredStake)
    )
}

export type PaymentMethod = typeof PLATFORM_CONFIG.paymentMethods[number]
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
