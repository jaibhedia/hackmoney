"use client"

import { useState, useEffect, useMemo } from 'react'
import { createPublicClient, http, type Address } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

/**
 * Hook for ENS name resolution
 * Resolves ENS names to addresses and vice versa
 * Uses Ethereum Mainnet for production ENS lookups
 * 
 * NOTE: This is optional functionality - failures don't block the app
 */

// Use a reliable public RPC with fallback
const ENS_RPC_URLS = [
    'https://ethereum-rpc.publicnode.com',
    'https://rpc.ankr.com/eth',
    'https://cloudflare-eth.com',
]

export function useENS(addressOrName?: string) {
    const [ensName, setEnsName] = useState<string | null>(null)
    const [ensAddress, setEnsAddress] = useState<Address | null>(null)
    const [ensAvatar, setEnsAvatar] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Create public client for ENS queries (Ethereum Mainnet)
    // Use useMemo to prevent recreating on every render
    const publicClient = useMemo(() => createPublicClient({
        chain: mainnet,
        transport: http(ENS_RPC_URLS[0], {
            timeout: 5000, // 5 second timeout
            retryCount: 1,
        }),
    }), [])

    useEffect(() => {
        if (!addressOrName) {
            setEnsName(null)
            setEnsAddress(null)
            setEnsAvatar(null)
            return
        }

        const resolveENS = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Check if input is an ENS name (contains .eth) or address
                const isEnsName = addressOrName.includes('.eth')

                if (isEnsName) {
                    // Resolve name to address
                    const normalizedName = normalize(addressOrName)
                    const address = await publicClient.getEnsAddress({
                        name: normalizedName,
                    })

                    setEnsAddress(address)
                    setEnsName(addressOrName)

                    // Get avatar
                    if (address) {
                        try {
                            const avatar = await publicClient.getEnsAvatar({
                                name: normalizedName,
                            })
                            setEnsAvatar(avatar)
                        } catch (err) {
                            console.warn('Failed to load ENS avatar:', err)
                        }
                    }
                } else {
                    // Lookup address to get ENS name (reverse resolution)
                    // This is optional - many users won't have ENS names
                    try {
                        const name = await publicClient.getEnsName({
                            address: addressOrName as Address,
                        })

                        setEnsName(name)
                        setEnsAddress(addressOrName as Address)

                        // Get avatar only if name exists
                        if (name) {
                            try {
                                const avatar = await publicClient.getEnsAvatar({
                                    name: normalize(name),
                                })
                                setEnsAvatar(avatar)
                            } catch {
                                // Avatar fetch is optional, silently ignore
                            }
                        }
                    } catch {
                        // Reverse lookup failed - this is common and expected
                        // Most users don't have ENS names
                        setEnsAddress(addressOrName as Address)
                    }
                }
            } catch (err) {
                // ENS resolution is optional - don't block on errors
                console.warn('[ENS] Resolution failed (non-blocking):', err instanceof Error ? err.message : 'Unknown error')
                setError(err as Error)
            } finally {
                setIsLoading(false)
            }
        }

        // Add a small delay to prevent blocking initial render
        const timeoutId = setTimeout(resolveENS, 100)
        return () => clearTimeout(timeoutId)
    }, [addressOrName, publicClient])

    return {
        ensName,
        ensAddress,
        ensAvatar,
        isLoading,
        error,
        displayName: ensName || (ensAddress ? `${ensAddress.slice(0, 6)}...${ensAddress.slice(-4)}` : ''),
    }
}

/**
 * Hook to resolve a single ENS name to address
 */
export function useResolveENSName(name?: string) {
    const [address, setAddress] = useState<Address | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const publicClient = useMemo(() => createPublicClient({
        chain: mainnet,
        transport: http(ENS_RPC_URLS[0], {
            timeout: 5000,
            retryCount: 1,
        }),
    }), [])

    const resolveName = async (ensName: string) => {
        setIsLoading(true)
        try {
            const normalizedName = normalize(ensName)
            const addr = await publicClient.getEnsAddress({
                name: normalizedName,
            })
            setAddress(addr)
            return addr
        } catch (err) {
            console.error('Failed to resolve ENS name:', err)
            return null
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (name) {
            resolveName(name)
        }
    }, [name])

    return {
        address,
        isLoading,
        resolveName,
    }
}
