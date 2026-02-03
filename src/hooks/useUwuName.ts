"use client"

import { useState, useCallback, useEffect } from 'react'
import { 
    registerUwuName, 
    resolveUwuName, 
    getUwuName, 
    isNameAvailable,
    validateUwuName 
} from '@/lib/uwu-names'

/**
 * Hook for managing .uwu names
 * Provides registration, resolution, and lookup functionality
 */
export function useUwuName(address?: string) {
    const [uwuName, setUwuName] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch existing .uwu name for address
    useEffect(() => {
        if (!address) {
            setUwuName(null)
            return
        }

        const fetchName = async () => {
            setIsLoading(true)
            try {
                const name = await getUwuName(address)
                setUwuName(name)
            } catch (err) {
                console.error('Failed to fetch uwu name:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchName()
    }, [address])

    /**
     * Register a new .uwu name
     */
    const register = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
        if (!address) {
            return { success: false, error: 'Wallet not connected' }
        }

        // Validate name
        const validation = validateUwuName(name)
        if (!validation.valid) {
            return { success: false, error: validation.error }
        }

        setIsLoading(true)
        setError(null)

        try {
            // Check availability
            const available = await isNameAvailable(name)
            if (!available) {
                setError('Name is already taken')
                return { success: false, error: 'Name is already taken' }
            }

            // Register the name
            const result = await registerUwuName(address, name)
            
            if (result.success) {
                setUwuName(result.name || null)
                // Store in localStorage as backup
                if (result.name) {
                    localStorage.setItem('uwu_registered_name', result.name)
                }
                return { success: true }
            } else {
                setError(result.error || 'Registration failed')
                return { success: false, error: result.error }
            }
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Registration failed'
            setError(errMsg)
            return { success: false, error: errMsg }
        } finally {
            setIsLoading(false)
        }
    }, [address])

    /**
     * Resolve a .uwu name to address
     */
    const resolve = useCallback(async (name: string): Promise<string | null> => {
        try {
            return await resolveUwuName(name)
        } catch {
            return null
        }
    }, [])

    /**
     * Check if a name is available
     */
    const checkAvailability = useCallback(async (name: string): Promise<boolean> => {
        try {
            return await isNameAvailable(name)
        } catch {
            return false
        }
    }, [])

    return {
        uwuName,
        isLoading,
        error,
        register,
        resolve,
        checkAvailability,
        validate: validateUwuName,
    }
}

/**
 * Hook for resolving any name (ENS or .uwu) to address
 */
export function useResolveName() {
    const [isLoading, setIsLoading] = useState(false)

    const resolveName = useCallback(async (nameOrAddress: string): Promise<{
        address: string | null
        type: 'address' | 'uwu' | 'ens' | 'unknown'
    }> => {
        setIsLoading(true)

        try {
            // Check if it's already an address
            if (nameOrAddress.startsWith('0x') && nameOrAddress.length === 42) {
                return { address: nameOrAddress, type: 'address' }
            }

            // Check if it's an ENS name (.eth) - resolve first
            if (nameOrAddress.endsWith('.eth')) {
                try {
                    // Use public ENS API for resolution
                    const response = await fetch(`https://api.ensideas.com/ens/resolve/${nameOrAddress}`)
                    const data = await response.json()
                    if (data.address) {
                        return { address: data.address, type: 'ens' }
                    }
                } catch (err) {
                    console.error('ENS resolution failed:', err)
                }
                return { address: null, type: 'ens' }
            }

            // Check if it's a .uwu name
            if (nameOrAddress.endsWith('.uwu') || !nameOrAddress.includes('.')) {
                const resolved = await resolveUwuName(nameOrAddress)
                if (resolved) {
                    return { address: resolved, type: 'uwu' }
                }
            }

            return { address: null, type: 'unknown' }
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        resolveName,
        isLoading,
    }
}
