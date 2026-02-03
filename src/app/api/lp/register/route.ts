import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, http } from "viem"
import { CONTRACT_ADDRESSES } from "@/lib/web3-config"

// Arc Testnet chain config for viem
const arcTestnet = {
    id: 5042002,
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
    rpcUrls: { default: { http: ["https://5042002.rpc.thirdweb.com"] } },
} as const

// Public client for reading on-chain data
const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(),
})

// ABI for reading stakes from P2PEscrowV2
const STAKING_READ_ABI = [
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
    }
] as const

// Minimum stake required to be LP (50 USDC = 50 * 1e6)
const MIN_LP_STAKE = BigInt(50_000_000)

// In-memory store for LPs (replace with database in production)
const liquidityProviders: Map<string, {
    address: string
    stake: number
    rate: number
    minOrder: number
    maxOrder: number
    paymentMethods: string[]
    isActive: boolean
    completedOrders: number
    rating: number
    registeredAt: number
}> = new Map()

/**
 * Verify on-chain stake for LP registration
 */
async function verifyOnChainStake(address: string): Promise<{ valid: boolean; stake: number; error?: string }> {
    try {
        const result = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.P2P_ESCROW as `0x${string}`,
            abi: STAKING_READ_ABI,
            functionName: "stakes",
            args: [address as `0x${string}`],
        })

        const baseStake = result[0]
        const stakeInUsdc = Number(baseStake) / 1_000_000

        if (baseStake < MIN_LP_STAKE) {
            return {
                valid: false,
                stake: stakeInUsdc,
                error: `Insufficient stake. Required: 50 USDC, Found: ${stakeInUsdc.toFixed(2)} USDC`
            }
        }

        return { valid: true, stake: stakeInUsdc }
    } catch (error) {
        console.error("[LP] On-chain verification failed:", error)
        return {
            valid: false,
            stake: 0,
            error: "Failed to verify on-chain stake. Contract may not be deployed."
        }
    }
}

/**
 * POST /api/lp/register - Register as a Liquidity Provider
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { address, rate, minOrder, maxOrder, paymentMethods } = body

        if (!address) {
            return NextResponse.json(
                { success: false, error: "Address is required" },
                { status: 400 }
            )
        }

        // Check if already registered
        if (liquidityProviders.has(address.toLowerCase())) {
            return NextResponse.json(
                { success: false, error: "Already registered as LP" },
                { status: 400 }
            )
        }

        // Verify on-chain stake
        const stakeVerification = await verifyOnChainStake(address)
        
        if (!stakeVerification.valid) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: stakeVerification.error,
                    currentStake: stakeVerification.stake,
                    requiredStake: 50
                },
                { status: 400 }
            )
        }

        // Register LP with verified stake
        liquidityProviders.set(address.toLowerCase(), {
            address: address.toLowerCase(),
            stake: stakeVerification.stake,
            rate: rate || 83.50,
            minOrder: minOrder || 10,
            maxOrder: maxOrder || 1000,
            paymentMethods: paymentMethods || ['UPI'],
            isActive: true,
            completedOrders: 0,
            rating: 100,
            registeredAt: Date.now()
        })

        console.log(`[LP] Registered new LP: ${address} with stake: ${stakeVerification.stake} USDC`)

        return NextResponse.json({
            success: true,
            message: "Successfully registered as LP",
            lp: liquidityProviders.get(address.toLowerCase())
        })
    } catch (error) {
        console.error("[LP] Registration error:", error)
        return NextResponse.json(
            { success: false, error: "Failed to register LP" },
            { status: 500 }
        )
    }
}

/**
 * GET /api/lp/register - Check LP registration status
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
        return NextResponse.json(
            { success: false, error: "Address is required" },
            { status: 400 }
        )
    }

    const lp = liquidityProviders.get(address.toLowerCase())

    return NextResponse.json({
        success: true,
        isRegistered: !!lp,
        lp: lp || null
    })
}

/**
 * PATCH /api/lp/register - Update LP settings
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { address, rate, minOrder, maxOrder, paymentMethods, isActive } = body

        if (!address) {
            return NextResponse.json(
                { success: false, error: "Address is required" },
                { status: 400 }
            )
        }

        const lp = liquidityProviders.get(address.toLowerCase())
        if (!lp) {
            return NextResponse.json(
                { success: false, error: "Not registered as LP" },
                { status: 404 }
            )
        }

        // Update fields
        if (rate !== undefined) lp.rate = rate
        if (minOrder !== undefined) lp.minOrder = minOrder
        if (maxOrder !== undefined) lp.maxOrder = maxOrder
        if (paymentMethods !== undefined) lp.paymentMethods = paymentMethods
        if (isActive !== undefined) lp.isActive = isActive

        liquidityProviders.set(address.toLowerCase(), lp)

        return NextResponse.json({
            success: true,
            message: "LP settings updated",
            lp
        })
    } catch (error) {
        console.error("[LP] Update error:", error)
        return NextResponse.json(
            { success: false, error: "Failed to update LP settings" },
            { status: 500 }
        )
    }
}
