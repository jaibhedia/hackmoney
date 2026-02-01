import { NextRequest } from "next/server"

/**
 * Order Types - Updated for new P2P flow
 */
export interface Order {
    id: string
    type: "buy" | "sell"
    status: "created" | "matched" | "payment_pending" | "payment_sent" | "completed" | "disputed" | "cancelled" | "expired" | "settled"
    userId: string
    userAddress: string
    amountUsdc: number
    amountFiat: number
    fiatCurrency: string
    paymentMethod: string
    paymentDetails: string
    qrImage?: string           // User's destination QR (base64)
    lpPaymentProof?: string    // LP's payment screenshot (base64)
    createdAt: number
    expiresAt: number
    matchedAt?: number
    solverId?: string
    solverAddress?: string
    paymentSentAt?: number     // When LP marked payment sent
    disputePeriodEndsAt?: number // 24hrs after payment_sent
    completedAt?: number
    settledAt?: number         // When USDC released to LP
}

// In-memory store for orders (replace with database in production)
const orders: Map<string, Order> = new Map()

// SSE connections for solvers
const solverConnections: Map<string, ReadableStreamDefaultController> = new Map()

/**
 * SSE Endpoint for Solver Order Feed
 * 
 * Solvers subscribe to this endpoint to receive real-time order updates.
 * When a user creates a sell order, it's broadcasted to all connected solvers.
 */
export async function GET(request: NextRequest) {
    const solverId = request.nextUrl.searchParams.get("solverId")

    if (!solverId) {
        return new Response("Missing solverId parameter", { status: 400 })
    }

    const stream = new ReadableStream({
        start(controller) {
            // Store the connection
            solverConnections.set(solverId, controller)

            // Send initial connection message
            const connectMessage = JSON.stringify({
                type: "connected",
                message: "Connected to order feed",
                timestamp: Date.now(),
            })
            controller.enqueue(`data: ${connectMessage}\n\n`)

            // Send current active orders
            const activeOrders = Array.from(orders.values())
                .filter(o => o.status === "created")
                .slice(0, 50)

            if (activeOrders.length > 0) {
                const ordersMessage = JSON.stringify({
                    type: "active_orders",
                    orders: activeOrders,
                })
                controller.enqueue(`data: ${ordersMessage}\n\n`)
            }

            // Keep-alive ping every 30 seconds
            const pingInterval = setInterval(() => {
                try {
                    controller.enqueue(`data: ${JSON.stringify({ type: "ping", timestamp: Date.now() })}\n\n`)
                } catch {
                    clearInterval(pingInterval)
                }
            }, 30000)

            // Cleanup on disconnect
            request.signal.addEventListener("abort", () => {
                clearInterval(pingInterval)
                solverConnections.delete(solverId)
                controller.close()
            })
        },
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    })
}

/**
 * Broadcast a new order to all connected solvers
 */
export function broadcastOrder(order: Order) {
    const message = JSON.stringify({
        type: "new_order",
        order,
        timestamp: Date.now(),
    })

    solverConnections.forEach((controller, solverId) => {
        try {
            controller.enqueue(`data: ${message}\n\n`)
        } catch (error) {
            console.error(`Failed to send to solver ${solverId}:`, error)
            solverConnections.delete(solverId)
        }
    })
}

/**
 * Broadcast order update (matched, completed, etc.)
 */
export function broadcastOrderUpdate(order: Order, updateType: string) {
    const message = JSON.stringify({
        type: "order_update",
        updateType,
        order,
        timestamp: Date.now(),
    })

    solverConnections.forEach((controller, solverId) => {
        try {
            controller.enqueue(`data: ${message}\n\n`)
        } catch (error) {
            console.error(`Failed to send update to solver ${solverId}:`, error)
            solverConnections.delete(solverId)
        }
    })
}

// Export for use in other API routes
export { orders, solverConnections }
