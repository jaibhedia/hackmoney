"use client"

import { useWalletContext } from "@/context/wallet-context"

/**
 * useWallet hook - Wrapper around wallet context
 * Provides wallet connection, balance, ENS name, and transaction functions
 */
export function useWallet() {
    const context = useWalletContext()

    return {
        // State
        address: context.address,
        ensName: context.ensName,
        isConnected: context.isConnected,
        balance: context.balance,
        balanceFormatted: context.balance.toFixed(2),
        isLoading: context.isLoading,

        // Actions
        connect: context.connect,
        disconnect: context.disconnect,
        deposit: context.deposit,
        withdraw: context.withdraw,
        refreshBalance: context.refreshBalance,

        // Computed
        shortAddress: context.address
            ? `${context.address.slice(0, 6)}...${context.address.slice(-4)}`
            : null,
        displayName: context.ensName
            ? `${context.ensName}.uwu`
            : (context.address
                ? `${context.address.slice(0, 6)}...${context.address.slice(-4)}`
                : null),
    }
}
