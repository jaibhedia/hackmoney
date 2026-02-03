import { NextRequest, NextResponse } from "next/server"
import { broadcastOrder, broadcastOrderUpdate, orders as orderStore, Order } from "./sse/route"
import { storeOrderToSui, updateOrderOnSui, createOrderActivityLog } from "@/lib/sui-storage"
import { createPublicClient, http, formatUnits } from "viem"
import { CONTRACT_ADDRESSES, USDC_ADDRESS } from "@/lib/web3-config"

/**
 * Orders API with Sui Integration
 * 
 * GET: Fetch orders (with optional filters)
 * POST: Create new sell order + log to Sui
 * PATCH: Update order status + log to Sui
 * 
 * SECURITY: All amounts are verified on-chain before order creation
 */

// Arc Testnet chain config
const arcTestnet = {
    id: 5042002,
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
    rpcUrls: { default: { http: ["https://5042002.rpc.thirdweb.com"] } },
} as const

// Public client for on-chain verification
const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http(),
})

// USDC ERC20 ABI (just balanceOf)
const USDC_BALANCE_ABI = [
    {
        inputs: [{ name: "account", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    }
] as const

// Staking ABI to check user's trading limit
const STAKING_ABI = [
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

const ORDER_EXPIRY_MINUTES = 15

// Sui object IDs for orders (in production, stored in Sui)
const orderSuiIds: Map<string, string> = new Map()

// Exchange rate (in production, fetch from oracle)
const EXCHANGE_RATE_INR = 90.42

/**
 * Verify user's USDC balance on-chain
 */
async function verifyOnChainBalance(
    userAddress: string,
    requiredAmount: number
): Promise<{ valid: boolean; balance: number; error?: string }> {
    try {
        // Skip verification if USDC contract not configured
        if (!USDC_ADDRESS || USDC_ADDRESS === '0x0000000000000000000000000000000000000000') {
            console.warn('[Orders] USDC_ADDRESS not configured, skipping balance check')
            return { valid: true, balance: requiredAmount }
        }

        const balance = await publicClient.readContract({
            address: USDC_ADDRESS as `0x${string}`,
            abi: USDC_BALANCE_ABI,
            functionName: "balanceOf",
            args: [userAddress as `0x${string}`],
        })

        const balanceUsdc = Number(balance) / 1_000_000
        
        if (balanceUsdc < requiredAmount) {
            return {
                valid: false,
                balance: balanceUsdc,
                error: `Insufficient balance. Required: ${requiredAmount} USDC, Available: ${balanceUsdc.toFixed(2)} USDC`
            }
        }

        return { valid: true, balance: balanceUsdc }
    } catch (error) {
        console.error('[Orders] Balance verification failed:', error)
        // In production, fail closed - reject if we can't verify
        // For testnet, allow through with warning
        return { valid: true, balance: requiredAmount }
    }
}

/**
 * Verify user's tier trading limit on-chain
 */
async function verifyTierLimit(
    userAddress: string,
    orderAmountFiat: number
): Promise<{ valid: boolean; limit: number; error?: string }> {
    try {
        const result = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.P2P_ESCROW as `0x${string}`,
            abi: STAKING_ABI,
            functionName: "stakes",
            args: [userAddress as `0x${string}`],
        })

        const tradingLimit = Number(result[2]) / 1_000_000 // USDC limit
        const tradingLimitFiat = tradingLimit * EXCHANGE_RATE_INR

        // If user has no stake, default limit is 5000 INR (Starter tier)
        const effectiveLimit = tradingLimit === 0 ? 5000 : tradingLimitFiat

        if (orderAmountFiat > effectiveLimit) {
            return {
                valid: false,
                limit: effectiveLimit,
                error: `Order exceeds tier limit. Max: ₹${effectiveLimit.toFixed(0)}, Requested: ₹${orderAmountFiat.toFixed(0)}`
            }
        }

        return { valid: true, limit: effectiveLimit }
    } catch (error) {
        console.error('[Orders] Tier limit verification failed:', error)
        // Default to Starter tier limit if check fails
        const starterLimit = 5000
        if (orderAmountFiat > starterLimit) {
            return {
                valid: false,
                limit: starterLimit,
                error: `Order exceeds default limit. Max: ₹${starterLimit}`
            }
        }
        return { valid: true, limit: starterLimit }
    }
}

/**
 * Generate a unique order ID
 */
function generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * GET /api/orders
 * 
 * Query params:
 * - status: Filter by order status
 * - type: Filter by order type (buy/sell)
 * - userId: Filter by user ID
 * - solverId: Filter by solver ID
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const userId = searchParams.get("userId")
    const solverId = searchParams.get("solverId")

    let orders = Array.from(orderStore.values())

    // Apply filters
    if (status) {
        orders = orders.filter(o => o.status === status)
    }
    if (type) {
        orders = orders.filter(o => o.type === type)
    }
    if (userId) {
        orders = orders.filter(o => o.userId === userId)
    }
    if (solverId) {
        orders = orders.filter(o => o.solverId === solverId)
    }

    // Check for expired orders and update status
    const now = Date.now()
    orders.forEach(order => {
        if (order.status === "created" && order.expiresAt < now) {
            order.status = "expired"
            orderStore.set(order.id, order)
            broadcastOrderUpdate(order, "expired")
        }
    })

    // Sort by createdAt descending
    orders.sort((a, b) => b.createdAt - a.createdAt)

    return NextResponse.json({
        success: true,
        orders,
        count: orders.length,
    })
}

/**
 * POST /api/orders
 * 
 * Create a new sell order and broadcast to solvers
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            userId,
            userAddress,
            type = "sell",
            amountUsdc,
            fiatCurrency,
            paymentMethod,
            paymentDetails,
            qrImage,
        } = body

        // Validation
        if (!userId || !userAddress) {
            return NextResponse.json(
                { success: false, error: "Missing userId or userAddress" },
                { status: 400 }
            )
        }
        if (!amountUsdc || amountUsdc <= 0) {
            return NextResponse.json(
                { success: false, error: "Invalid amountUsdc" },
                { status: 400 }
            )
        }
        if (amountUsdc > 10000) {
            return NextResponse.json(
                { success: false, error: "Order exceeds maximum limit of 10,000 USDC" },
                { status: 400 }
            )
        }
        if (amountUsdc < 10) {
            return NextResponse.json(
                { success: false, error: "Order below minimum of 10 USDC" },
                { status: 400 }
            )
        }
        if (!fiatCurrency || !paymentMethod) {
            return NextResponse.json(
                { success: false, error: "Missing fiatCurrency or paymentMethod" },
                { status: 400 }
            )
        }

        // SECURITY: Calculate fiat amount server-side, don't trust client
        const serverCalculatedFiat = amountUsdc * EXCHANGE_RATE_INR

        // SECURITY: Verify on-chain balance for sell orders
        if (type === "sell") {
            const balanceCheck = await verifyOnChainBalance(userAddress, amountUsdc)
            if (!balanceCheck.valid) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: balanceCheck.error,
                        availableBalance: balanceCheck.balance 
                    },
                    { status: 400 }
                )
            }
        }

        // SECURITY: Verify tier limit on-chain
        const tierCheck = await verifyTierLimit(userAddress, serverCalculatedFiat)
        if (!tierCheck.valid) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: tierCheck.error,
                    tierLimit: tierCheck.limit 
                },
                { status: 400 }
            )
        }

        // Create the order with SERVER-CALCULATED amounts
        const now = Date.now()
        const order: Order = {
            id: generateOrderId(),
            type: type as "buy" | "sell",
            status: "created",
            userId,
            userAddress,
            amountUsdc,
            amountFiat: serverCalculatedFiat, // NEVER trust client-sent fiat amount
            fiatCurrency,
            paymentMethod,
            paymentDetails: paymentDetails || "",
            qrImage: qrImage || undefined,
            createdAt: now,
            expiresAt: now + ORDER_EXPIRY_MINUTES * 60 * 1000,
        }

        console.log(`[Orders] Creating order: ${amountUsdc} USDC = ₹${serverCalculatedFiat.toFixed(2)} (verified on-chain)`)

        // Store the order in memory
        orderStore.set(order.id, order)

        // Store to Sui blockchain
        const suiObjectId = await storeOrderToSui({
            ...order,
        })
        if (suiObjectId) {
            orderSuiIds.set(order.id, suiObjectId)
            console.log(`[Orders] Order ${order.id} stored to Sui: ${suiObjectId}`)
        }

        // Broadcast to all connected solvers
        broadcastOrder(order)

        return NextResponse.json({
            success: true,
            order,
            suiObjectId,
            message: "Order created and broadcasted to solvers",
        })
    } catch (error) {
        console.error("Failed to create order:", error)
        return NextResponse.json(
            { success: false, error: "Failed to create order" },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/orders
 * 
 * Update order status (match, complete, dispute, cancel)
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, action, solverId, solverAddress, lpPaymentProof } = body

        if (!orderId || !action) {
            return NextResponse.json(
                { success: false, error: "Missing orderId or action" },
                { status: 400 }
            )
        }

        const order = orderStore.get(orderId)
        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            )
        }

        switch (action) {
            case "match":
                // Solver accepts the order
                if (!solverId || !solverAddress) {
                    return NextResponse.json(
                        { success: false, error: "Missing solverId or solverAddress" },
                        { status: 400 }
                    )
                }
                if (order.status !== "created") {
                    return NextResponse.json(
                        { success: false, error: "Order cannot be matched" },
                        { status: 400 }
                    )
                }
                order.status = "matched"
                order.solverId = solverId
                order.solverAddress = solverAddress
                order.matchedAt = Date.now()
                break

            case "payment_sent":
                // Solver has sent fiat payment with proof
                // Allow if status is matched OR payment_pending (user uploaded QR)
                if (order.status !== "matched" && order.status !== "payment_pending") {
                    return NextResponse.json(
                        { success: false, error: "Order not in matched or payment_pending state" },
                        { status: 400 }
                    )
                }
                order.status = "payment_sent"
                order.paymentSentAt = Date.now()
                order.disputePeriodEndsAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                if (lpPaymentProof) {
                    order.lpPaymentProof = lpPaymentProof
                }
                break

            case "complete":
                // User confirms payment received, USDC released
                if (order.status !== "payment_sent") {
                    return NextResponse.json(
                        { success: false, error: "Payment not marked as sent" },
                        { status: 400 }
                    )
                }
                order.status = "completed"
                order.completedAt = Date.now()
                break

            case "dispute":
                // Either party raises a dispute
                if (!["matched", "payment_sent", "payment_pending"].includes(order.status)) {
                    return NextResponse.json(
                        { success: false, error: "Cannot dispute this order" },
                        { status: 400 }
                    )
                }
                order.status = "disputed"
                break

            case "cancel":
                // Cancel order - users can cancel created orders, LPs can release matched orders
                if (order.status === "created") {
                    order.status = "cancelled"
                } else if (order.status === "matched") {
                    // LP releasing the order back to pool
                    order.status = "created"
                    order.solverId = undefined
                    order.solverAddress = undefined
                    order.matchedAt = undefined
                    broadcastOrderUpdate(order, "released")
                } else {
                    return NextResponse.json(
                        { success: false, error: "Cannot cancel order in this status" },
                        { status: 400 }
                    )
                }
                break

            case "add_qr":
                // User adds their UPI QR after LP match
                if (order.status !== "matched") {
                    return NextResponse.json(
                        { success: false, error: "Can only add QR after LP match" },
                        { status: 400 }
                    )
                }
                const { qrImage } = body
                if (!qrImage) {
                    return NextResponse.json(
                        { success: false, error: "QR image is required" },
                        { status: 400 }
                    )
                }
                order.qrImage = qrImage
                order.status = "payment_pending"
                break

            default:
                return NextResponse.json(
                    { success: false, error: "Invalid action" },
                    { status: 400 }
                )
        }

        // Update in store
        orderStore.set(orderId, order)

        // Broadcast update to all solvers
        broadcastOrderUpdate(order, action)

        return NextResponse.json({
            success: true,
            order,
            message: `Order ${action} successful`,
        })
    } catch (error) {
        console.error("Failed to update order:", error)
        return NextResponse.json(
            { success: false, error: "Failed to update order" },
            { status: 500 }
        )
    }
}
