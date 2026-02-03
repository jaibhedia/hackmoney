"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useActiveAccount, useConnect, useDisconnect, useWalletBalance } from "thirdweb/react"
import { inAppWallet } from "thirdweb/wallets"
import { thirdwebClient, arcChain } from "@/lib/thirdweb-config"

/**
 * Wallet Context - PURE Thirdweb Integration
 * 
 * NO fake data. NO random addresses. NO mock balances.
 * Everything comes from Thirdweb embedded wallet.
 * 
 * Flow:
 * 1. User signs up via Google/Apple/Email through Thirdweb
 * 2. Thirdweb creates an embedded wallet for them
 * 3. We use THAT wallet address (from useActiveAccount)
 * 4. Balance is fetched from Arc chain
 * 5. User can later register .uwu name or link existing ENS
 */

interface WalletState {
    address: string | null           // From Thirdweb ONLY
    isConnected: boolean
    balance: number                  // From Arc chain ONLY
    isLoading: boolean
    isBalanceLoading: boolean
    isFirstTimeUser: boolean         // True if this is user's first login
}

interface WalletContextType extends WalletState {
    connect: (method: "google" | "apple" | "email", email?: string) => Promise<boolean>
    disconnect: () => void
    refreshBalance: () => Promise<void>
    markOnboardingComplete: () => void
}

const WalletContext = createContext<WalletContextType | null>(null)

// Helper to check if user has completed onboarding
const ONBOARDING_KEY_PREFIX = 'uwu_onboarded_'
const hasCompletedOnboarding = (address: string): boolean => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(`${ONBOARDING_KEY_PREFIX}${address.toLowerCase()}`) === 'true'
}

const setOnboardingComplete = (address: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(`${ONBOARDING_KEY_PREFIX}${address.toLowerCase()}`, 'true')
}

export function WalletProvider({ children }: { children: ReactNode }) {
    // Thirdweb hooks - these are the ONLY source of truth
    const account = useActiveAccount()
    const { connect: thirdwebConnect } = useConnect()
    const { disconnect: thirdwebDisconnect } = useDisconnect()
    
    // Real on-chain balance from Arc chain
    const walletBalance = useWalletBalance({
        client: thirdwebClient,
        chain: arcChain,
        address: account?.address,
    })

    const [state, setState] = useState<WalletState>({
        address: null,
        isConnected: false,
        balance: 0,
        isLoading: true,
        isBalanceLoading: false,
        isFirstTimeUser: false,
    })

    // Clean up ALL old localStorage garbage
    useEffect(() => {
        localStorage.removeItem('uwu_wallet')
        localStorage.removeItem('uwu_balance')
        localStorage.removeItem('uwu_ens_name')
    }, [])

    // Sync with Thirdweb account - this is the ONLY place we set address
    useEffect(() => {
        if (account?.address) {
            console.log('[Wallet] Connected via Thirdweb:', account.address)
            const isFirstTime = !hasCompletedOnboarding(account.address)
            console.log('[Wallet] First time user:', isFirstTime)
            setState(prev => ({
                ...prev,
                address: account.address,
                isConnected: true,
                isLoading: false,
                isFirstTimeUser: isFirstTime,
            }))
        } else {
            console.log('[Wallet] Not connected')
            setState({
                address: null,
                isConnected: false,
                balance: 0,
                isLoading: false,
                isBalanceLoading: false,
                isFirstTimeUser: false,
            })
        }
    }, [account?.address])

    // Update balance from chain - REAL balance only
    useEffect(() => {
        if (walletBalance.data) {
            const bal = Number(walletBalance.data.displayValue)
            console.log('[Wallet] Balance from chain:', bal, walletBalance.data.symbol)
            setState(prev => ({
                ...prev,
                balance: bal,
                isBalanceLoading: false,
            }))
        }
        
        setState(prev => ({ ...prev, isBalanceLoading: walletBalance.isLoading }))
    }, [walletBalance.data, walletBalance.isLoading])

    // Connect via Thirdweb embedded wallet
    const connect = useCallback(async (method: "google" | "apple" | "email", email?: string): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true }))

        try {
            const wallet = inAppWallet()

            if (method === "google") {
                await thirdwebConnect(async () => {
                    await wallet.connect({
                        client: thirdwebClient,
                        chain: arcChain,
                        strategy: "google",
                    })
                    return wallet
                })
            } else if (method === "apple") {
                await thirdwebConnect(async () => {
                    await wallet.connect({
                        client: thirdwebClient,
                        chain: arcChain,
                        strategy: "apple",
                    })
                    return wallet
                })
            } else if (method === "email" && email) {
                // Email requires OTP verification - not supported in single-step connect
                // Use Thirdweb's prebuilt UI for email auth or implement OTP flow
                console.log("[Wallet] Email auth requires OTP flow - use Google or Apple for now")
                throw new Error("Email auth requires OTP verification")
            }

            // Address will be set by the useEffect watching account.address
            return true
        } catch (error) {
            console.error("[Wallet] Connection failed:", error)
            setState(prev => ({ ...prev, isLoading: false }))
            return false
        }
    }, [thirdwebConnect])

    // Disconnect
    const disconnect = useCallback(() => {
        thirdwebDisconnect(inAppWallet())
        setState({
            address: null,
            isConnected: false,
            balance: 0,
            isLoading: false,
            isBalanceLoading: false,
            isFirstTimeUser: false,
        })
    }, [thirdwebDisconnect])

    // Refresh balance from chain
    const refreshBalance = useCallback(async () => {
        setState(prev => ({ ...prev, isBalanceLoading: true }))
        await walletBalance.refetch()
    }, [walletBalance])

    // Mark onboarding as complete for this wallet
    const markOnboardingComplete = useCallback(() => {
        if (state.address) {
            setOnboardingComplete(state.address)
            setState(prev => ({ ...prev, isFirstTimeUser: false }))
            console.log('[Wallet] Onboarding marked complete for:', state.address)
        }
    }, [state.address])

    return (
        <WalletContext.Provider
            value={{
                ...state,
                connect,
                disconnect,
                refreshBalance,
                markOnboardingComplete,
            }}
        >
            {children}
        </WalletContext.Provider>
    )
}

export function useWalletContext() {
    const context = useContext(WalletContext)
    if (!context) {
        throw new Error("useWalletContext must be used within WalletProvider")
    }
    return context
}
