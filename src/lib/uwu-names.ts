/**
 * uWu Names - ENS-style naming for the platform
 * 
 * Provides .uwu usernames that map to wallet addresses.
 * Uses Sui for storage (cheap, fast).
 */

import { getSuiClient } from './sui-storage'
import { suiConfig } from './web3-config'

// Package ID for uWu Names contract (to be deployed)
const UWU_NAMES_PACKAGE_ID = process.env.NEXT_PUBLIC_UWU_NAMES_PACKAGE_ID || "0x0"

// In-memory cache for quick lookups
const nameCache = new Map<string, string>() // name -> address
const reverseCache = new Map<string, string>() // address -> name

export interface UwuName {
    name: string
    address: string
    registeredAt: number
    suiObjectId?: string
}

/**
 * Register a .uwu name for an address
 * @param address - The wallet address
 * @param name - The desired username (without .uwu suffix)
 * @returns Success status and registration details
 */
export async function registerUwuName(
    address: string,
    name: string
): Promise<{ success: boolean; name?: string; error?: string }> {
    try {
        // Validate name
        const cleanName = name.toLowerCase().trim()
        if (cleanName.length < 3) {
            return { success: false, error: 'Name must be at least 3 characters' }
        }
        if (cleanName.length > 20) {
            return { success: false, error: 'Name must be 20 characters or less' }
        }
        if (!/^[a-z0-9_]+$/.test(cleanName)) {
            return { success: false, error: 'Name can only contain letters, numbers, and underscores' }
        }

        // Check if name is taken
        const existing = nameCache.get(cleanName)
        if (existing && existing.toLowerCase() !== address.toLowerCase()) {
            return { success: false, error: 'Name is already taken' }
        }

        console.log(`[UwuNames] Registering ${cleanName}.uwu for ${address}`)

        if (UWU_NAMES_PACKAGE_ID === "0x0") {
            // Simulation mode - just cache locally
            console.log("[UwuNames] Running in simulation mode")
            nameCache.set(cleanName, address)
            reverseCache.set(address.toLowerCase(), cleanName)
            return { success: true, name: `${cleanName}.uwu` }
        }

        // In production, call Sui contract to register
        // const tx = new TransactionBlock()
        // tx.moveCall({
        //     target: `${UWU_NAMES_PACKAGE_ID}::names::register`,
        //     arguments: [tx.pure(cleanName), tx.pure(address)],
        // })

        // Cache locally
        nameCache.set(cleanName, address)
        reverseCache.set(address.toLowerCase(), cleanName)

        return { success: true, name: `${cleanName}.uwu` }
    } catch (error) {
        console.error('[UwuNames] Registration failed:', error)
        return { success: false, error: 'Registration failed' }
    }
}

/**
 * Resolve a .uwu name to an address
 * @param name - The username (with or without .uwu suffix)
 * @returns The resolved address or null
 */
export async function resolveUwuName(name: string): Promise<string | null> {
    try {
        // Clean the name
        let cleanName = name.toLowerCase().trim()
        if (cleanName.endsWith('.uwu')) {
            cleanName = cleanName.slice(0, -4)
        }

        // Check cache first
        const cached = nameCache.get(cleanName)
        if (cached) {
            return cached
        }

        if (UWU_NAMES_PACKAGE_ID === "0x0") {
            return null // No contract deployed
        }

        // Query Sui for the name object
        const client = getSuiClient()
        // In production, query the name registry
        // const result = await client.getDynamicFieldObject({...})

        return null
    } catch (error) {
        console.error('[UwuNames] Resolution failed:', error)
        return null
    }
}

/**
 * Get the .uwu name for an address (reverse lookup)
 * @param address - The wallet address
 * @returns The username or null
 */
export async function getUwuName(address: string): Promise<string | null> {
    try {
        // Check cache first
        const cached = reverseCache.get(address.toLowerCase())
        if (cached) {
            return `${cached}.uwu`
        }

        if (UWU_NAMES_PACKAGE_ID === "0x0") {
            return null
        }

        // Query Sui for reverse lookup
        // In production, query the reverse registry

        return null
    } catch (error) {
        console.error('[UwuNames] Reverse lookup failed:', error)
        return null
    }
}

/**
 * Get display name for an address
 * Returns .uwu name if available, otherwise truncated address
 */
export async function getDisplayName(address: string): Promise<string> {
    const uwuName = await getUwuName(address)
    if (uwuName) {
        return uwuName
    }

    // Truncate address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Check if a name is available
 */
export async function isNameAvailable(name: string): Promise<boolean> {
    const cleanName = name.toLowerCase().trim().replace('.uwu', '')

    // Check cache
    if (nameCache.has(cleanName)) {
        return false
    }

    if (UWU_NAMES_PACKAGE_ID === "0x0") {
        return true // In simulation, all names are available
    }

    // Query Sui
    const resolved = await resolveUwuName(cleanName)
    return resolved === null
}

/**
 * Format address with .uwu name
 */
export function formatAddressWithName(address: string, uwuName?: string | null): string {
    if (uwuName) {
        return `${uwuName} (${address.slice(0, 6)}...${address.slice(-4)})`
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Validate a .uwu name format
 */
export function validateUwuName(name: string): { valid: boolean; error?: string } {
    const cleanName = name.toLowerCase().trim().replace('.uwu', '')

    if (cleanName.length < 3) {
        return { valid: false, error: 'Name must be at least 3 characters' }
    }
    if (cleanName.length > 20) {
        return { valid: false, error: 'Name must be 20 characters or less' }
    }
    if (!/^[a-z0-9_]+$/.test(cleanName)) {
        return { valid: false, error: 'Only letters, numbers, and underscores allowed' }
    }

    return { valid: true }
}
