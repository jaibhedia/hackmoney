"use client"

import { useState, useCallback } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { getContract, prepareContractCall, sendTransaction, waitForReceipt, readContract } from 'thirdweb'
import { thirdwebClient, arcTestnetChain } from '@/lib/thirdweb-config'
import { CONTRACT_ADDRESSES, USDC_ADDRESS } from '@/lib/web3-config'
import { USDC_ABI, parseUsdc, formatUsdc } from '@/lib/escrow-abi'

/**
 * P2PEscrowV2 Staking ABI (subset for staking functions)
 */
const STAKING_ABI = [
    {
        inputs: [{ name: "amount", type: "uint256" }],
        name: "depositStake",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ name: "amount", type: "uint256" }],
        name: "withdrawStake",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ name: "user", type: "address" }],
        name: "stakes",
        outputs: [
            { name: "baseStake", type: "uint256" },
            { name: "lockedStake", type: "uint256" },
            { name: "tradingLimit", type: "uint256" },
            { name: "lastTradeTime", type: "uint256" },
            { name: "completedTrades", type: "uint256" },
            { name: "disputesLost", type: "uint256" },
            { name: "isLP", type: "bool" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "baseStakeBps",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    }
] as const

/**
 * Tier configuration matching the architecture
 */
export type Tier = 'Starter' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond'

export interface TierConfig {
    name: Tier
    stakeRequired: number  // USDC
    orderLimit: number     // INR
    color: string
    features: string[]
}

export const TIER_CONFIG: TierConfig[] = [
    {
        name: 'Starter',
        stakeRequired: 0,
        orderLimit: 5000,
        color: 'gray',
        features: ['Basic trades only']
    },
    {
        name: 'Bronze',
        stakeRequired: 50,
        orderLimit: 25000,
        color: 'orange',
        features: ['Priority matching']
    },
    {
        name: 'Silver',
        stakeRequired: 200,
        orderLimit: 100000,
        color: 'slate',
        features: ['Priority matching', 'Lower fees']
    },
    {
        name: 'Gold',
        stakeRequired: 500,
        orderLimit: 500000,
        color: 'yellow',
        features: ['Priority matching', 'Lower fees', 'LP access']
    },
    {
        name: 'Diamond',
        stakeRequired: 2000,
        orderLimit: Infinity,
        color: 'blue',
        features: ['Priority matching', 'Lower fees', 'LP access', 'API access', 'Unlimited']
    }
]

export interface StakeProfile {
    baseStake: number
    lockedStake: number
    availableStake: number
    tradingLimit: number
    completedTrades: number
    disputesLost: number
    isLP: boolean
    tier: Tier
    nextTier: Tier | null
    progressToNextTier: number  // 0-100
}

/**
 * Hook for managing USDC stakes in the P2PEscrow contract
 */
export function useStaking() {
    const account = useActiveAccount()
    const [stakeProfile, setStakeProfile] = useState<StakeProfile | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Get contract instances
    const getEscrowContract = useCallback(() => {
        return getContract({
            client: thirdwebClient,
            chain: arcTestnetChain,
            address: CONTRACT_ADDRESSES.P2P_ESCROW,
            abi: STAKING_ABI,
        })
    }, [])

    const getUsdcContract = useCallback(() => {
        return getContract({
            client: thirdwebClient,
            chain: arcTestnetChain,
            address: USDC_ADDRESS,
            abi: USDC_ABI,
        })
    }, [])

    /**
     * Get tier from stake amount
     */
    const getTierFromStake = useCallback((stakeAmount: number): Tier => {
        for (let i = TIER_CONFIG.length - 1; i >= 0; i--) {
            if (stakeAmount >= TIER_CONFIG[i].stakeRequired) {
                return TIER_CONFIG[i].name
            }
        }
        return 'Starter'
    }, [])

    /**
     * Get next tier info
     */
    const getNextTier = useCallback((currentTier: Tier): Tier | null => {
        const currentIndex = TIER_CONFIG.findIndex(t => t.name === currentTier)
        if (currentIndex < TIER_CONFIG.length - 1) {
            return TIER_CONFIG[currentIndex + 1].name
        }
        return null
    }, [])

    /**
     * Calculate progress to next tier
     */
    const getProgressToNextTier = useCallback((stakeAmount: number, currentTier: Tier): number => {
        const currentConfig = TIER_CONFIG.find(t => t.name === currentTier)
        const nextTier = getNextTier(currentTier)
        
        if (!nextTier) return 100
        
        const nextConfig = TIER_CONFIG.find(t => t.name === nextTier)
        if (!currentConfig || !nextConfig) return 0

        const progress = ((stakeAmount - currentConfig.stakeRequired) / 
            (nextConfig.stakeRequired - currentConfig.stakeRequired)) * 100
        
        return Math.min(Math.max(progress, 0), 100)
    }, [getNextTier])

    /**
     * Fetch stake profile from contract
     */
    const fetchStakeProfile = useCallback(async () => {
        if (!account?.address) return

        setIsLoading(true)
        setError(null)

        try {
            const escrowContract = getEscrowContract()
            // console.log('[Staking] Fetching profile for:', account.address)
            // console.log('[Staking] Contract:', escrowContract.address)
            
            const result = await readContract({
                contract: escrowContract,
                method: "stakes",
                params: [account.address],
            }) as readonly [bigint, bigint, bigint, bigint, bigint, bigint, boolean]

            const baseStake = formatUsdc(result[0])
            const lockedStake = formatUsdc(result[1])
            const tier = getTierFromStake(baseStake)

            const profile: StakeProfile = {
                baseStake,
                lockedStake,
                availableStake: baseStake - lockedStake,
                tradingLimit: formatUsdc(result[2]),
                completedTrades: Number(result[4]),
                disputesLost: Number(result[5]),
                isLP: result[6],
                tier,
                nextTier: getNextTier(tier),
                progressToNextTier: getProgressToNextTier(baseStake, tier)
            }

            setStakeProfile(profile)
            return profile
        } catch (err) {
            // "execution reverted" is expected for new users without stake profiles
            // or when contract is not deployed - handle silently
            const errorMessage = err instanceof Error ? err.message : String(err)
            const isExpectedError = errorMessage.includes('execution reverted') || 
                                   errorMessage.includes('call revert exception') ||
                                   errorMessage.includes('could not decode result')
            
            if (!isExpectedError) {
                console.warn('[Staking] Unexpected error fetching profile:', errorMessage)
            }
            
            // Return default profile for new users
            const defaultProfile: StakeProfile = {
                baseStake: 0,
                lockedStake: 0,
                availableStake: 0,
                tradingLimit: 5000,
                completedTrades: 0,
                disputesLost: 0,
                isLP: false,
                tier: 'Starter',
                nextTier: 'Bronze',
                progressToNextTier: 0
            }
            setStakeProfile(defaultProfile)
            return defaultProfile
        } finally {
            setIsLoading(false)
        }
    }, [account?.address, getEscrowContract, getTierFromStake, getNextTier, getProgressToNextTier])

    /**
     * Approve USDC for staking
     */
    const approveStake = async (amount: number): Promise<string | null> => {
        if (!account) return null

        try {
            const usdcContract = getUsdcContract()
            const parsedAmount = parseUsdc(amount)

            const tx = prepareContractCall({
                contract: usdcContract,
                method: "approve",
                params: [CONTRACT_ADDRESSES.P2P_ESCROW, parsedAmount],
            })

            const result = await sendTransaction({
                transaction: tx,
                account,
            })

            const receipt = await waitForReceipt({
                client: thirdwebClient,
                chain: arcTestnetChain,
                transactionHash: result.transactionHash,
            })

            console.log('[Staking] Approval confirmed:', receipt.transactionHash)
            return receipt.transactionHash
        } catch (err) {
            console.error('[Staking] Approval failed:', err)
            setError(err as Error)
            return null
        }
    }

    /**
     * Deposit stake
     */
    const depositStake = async (amount: number): Promise<boolean> => {
        if (!account) return false

        setIsLoading(true)
        setError(null)

        try {
            // First approve
            const approvalTx = await approveStake(amount)
            if (!approvalTx) {
                throw new Error('Approval failed')
            }

            // Then deposit
            const escrowContract = getEscrowContract()
            const parsedAmount = parseUsdc(amount)

            const tx = prepareContractCall({
                contract: escrowContract,
                method: "depositStake",
                params: [parsedAmount],
            })

            const result = await sendTransaction({
                transaction: tx,
                account,
            })

            const receipt = await waitForReceipt({
                client: thirdwebClient,
                chain: arcTestnetChain,
                transactionHash: result.transactionHash,
            })

            console.log('[Staking] Deposit confirmed:', receipt.transactionHash)
            
            // Refresh profile
            await fetchStakeProfile()
            
            return true
        } catch (err) {
            console.error('[Staking] Deposit failed:', err)
            setError(err as Error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Withdraw stake
     */
    const withdrawStake = async (amount: number): Promise<boolean> => {
        if (!account) return false

        setIsLoading(true)
        setError(null)

        try {
            const escrowContract = getEscrowContract()
            const parsedAmount = parseUsdc(amount)

            const tx = prepareContractCall({
                contract: escrowContract,
                method: "withdrawStake",
                params: [parsedAmount],
            })

            const result = await sendTransaction({
                transaction: tx,
                account,
            })

            const receipt = await waitForReceipt({
                client: thirdwebClient,
                chain: arcTestnetChain,
                transactionHash: result.transactionHash,
            })

            console.log('[Staking] Withdrawal confirmed:', receipt.transactionHash)
            
            // Refresh profile
            await fetchStakeProfile()
            
            return true
        } catch (err) {
            console.error('[Staking] Withdrawal failed:', err)
            setError(err as Error)
            return false
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Get tier config by name
     */
    const getTierConfig = useCallback((tier: Tier): TierConfig => {
        return TIER_CONFIG.find(t => t.name === tier) || TIER_CONFIG[0]
    }, [])

    /**
     * Calculate required stake for order amount
     */
    const getRequiredStakeForOrder = useCallback((orderAmountUsdc: number, riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'): number => {
        const basePercentage = 5  // 5%
        const multipliers = { low: 1, medium: 1.5, high: 2, critical: 3 }
        return orderAmountUsdc * (basePercentage / 100) * multipliers[riskLevel]
    }, [])

    return {
        stakeProfile,
        isLoading,
        error,
        fetchStakeProfile,
        depositStake,
        withdrawStake,
        getTierFromStake,
        getTierConfig,
        getRequiredStakeForOrder,
        TIER_CONFIG
    }
}
