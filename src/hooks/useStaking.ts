"use client"

import { useState, useCallback } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { getContract, prepareContractCall, sendTransaction, waitForReceipt, readContract } from 'thirdweb'
import { thirdwebClient, arcTestnetChain } from '@/lib/thirdweb-config'
import { CONTRACT_ADDRESSES, USDC_ADDRESS } from '@/lib/web3-config'
import { USDC_ABI, parseUsdc, formatUsdc } from '@/lib/escrow-abi'

/**
 * P2PEscrowV3 Staking ABI (subset for staking functions)
 * V3 uses stake/unstake instead of depositStake/withdrawStake
 */
const STAKING_ABI = [
    {
        inputs: [{ name: "amount", type: "uint256" }],
        name: "stake",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ name: "amount", type: "uint256" }],
        name: "unstake",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ name: "", type: "address" }],
        name: "lpStakes",
        outputs: [
            { name: "amount", type: "uint256" },
            { name: "lockedInOrders", type: "uint256" },
            { name: "totalTrades", type: "uint256" },
            { name: "totalDisputes", type: "uint256" },
            { name: "disputesLost", type: "uint256" },
            { name: "memberSince", type: "uint256" },
            { name: "avgCompletionTime", type: "uint256" },
            { name: "cooldownUntil", type: "uint256" },
            { name: "isActive", type: "bool" },
            { name: "isBanned", type: "bool" }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "usdc",
        outputs: [{ name: "", type: "address" }],
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
            
            // V3 uses lpStakes mapping with 10 fields
            const result = await readContract({
                contract: escrowContract,
                method: "lpStakes",
                params: [account.address],
            }) as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean]

            // LPStake struct: amount, lockedInOrders, totalTrades, totalDisputes, disputesLost, memberSince, avgCompletionTime, cooldownUntil, isActive, isBanned
            const baseStake = formatUsdc(result[0])
            const lockedStake = formatUsdc(result[1])
            const tier = getTierFromStake(baseStake)
            
            // LP status derived from having any stake (contract tracks isActive separately)
            const isActive = result[8]
            const derivedIsLP = baseStake >= 50 || isActive

            const profile: StakeProfile = {
                baseStake,
                lockedStake,
                availableStake: baseStake - lockedStake,
                tradingLimit: baseStake, // In V3, stake = max order
                completedTrades: Number(result[2]),
                disputesLost: Number(result[4]),
                isLP: derivedIsLP,
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
     * Deposit stake with pre-flight checks
     */
    const depositStake = async (amount: number): Promise<boolean> => {
        if (!account) return false

        setIsLoading(true)
        setError(null)

        try {
            const escrowContract = getEscrowContract()
            const usdcContract = getUsdcContract()
            const parsedAmount = parseUsdc(amount)

            // === PRE-FLIGHT DIAGNOSTICS ===
            console.log('[Staking] === Pre-flight checks ===')
            console.log('[Staking] User:', account.address)
            console.log('[Staking] Escrow contract:', CONTRACT_ADDRESSES.P2P_ESCROW)
            console.log('[Staking] Amount:', amount, 'USDC (raw:', parsedAmount.toString(), ')')

            // 1. Check contract's USDC address matches
            try {
                const contractUsdc = await readContract({
                    contract: escrowContract,
                    method: "usdc",
                    params: [],
                })
                console.log('[Staking] Contract USDC address:', contractUsdc)
                console.log('[Staking] Expected USDC address:', USDC_ADDRESS)
                if (String(contractUsdc).toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
                    throw new Error(`Contract USDC mismatch! Contract uses ${contractUsdc}, app uses ${USDC_ADDRESS}`)
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                if (msg.includes('mismatch')) throw e
                console.warn('[Staking] Could not verify USDC address:', msg)
            }

            // 3. Check user balance
            try {
                const balance = await readContract({
                    contract: usdcContract,
                    method: "balanceOf",
                    params: [account.address],
                }) as bigint
                console.log('[Staking] User balance:', formatUsdc(balance), 'USDC')
                if (balance < parsedAmount) {
                    throw new Error(`Insufficient balance. Have ${formatUsdc(balance)} USDC, need ${amount} USDC`)
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                if (msg.includes('Insufficient')) throw e
                console.warn('[Staking] Could not check balance:', msg)
            }

            // 4. Approve USDC
            console.log('[Staking] Approving', amount, 'USDC...')
            const approveTx = prepareContractCall({
                contract: usdcContract,
                method: "approve",
                params: [CONTRACT_ADDRESSES.P2P_ESCROW, parsedAmount],
            })

            const approveResult = await sendTransaction({
                transaction: approveTx,
                account,
            })

            await waitForReceipt({
                client: thirdwebClient,
                chain: arcTestnetChain,
                transactionHash: approveResult.transactionHash,
            })
            console.log('[Staking] Approval confirmed:', approveResult.transactionHash)

            // 5. Verify allowance was actually set (critical for precompile chains)
            try {
                const allowance = await readContract({
                    contract: usdcContract,
                    method: "allowance",
                    params: [account.address, CONTRACT_ADDRESSES.P2P_ESCROW],
                }) as bigint
                console.log('[Staking] Verified allowance:', formatUsdc(allowance), 'USDC')
                if (allowance < parsedAmount) {
                    console.error('[Staking] CRITICAL: Allowance not set despite confirmed approval!')
                    console.error('[Staking] This means the USDC precompile may not support standard ERC20 approve/transferFrom')
                    throw new Error(`Allowance verification failed. Approved ${amount} but allowance is ${formatUsdc(allowance)}. Arc USDC precompile issue.`)
                }
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                if (msg.includes('Allowance verification') || msg.includes('precompile')) throw e
                console.warn('[Staking] Could not verify allowance:', msg)
            }

            // 6. Small delay to ensure state propagation on Arc
            await new Promise(resolve => setTimeout(resolve, 2000))

            // 7. Call stake function (V3 uses stake instead of depositStake)
            console.log('[Staking] Calling stake...')
            const tx = prepareContractCall({
                contract: escrowContract,
                method: "stake",
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
                method: "unstake",
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
