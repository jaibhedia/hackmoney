"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useActiveAccount, useConnect, useDisconnect } from "thirdweb/react"
import { inAppWallet } from "thirdweb/wallets"
import { thirdwebClient, arcTestnetChain } from "@/lib/thirdweb-config"

/**
 * Wallet Context - Thirdweb Auth + Arc Custodial Wallet + ENS-style naming
 * 
 * Features:
 * - Social login (Google, Apple, Email) via Thirdweb
 * - Arc chain USDC wallet
 * - ENS-style readable wallet names
 */

// ENS-style name generation
const ADJECTIVES = ["cool", "fast", "happy", "lucky", "swift", "brave", "calm", "bold", "wise", "kind"]
const ANIMALS = ["panda", "tiger", "eagle", "wolf", "fox", "bear", "lion", "hawk", "whale", "deer"]

function generateReadableName(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
    const num = Math.floor(Math.random() * 99)
    return `${adj}${animal}${num}`
}

interface WalletState {
    address: string | null
    ensName: string | null   // ENS-style name
    isConnected: boolean
    balance: number          // USDC balance
    isLoading: boolean
}

interface WalletContextType extends WalletState {
    connect: (method: "google" | "apple" | "email", email?: string) => Promise<boolean>
    disconnect: () => void
    deposit: (amount: number) => Promise<boolean>
    withdraw: (amount: number) => Promise<boolean>
    refreshBalance: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | null>(null)

// Local storage keys
const WALLET_KEY = "uwu_wallet"
const BALANCE_KEY = "uwu_balance"
const ENS_NAME_KEY = "uwu_ens_name"

export function WalletProvider({ children }: { children: ReactNode }) {
    // NOTE: Thirdweb hooks require ThirdwebProvider to be mounted
    // Since we're inside ThirdwebProvider (in layout.tsx), these hooks will work
    // after hydration. We add error handling to prevent SSR crashes.

    let account: ReturnType<typeof useActiveAccount> = undefined
    let thirdwebConnect: ReturnType<typeof useConnect>['connect'] | undefined
    let thirdwebDisconnect: ReturnType<typeof useDisconnect>['disconnect'] | undefined

    try {
        account = useActiveAccount()
        const connectHook = useConnect()
        const disconnectHook = useDisconnect()
        thirdwebConnect = connectHook.connect
        thirdwebDisconnect = disconnectHook.disconnect
    } catch (e) {
        // Hooks may fail during SSR or before hydration - use fallback
        console.debug('[Wallet] Thirdweb hooks not ready, using fallback')
    }

    const [mounted, setMounted] = useState(false)
    const [state, setState] = useState<WalletState>({
        address: null,
        ensName: null,
        isConnected: false,
        balance: 0,
        isLoading: true,
    })

    // Mark as mounted after hydration
    useEffect(() => {
        setMounted(true)
    }, [])

    // Load wallet from Thirdweb account or localStorage fallback
    useEffect(() => {
        if (account?.address) {
            // Thirdweb account connected
            let ensName = localStorage.getItem(ENS_NAME_KEY)
            let balance = localStorage.getItem(BALANCE_KEY)

            if (!ensName) {
                ensName = generateReadableName()
                localStorage.setItem(ENS_NAME_KEY, ensName)
            }

            if (!balance) {
                balance = "100" // Start with 100 USDC for testing
                localStorage.setItem(BALANCE_KEY, balance)
            }

            localStorage.setItem(WALLET_KEY, account.address)

            setState({
                address: account.address,
                ensName,
                isConnected: true,
                balance: parseFloat(balance),
                isLoading: false,
            })
        } else {
            // Check localStorage for existing wallet
            const savedWallet = localStorage.getItem(WALLET_KEY)
            const savedBalance = localStorage.getItem(BALANCE_KEY)
            const savedEnsName = localStorage.getItem(ENS_NAME_KEY)

            if (savedWallet) {
                setState({
                    address: savedWallet,
                    ensName: savedEnsName || generateReadableName(),
                    isConnected: true,
                    balance: savedBalance ? parseFloat(savedBalance) : 100,
                    isLoading: false,
                })
            } else {
                setState(prev => ({ ...prev, isLoading: false }))
            }
        }
    }, [account?.address])

    // Connect wallet via Thirdweb
    const connect = async (method: "google" | "apple" | "email", email?: string): Promise<boolean> => {
        setState(prev => ({ ...prev, isLoading: true }))

        try {
            const wallet = inAppWallet()

            if (method === "email" && email) {
                // Email requires OTP verification flow - use local fallback for now
                // Production: implement sendVerificationEmail → enter OTP → verify
                console.log("[Wallet] Email auth requires OTP, using local fallback")
                throw new Error("Email auth uses local fallback")
            } else if (method === "google" && thirdwebConnect) {
                await thirdwebConnect(async () => {
                    await wallet.connect({
                        client: thirdwebClient,
                        chain: arcTestnetChain,
                        strategy: "google",
                    })
                    return wallet
                })
            } else if (method === "apple" && thirdwebConnect) {
                await thirdwebConnect(async () => {
                    await wallet.connect({
                        client: thirdwebClient,
                        chain: arcTestnetChain,
                        strategy: "apple",
                    })
                    return wallet
                })
            }

            // Generate ENS-style name for new users
            let ensName = localStorage.getItem(ENS_NAME_KEY)
            if (!ensName) {
                ensName = generateReadableName()
                localStorage.setItem(ENS_NAME_KEY, ensName)
            }

            // Initialize balance for new users
            let balance = localStorage.getItem(BALANCE_KEY)
            if (!balance) {
                balance = "100"
                localStorage.setItem(BALANCE_KEY, balance)
            }

            setState(prev => ({
                ...prev,
                ensName,
                balance: parseFloat(balance || "100"),
                isLoading: false,
            }))

            return true
        } catch (error) {
            console.error("[Wallet] Connection failed:", error)

            // Fallback to local wallet for development
            const address = "0x" + Array.from({ length: 40 }, () =>
                "0123456789abcdef"[Math.floor(Math.random() * 16)]
            ).join("")

            const ensName = generateReadableName()
            const balance = "100"

            localStorage.setItem(WALLET_KEY, address)
            localStorage.setItem(ENS_NAME_KEY, ensName)
            localStorage.setItem(BALANCE_KEY, balance)

            setState({
                address,
                ensName,
                isConnected: true,
                balance: 100,
                isLoading: false,
            })

            return true
        }
    }

    // Disconnect wallet
    const disconnect = () => {
        try {
            if (thirdwebDisconnect) {
                thirdwebDisconnect(inAppWallet())
            }
        } catch { /* ignore */ }

        localStorage.removeItem(WALLET_KEY)
        localStorage.removeItem(BALANCE_KEY)
        localStorage.removeItem(ENS_NAME_KEY)

        setState({
            address: null,
            ensName: null,
            isConnected: false,
            balance: 0,
            isLoading: false,
        })
    }

    // Deposit USDC to wallet
    const deposit = async (amount: number): Promise<boolean> => {
        if (!state.address || amount <= 0) return false

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const newBalance = state.balance + amount
            localStorage.setItem(BALANCE_KEY, newBalance.toString())

            setState(prev => ({ ...prev, balance: newBalance }))
            console.log(`[Wallet] Deposited ${amount} USDC. New balance: ${newBalance}`)

            return true
        } catch (error) {
            console.error("[Wallet] Deposit failed:", error)
            return false
        }
    }

    // Withdraw USDC from wallet
    const withdraw = async (amount: number): Promise<boolean> => {
        if (!state.address || amount <= 0 || amount > state.balance) return false

        try {
            await new Promise(resolve => setTimeout(resolve, 500))

            const newBalance = state.balance - amount
            localStorage.setItem(BALANCE_KEY, newBalance.toString())

            setState(prev => ({ ...prev, balance: newBalance }))
            console.log(`[Wallet] Withdrew ${amount} USDC. New balance: ${newBalance}`)

            return true
        } catch (error) {
            console.error("[Wallet] Withdraw failed:", error)
            return false
        }
    }

    // Refresh balance
    const refreshBalance = async () => {
        const savedBalance = localStorage.getItem(BALANCE_KEY)
        setState(prev => ({
            ...prev,
            balance: savedBalance ? parseFloat(savedBalance) : 0,
        }))
    }

    return (
        <WalletContext.Provider
            value={{
                ...state,
                connect,
                disconnect,
                deposit,
                withdraw,
                refreshBalance,
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
