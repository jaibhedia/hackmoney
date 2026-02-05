"use client"

import { useState, useEffect, useCallback } from 'react'

/**
 * User Daily Limits based on Trust Level
 * 
 * - New users: $150/day
 * - Established (50+ trades): $300/day  
 * - High trust (100+ trades, 0 disputes): $750/day
 */

export interface UserLimits {
    dailyLimit: number           // In USDC (6 decimals)
    dailyUsed: number
    dailyRemaining: number
    trustLevel: TrustLevel
    canTrade: boolean
    nextResetAt: number          // Midnight UTC
}

export type TrustLevel = 'new' | 'established' | 'high_trust'

export const DAILY_LIMITS = {
    new: 150_000000,           // $150
    established: 300_000000,   // $300
    high_trust: 750_000000     // $750
}

export const TRUST_THRESHOLDS = {
    ESTABLISHED: 50,           // 50+ completed trades
    HIGH_TRUST: 100            // 100+ trades, 0 disputes lost
}

interface UserStats {
    completedOrders: number
    disputesLost: number
    dailyVolume: number
    dailyVolumeDate: number    // Day number
}

/**
 * Hook for managing user daily limits
 */
export function useUserDailyLimits(userAddress: string | null) {
    const [limits, setLimits] = useState<UserLimits | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchLimits = useCallback(async () => {
        if (!userAddress) {
            setLimits(null)
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`/api/users/${userAddress}/limits`)
            if (!response.ok) throw new Error('Failed to fetch limits')
            
            const data = await response.json()
            setLimits(data)
            setError(null)
        } catch (err) {
            console.error('Error fetching user limits:', err)
            setError(err as Error)
            
            // Fallback to default new user limits
            const today = Math.floor(Date.now() / (24 * 60 * 60 * 1000))
            const nextMidnight = (today + 1) * 24 * 60 * 60 * 1000
            
            setLimits({
                dailyLimit: DAILY_LIMITS.new,
                dailyUsed: 0,
                dailyRemaining: DAILY_LIMITS.new,
                trustLevel: 'new',
                canTrade: true,
                nextResetAt: nextMidnight
            })
        } finally {
            setIsLoading(false)
        }
    }, [userAddress])

    useEffect(() => {
        fetchLimits()
    }, [fetchLimits])

    /**
     * Check if user can make an order of given amount
     */
    const canMakeOrder = useCallback((amount: number): boolean => {
        if (!limits) return false
        return amount <= limits.dailyRemaining
    }, [limits])

    /**
     * Get trust level from user stats
     */
    const getTrustLevel = useCallback((stats: UserStats): TrustLevel => {
        if (stats.completedOrders >= TRUST_THRESHOLDS.HIGH_TRUST && stats.disputesLost === 0) {
            return 'high_trust'
        }
        if (stats.completedOrders >= TRUST_THRESHOLDS.ESTABLISHED) {
            return 'established'
        }
        return 'new'
    }, [])

    return {
        limits,
        isLoading,
        error,
        canMakeOrder,
        getTrustLevel,
        refresh: fetchLimits
    }
}

/**
 * Calculate daily limit from user stats
 */
export function calculateDailyLimit(stats: UserStats): number {
    if (stats.completedOrders >= TRUST_THRESHOLDS.HIGH_TRUST && stats.disputesLost === 0) {
        return DAILY_LIMITS.high_trust
    }
    if (stats.completedOrders >= TRUST_THRESHOLDS.ESTABLISHED) {
        return DAILY_LIMITS.established
    }
    return DAILY_LIMITS.new
}

/**
 * Format limit for display (USDC has 6 decimals)
 */
export function formatLimit(amount: number): string {
    return `$${(amount / 1_000000).toFixed(0)}`
}

/**
 * Get trust level label
 */
export function getTrustLevelLabel(level: TrustLevel): string {
    const labels: Record<TrustLevel, string> = {
        new: 'New User',
        established: 'Established',
        high_trust: 'High Trust'
    }
    return labels[level]
}

/**
 * Get trust level color
 */
export function getTrustLevelColor(level: TrustLevel): 'default' | 'success' | 'warning' {
    const colors: Record<TrustLevel, 'default' | 'success' | 'warning'> = {
        new: 'default',
        established: 'warning',
        high_trust: 'success'
    }
    return colors[level]
}

/**
 * Get progress to next trust level
 */
export function getProgressToNextLevel(stats: UserStats): {
    currentLevel: TrustLevel
    nextLevel: TrustLevel | null
    progress: number
    tradesNeeded: number
} {
    const level = stats.completedOrders >= TRUST_THRESHOLDS.HIGH_TRUST && stats.disputesLost === 0
        ? 'high_trust'
        : stats.completedOrders >= TRUST_THRESHOLDS.ESTABLISHED
            ? 'established'
            : 'new'
    
    if (level === 'high_trust') {
        return {
            currentLevel: 'high_trust',
            nextLevel: null,
            progress: 100,
            tradesNeeded: 0
        }
    }
    
    if (level === 'established') {
        // Progress to high trust (need 100 trades + 0 disputes)
        if (stats.disputesLost > 0) {
            return {
                currentLevel: 'established',
                nextLevel: null,  // Can't reach high trust with disputes
                progress: 0,
                tradesNeeded: 0
            }
        }
        const progress = ((stats.completedOrders - TRUST_THRESHOLDS.ESTABLISHED) / 
            (TRUST_THRESHOLDS.HIGH_TRUST - TRUST_THRESHOLDS.ESTABLISHED)) * 100
        return {
            currentLevel: 'established',
            nextLevel: 'high_trust',
            progress: Math.min(100, progress),
            tradesNeeded: Math.max(0, TRUST_THRESHOLDS.HIGH_TRUST - stats.completedOrders)
        }
    }
    
    // New user -> Established
    const progress = (stats.completedOrders / TRUST_THRESHOLDS.ESTABLISHED) * 100
    return {
        currentLevel: 'new',
        nextLevel: 'established',
        progress: Math.min(100, progress),
        tradesNeeded: Math.max(0, TRUST_THRESHOLDS.ESTABLISHED - stats.completedOrders)
    }
}
