"use client"

import { useState, useEffect, useCallback } from 'react'

/**
 * User Order Limits - Progressive system based on completed trades
 * 
 * Tier System:
 * - New (0 trades): $150 max order
 * - Regular (5+ trades): $250 max order
 * - Trusted (15+ trades): $350 max order
 * - Verified (50+ trades): $500 max order (cap)
 * 
 * This is SEPARATE from LP tiers where stake = max order
 */

export interface UserTier {
    name: 'New' | 'Regular' | 'Trusted' | 'Verified'
    minTrades: number
    maxOrder: number  // USDC
    color: string
}

export const USER_TIERS: UserTier[] = [
    { name: 'New', minTrades: 0, maxOrder: 150, color: 'gray' },
    { name: 'Regular', minTrades: 5, maxOrder: 250, color: 'blue' },
    { name: 'Trusted', minTrades: 15, maxOrder: 350, color: 'green' },
    { name: 'Verified', minTrades: 50, maxOrder: 500, color: 'purple' },
]

export const USER_MAX_ORDER_CAP = 500  // Maximum ever for users

export interface UserLimitData {
    tier: UserTier
    maxOrder: number       // USDC
    completedTrades: number
    disputesLost: number
    nextTier: UserTier | null
    progressToNextTier: number  // 0-100%
    tradesUntilNextTier: number
}

/**
 * Get user tier based on completed trades
 */
export function getUserTier(completedTrades: number): UserTier {
    for (let i = USER_TIERS.length - 1; i >= 0; i--) {
        if (completedTrades >= USER_TIERS[i].minTrades) {
            return USER_TIERS[i]
        }
    }
    return USER_TIERS[0]
}

/**
 * Get next tier for user
 */
export function getNextUserTier(currentTier: UserTier): UserTier | null {
    const currentIndex = USER_TIERS.findIndex(t => t.name === currentTier.name)
    if (currentIndex >= USER_TIERS.length - 1) return null
    return USER_TIERS[currentIndex + 1]
}

/**
 * Calculate progress to next tier
 */
export function getProgressToNextTier(completedTrades: number, currentTier: UserTier): number {
    const nextTier = getNextUserTier(currentTier)
    if (!nextTier) return 100
    
    const tradesInCurrentTier = completedTrades - currentTier.minTrades
    const tradesNeededForNext = nextTier.minTrades - currentTier.minTrades
    
    return Math.min(100, Math.round((tradesInCurrentTier / tradesNeededForNext) * 100))
}

/**
 * Calculate user's max order limit based on their trade history
 */
export function calculateUserMaxOrder(stats: {
    completedTrades: number
    disputesLost: number
    recentTrades?: number
}): number {
    const { completedTrades, disputesLost, recentTrades = 0 } = stats
    
    const tier = getUserTier(completedTrades)
    let maxOrder = tier.maxOrder
    
    // Penalty for disputes: -$50 per dispute lost (min $50 order limit)
    if (disputesLost > 0) {
        const penalty = disputesLost * 50
        maxOrder = Math.max(50, maxOrder - penalty)
    }
    
    // Bonus for recent activity: +$25 per 10 trades in last 30 days (max +$100)
    if (recentTrades > 0) {
        const bonus = Math.min(100, Math.floor(recentTrades / 10) * 25)
        maxOrder = Math.min(USER_MAX_ORDER_CAP, maxOrder + bonus)
    }
    
    return Math.min(USER_MAX_ORDER_CAP, maxOrder)
}

/**
 * Hook for user order limits
 */
export function useUserLimits(userAddress: string | null) {
    const [limitData, setLimitData] = useState<UserLimitData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchLimits = useCallback(async () => {
        if (!userAddress) {
            setLimitData(null)
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`/api/users/${userAddress}/limits`)
            if (!response.ok) throw new Error('Failed to fetch limits')
            
            const data = await response.json()
            
            const tier = getUserTier(data.completedTrades || 0)
            const nextTier = getNextUserTier(tier)
            
            setLimitData({
                tier,
                maxOrder: calculateUserMaxOrder({
                    completedTrades: data.completedTrades || 0,
                    disputesLost: data.disputesLost || 0,
                    recentTrades: data.recentTrades || 0,
                }),
                completedTrades: data.completedTrades || 0,
                disputesLost: data.disputesLost || 0,
                nextTier,
                progressToNextTier: getProgressToNextTier(data.completedTrades || 0, tier),
                tradesUntilNextTier: nextTier ? nextTier.minTrades - (data.completedTrades || 0) : 0,
            })
            setError(null)
        } catch (err) {
            console.error('Error fetching user limits:', err)
            setError(err as Error)
            
            const defaultTier = USER_TIERS[0]
            setLimitData({
                tier: defaultTier,
                maxOrder: defaultTier.maxOrder,
                completedTrades: 0,
                disputesLost: 0,
                nextTier: USER_TIERS[1],
                progressToNextTier: 0,
                tradesUntilNextTier: USER_TIERS[1].minTrades,
            })
        } finally {
            setIsLoading(false)
        }
    }, [userAddress])

    useEffect(() => {
        fetchLimits()
    }, [fetchLimits])

    const canMakeOrder = useCallback((amountUsdc: number): boolean => {
        if (!limitData) return false
        return amountUsdc <= limitData.maxOrder
    }, [limitData])

    return {
        limitData,
        isLoading,
        error,
        canMakeOrder,
        refresh: fetchLimits,
        getUserTier,
        calculateUserMaxOrder,
    }
}

export function getTierColorClass(tier: UserTier): string {
    const colors: Record<string, string> = {
        gray: 'text-gray-400',
        blue: 'text-blue-400',
        green: 'text-green-400',
        purple: 'text-purple-400',
    }
    return colors[tier.color] || 'text-gray-400'
}

export function formatMaxOrder(amount: number): string {
    return `$${amount}`
}
