"use client"

import { useState, useEffect } from 'react'
import { createPublicClient, http, type Address } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { ENS_CONFIG } from '@/lib/web3-config'

/**
 * Hook for ENS name resolution
 * Resolves ENS names to addresses and vice versa
 */
export function useENS(addressOrName?: string) {
    const [ensName, setEnsName] = useState<string | null>(null)
    const [ensAddress, setEnsAddress] = useState<Address | null>(null)
    const [ensAvatar, setEnsAvatar] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Create public client for ENS queries (Sepolia testnet)
    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(ENS_CONFIG.rpcUrl),
    })

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
                    const name = await publicClient.getEnsName({
                        address: addressOrName as Address,
                    })

                    setEnsName(name)
                    setEnsAddress(addressOrName as Address)

                    // Get avatar
                    if (name) {
                        try {
                            const avatar = await publicClient.getEnsAvatar({
                                name: normalize(name),
                            })
                            setEnsAvatar(avatar)
                        } catch (err) {
                            console.warn('Failed to load ENS avatar:', err)
                        }
                    }
                }
            } catch (err) {
                console.error('ENS resolution error:', err)
                setError(err as Error)
            } finally {
                setIsLoading(false)
            }
        }

        resolveENS()
    }, [addressOrName])

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

    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(ENS_CONFIG.rpcUrl),
    })

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
