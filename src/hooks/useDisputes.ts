"use client"

import { useState, useCallback, useEffect } from 'react'

/**
 * Dispute management hook
 * For both parties and arbitrators
 */

export interface Dispute {
    id: string
    orderId: string
    buyer: string
    seller: string
    amount: number
    tier: 'auto' | 'community' | 'admin'
    status: 'open' | 'voting' | 'resolved' | 'escalated'
    reason: string
    buyerEvidence?: string
    sellerEvidence?: string
    arbitrators: string[]
    votes: Record<string, { favorBuyer: boolean; reasoning: string; votedAt: number }>
    votesForBuyer: number
    votesForSeller: number
    finalDecision?: 'buyer' | 'seller'
    createdAt: number
    votingDeadline?: number
    resolvedAt?: number
}

export function useDisputes(userAddress: string | undefined, role: 'party' | 'arbitrator' = 'party') {
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    /**
     * Fetch disputes for user
     */
    const fetchDisputes = useCallback(async (status?: string) => {
        if (!userAddress) return

        setIsLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                address: userAddress,
                role,
            })
            if (status) params.set('status', status)

            const response = await fetch(`/api/disputes?${params}`)
            const data = await response.json()

            if (data.success) {
                setDisputes(data.disputes)
            } else {
                throw new Error(data.error || 'Failed to fetch disputes')
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setIsLoading(false)
        }
    }, [userAddress, role])

    /**
     * Create a new dispute
     */
    const createDispute = useCallback(async (params: {
        orderId: string
        buyer: string
        seller: string
        amount: number
        reason: string
        tier?: 'auto' | 'community' | 'admin'
    }): Promise<Dispute | null> => {
        setIsLoading(true)

        try {
            const response = await fetch('/api/disputes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            })

            const data = await response.json()

            if (data.success) {
                setDisputes(prev => [data.dispute, ...prev])
                return data.dispute
            } else {
                throw new Error(data.error || 'Failed to create dispute')
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'))
            return null
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
     * Submit evidence for a dispute
     */
    const submitEvidence = useCallback(async (
        disputeId: string,
        party: 'buyer' | 'seller',
        evidenceHash: string
    ): Promise<boolean> => {
        try {
            const response = await fetch('/api/disputes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    disputeId,
                    action: 'submit_evidence',
                    party,
                    evidenceHash,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setDisputes(prev =>
                    prev.map(d => d.id === disputeId ? data.dispute : d)
                )
                return true
            }
            return false
        } catch {
            return false
        }
    }, [])

    /**
     * Cast vote on a dispute (arbitrators only)
     */
    const voteOnDispute = useCallback(async (
        disputeId: string,
        favorBuyer: boolean,
        reasoning: string
    ): Promise<boolean> => {
        if (!userAddress) return false

        try {
            const response = await fetch('/api/disputes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    disputeId,
                    action: 'vote',
                    arbitratorAddress: userAddress,
                    favorBuyer,
                    reasoning,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setDisputes(prev =>
                    prev.map(d => d.id === disputeId ? data.dispute : d)
                )
                return true
            } else {
                throw new Error(data.error)
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Vote failed'))
            return false
        }
    }, [userAddress])

    /**
     * Get time remaining for voting
     */
    const getVotingTimeRemaining = useCallback((dispute: Dispute): number => {
        if (!dispute.votingDeadline) return 0
        const remaining = dispute.votingDeadline - Date.now()
        return Math.max(0, remaining)
    }, [])

    /**
     * Check if user has voted
     */
    const hasVoted = useCallback((dispute: Dispute): boolean => {
        if (!userAddress) return false
        return !!dispute.votes[userAddress]
    }, [userAddress])

    /**
     * Check if user is arbitrator for dispute
     */
    const isArbitrator = useCallback((dispute: Dispute): boolean => {
        if (!userAddress) return false
        return dispute.arbitrators.some(
            a => a.toLowerCase() === userAddress.toLowerCase()
        )
    }, [userAddress])

    // Auto-refresh disputes every 30 seconds if any are in voting
    useEffect(() => {
        const hasVotingDisputes = disputes.some(d => d.status === 'voting')

        if (!hasVotingDisputes) return

        const interval = setInterval(() => {
            fetchDisputes()
        }, 30000)

        return () => clearInterval(interval)
    }, [disputes, fetchDisputes])

    return {
        // Data
        disputes,
        openDisputes: disputes.filter(d => d.status === 'open' || d.status === 'voting'),
        resolvedDisputes: disputes.filter(d => d.status === 'resolved'),

        // Actions
        fetchDisputes,
        createDispute,
        submitEvidence,
        voteOnDispute,

        // Helpers
        getVotingTimeRemaining,
        hasVoted,
        isArbitrator,

        // State
        isLoading,
        error,
    }
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(ms: number): string {
    if (ms <= 0) return 'Expired'

    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}
