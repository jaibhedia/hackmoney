"use client"

import { useWalletContext } from "@/context/wallet-context"
import { useUwuName } from "@/hooks/useUwuName"
import { useENS } from "@/hooks/useENS"

/**
 * useWallet hook - Pure Thirdweb wallet integration
 * 
 * Address and balance come from Thirdweb/chain only.
 * Names (.uwu or .eth) are looked up separately from on-chain registries.
 */
export function useWallet() {
    const context = useWalletContext()
    
    // Look up real .uwu name from Sui (if registered)
    const { uwuName } = useUwuName(context.address || undefined)
    
    // Look up real ENS name from Ethereum (if user has one)
    const { ensName: ethName } = useENS(context.address || undefined)

    // Display name priority: ENS .eth > registered .uwu > short address
    const displayName = ethName 
        || (uwuName ? `${uwuName}` : null)
        || (context.address ? `${context.address.slice(0, 6)}...${context.address.slice(-4)}` : null)

    return {
        // State - ALL from Thirdweb
        address: context.address,
        isConnected: context.isConnected,
        balance: context.balance,
        balanceFormatted: context.balance.toFixed(2),
        isLoading: context.isLoading,
        isBalanceLoading: context.isBalanceLoading,
        isFirstTimeUser: context.isFirstTimeUser,

        // Names - from on-chain registries
        uwuName,
        ethName,
        displayName,

        // Actions
        connect: context.connect,
        disconnect: context.disconnect,
        refreshBalance: context.refreshBalance,
        markOnboardingComplete: context.markOnboardingComplete,

        // Computed
        shortAddress: context.address
            ? `${context.address.slice(0, 6)}...${context.address.slice(-4)}`
            : null,
    }
}
