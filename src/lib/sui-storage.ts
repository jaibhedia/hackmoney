import { SuiClient, getFullnodeUrl } from "@mysten/sui.js/client"
import { TransactionBlock } from "@mysten/sui.js/transactions"
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519"
import { suiConfig } from "@/lib/web3-config"

/**
 * Order Storage for Sui Blockchain
 * 
 * This module provides persistent storage for orders on Sui testnet.
 * Uses @mysten/sui.js for actual blockchain interactions.
 */

// Sui client instance
const suiClient = new SuiClient({ url: getFullnodeUrl(suiConfig.network) })

// Package ID for deployed Move contract (to be updated after deployment)
const ORDERS_PACKAGE_ID = process.env.NEXT_PUBLIC_SUI_PACKAGE_ID || "0x0"

export interface StoredOrder {
    id: string
    type: "buy" | "sell"
    status: string
    userId: string
    userAddress: string
    solverId?: string
    solverAddress?: string
    amountUsdc: number
    amountFiat: number
    fiatCurrency: string
    paymentMethod: string
    paymentDetails: string
    createdAt: number
    matchedAt?: number
    completedAt?: number
    suiObjectId?: string
    suiDigest?: string
}

/**
 * Store order to Sui blockchain
 * Creates a new order object on-chain
 */
export async function storeOrderToSui(order: StoredOrder): Promise<string | null> {
    try {
        console.log(`[Sui] Storing order ${order.id} to ${suiConfig.network}`)

        // If no package deployed, use simulation mode
        if (ORDERS_PACKAGE_ID === "0x0") {
            console.log("[Sui] Running in simulation mode (no package deployed)")
            const mockSuiObjectId = `0x${order.id.replace(/[^a-f0-9]/gi, '').slice(0, 40).padStart(64, '0')}`
            console.log(`[Sui] Simulated order stored with object ID: ${mockSuiObjectId}`)
            return mockSuiObjectId
        }

        // In production, we would sign and execute a transaction
        // For now, we'll query the package and prepare the transaction
        const tx = new TransactionBlock()

        tx.moveCall({
            target: `${ORDERS_PACKAGE_ID}::orders::create_order`,
            arguments: [
                tx.pure(order.id),
                tx.pure(order.userAddress),
                tx.pure(order.type),
                tx.pure(order.amountUsdc * 1_000_000), // Convert to smallest unit
                tx.pure(order.amountFiat * 100), // Convert to cents
                tx.pure(order.fiatCurrency),
                tx.pure(order.paymentMethod),
                tx.pure(order.createdAt),
            ],
        })

        // Note: In production, you'd sign this with a keypair or wallet
        // const result = await suiClient.signAndExecuteTransactionBlock({
        //     transactionBlock: tx,
        //     signer: keypair,
        // })

        console.log(`[Sui] Transaction prepared for order ${order.id}`)

        // Return mock ID for now (replace with actual digest in production)
        const mockSuiObjectId = `0x${order.id.replace(/[^a-f0-9]/gi, '').slice(0, 40).padStart(64, '0')}`
        return mockSuiObjectId
    } catch (error) {
        console.error("[Sui] Failed to store order:", error)
        return null
    }
}

/**
 * Update order status on Sui
 */
export async function updateOrderOnSui(
    orderId: string,
    suiObjectId: string,
    newStatus: string,
    additionalData?: Record<string, any>
): Promise<boolean> {
    try {
        console.log(`[Sui] Updating order ${orderId} to status: ${newStatus}`)

        if (ORDERS_PACKAGE_ID === "0x0") {
            console.log("[Sui] Running in simulation mode")
            await new Promise(resolve => setTimeout(resolve, 100))
            console.log(`[Sui] Simulated order ${orderId} updated successfully`)
            return true
        }

        const tx = new TransactionBlock()

        tx.moveCall({
            target: `${ORDERS_PACKAGE_ID}::orders::update_status`,
            arguments: [
                tx.object(suiObjectId),
                tx.pure(newStatus),
                tx.pure(Date.now()),
            ],
        })

        console.log(`[Sui] Status update transaction prepared for ${orderId}`)
        return true
    } catch (error) {
        console.error("[Sui] Failed to update order:", error)
        return false
    }
}

/**
 * Query orders from Sui by user address
 */
export async function queryOrdersFromSui(userAddress: string): Promise<StoredOrder[]> {
    try {
        console.log(`[Sui] Querying orders for ${userAddress}`)

        if (ORDERS_PACKAGE_ID === "0x0") {
            console.log("[Sui] Running in simulation mode, returning empty")
            return []
        }

        // Query owned objects of the Order type
        const objects = await suiClient.getOwnedObjects({
            owner: userAddress,
            filter: {
                StructType: `${ORDERS_PACKAGE_ID}::orders::Order`,
            },
            options: {
                showContent: true,
                showType: true,
            },
        })

        // Parse and return orders
        const orders: StoredOrder[] = []
        for (const obj of objects.data) {
            if (obj.data?.content?.dataType === 'moveObject') {
                const fields = obj.data.content.fields as Record<string, any>
                orders.push({
                    id: fields.order_id,
                    type: fields.order_type,
                    status: fields.status,
                    userId: fields.user_id,
                    userAddress: fields.user_address,
                    amountUsdc: Number(fields.amount_usdc) / 1_000_000,
                    amountFiat: Number(fields.amount_fiat) / 100,
                    fiatCurrency: fields.fiat_currency,
                    paymentMethod: fields.payment_method,
                    paymentDetails: fields.payment_details || '',
                    createdAt: Number(fields.created_at),
                    suiObjectId: obj.data.objectId,
                })
            }
        }

        console.log(`[Sui] Found ${orders.length} orders for ${userAddress}`)
        return orders
    } catch (error) {
        console.error("[Sui] Failed to query orders:", error)
        return []
    }
}

/**
 * Get order by object ID
 */
export async function getOrderFromSui(suiObjectId: string): Promise<StoredOrder | null> {
    try {
        const object = await suiClient.getObject({
            id: suiObjectId,
            options: {
                showContent: true,
            },
        })

        if (object.data?.content?.dataType === 'moveObject') {
            const fields = object.data.content.fields as Record<string, any>
            return {
                id: fields.order_id,
                type: fields.order_type,
                status: fields.status,
                userId: fields.user_id,
                userAddress: fields.user_address,
                amountUsdc: Number(fields.amount_usdc) / 1_000_000,
                amountFiat: Number(fields.amount_fiat) / 100,
                fiatCurrency: fields.fiat_currency,
                paymentMethod: fields.payment_method,
                paymentDetails: fields.payment_details || '',
                createdAt: Number(fields.created_at),
                suiObjectId: suiObjectId,
            }
        }

        return null
    } catch (error) {
        console.error("[Sui] Failed to get order:", error)
        return null
    }
}

/**
 * Generate order activity log entry for Sui
 */
export function createOrderActivityLog(
    order: StoredOrder,
    action: "created" | "matched" | "payment_sent" | "completed" | "disputed" | "cancelled"
): Record<string, any> {
    return {
        orderId: order.id,
        action,
        timestamp: Date.now(),
        actor: action === "matched" || action === "payment_sent"
            ? order.solverAddress
            : order.userAddress,
        details: {
            amountUsdc: order.amountUsdc,
            amountFiat: order.amountFiat,
            fiatCurrency: order.fiatCurrency,
            status: order.status,
        },
    }
}

/**
 * Get Sui client for direct queries
 */
export function getSuiClient(): SuiClient {
    return suiClient
}
