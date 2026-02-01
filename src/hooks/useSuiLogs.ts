"use client"

import { useState, useCallback } from 'react'
import { storeOrderToSui, updateOrderOnSui, createOrderActivityLog, type StoredOrder } from '@/lib/sui-storage'

/**
 * Transaction log structure for Sui storage
 */
export interface TransactionLog {
    orderId: string
    buyer: string
    seller: string
    amountUsdc: number
    amountFiat: number
    currency: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed'
    createdAt: number
    confirmedAt?: number
    completedAt?: number
    arcTxHash?: string
    suiObjectId?: string
    suiDigest?: string
}

/**
 * Hook for logging transactions to Sui blockchain
 * Provides persistent storage for order history and activity logs
 */
export function useSuiLogs() {
    const [logs, setLogs] = useState<TransactionLog[]>([])
    const [isLogging, setIsLogging] = useState(false)

    /**
     * Log a transaction to Sui blockchain
     */
    const logTransaction = useCallback(async (log: Omit<TransactionLog, 'suiObjectId'>): Promise<string | null> => {
        setIsLogging(true)
        try {
            console.log('[Sui] Logging transaction:', log.orderId)

            // Convert to StoredOrder format for Sui storage
            const storedOrder: StoredOrder = {
                id: log.orderId,
                type: log.amountFiat > 0 ? 'buy' : 'sell',
                status: log.status,
                userId: log.buyer,
                userAddress: log.buyer,
                solverId: log.seller,
                solverAddress: log.seller,
                amountUsdc: log.amountUsdc,
                amountFiat: log.amountFiat,
                fiatCurrency: log.currency,
                paymentMethod: 'UPI',
                paymentDetails: '',
                createdAt: log.createdAt,
            }

            // Store to Sui
            const suiObjectId = await storeOrderToSui(storedOrder)

            if (suiObjectId) {
                const fullLog: TransactionLog = {
                    ...log,
                    suiObjectId,
                }

                setLogs(prev => [...prev, fullLog])
                console.log('[Sui] Transaction logged with object ID:', suiObjectId)
                return suiObjectId
            }

            // Fallback: store locally even if Sui fails
            setLogs(prev => [...prev, log as TransactionLog])
            return null
        } catch (error) {
            console.error('[Sui] Failed to log transaction:', error)
            // Store locally as fallback
            setLogs(prev => [...prev, log as TransactionLog])
            return null
        } finally {
            setIsLogging(false)
        }
    }, [])

    /**
     * Update transaction status on Sui
     */
    const updateTransactionStatus = useCallback(async (
        orderId: string,
        newStatus: TransactionLog['status'],
        timestamp?: number
    ): Promise<boolean> => {
        setIsLogging(true)
        try {
            console.log('[Sui] Updating transaction status:', orderId, newStatus)

            // Find the log to get Sui object ID
            const existingLog = logs.find(log => log.orderId === orderId)

            if (existingLog?.suiObjectId) {
                // Update on Sui
                const success = await updateOrderOnSui(
                    orderId,
                    existingLog.suiObjectId,
                    newStatus,
                    timestamp ? { timestamp } : undefined
                )

                if (success) {
                    console.log('[Sui] Transaction status updated on-chain')
                }
            }

            // Update local state
            setLogs(prev => prev.map(log => {
                if (log.orderId === orderId) {
                    const updates: Partial<TransactionLog> = { status: newStatus }
                    if (newStatus === 'confirmed' && timestamp) {
                        updates.confirmedAt = timestamp
                    }
                    if (newStatus === 'completed' && timestamp) {
                        updates.completedAt = timestamp
                    }
                    return { ...log, ...updates }
                }
                return log
            }))

            return true
        } catch (error) {
            console.error('[Sui] Failed to update transaction status:', error)
            return false
        } finally {
            setIsLogging(false)
        }
    }, [logs])

    /**
     * Get logs for a specific order
     */
    const getOrderLogs = useCallback((orderId: string): TransactionLog | undefined => {
        return logs.find(log => log.orderId === orderId)
    }, [logs])

    /**
     * Get all logs for a user
     */
    const getUserLogs = useCallback((userAddress: string): TransactionLog[] => {
        return logs.filter(
            log => log.buyer.toLowerCase() === userAddress.toLowerCase() ||
                log.seller.toLowerCase() === userAddress.toLowerCase()
        )
    }, [logs])

    /**
     * Create activity log entry
     */
    const createActivityLog = useCallback((
        order: StoredOrder,
        action: "created" | "matched" | "payment_sent" | "completed" | "disputed" | "cancelled"
    ) => {
        return createOrderActivityLog(order, action)
    }, [])

    return {
        // Actions
        logTransaction,
        updateTransactionStatus,
        createActivityLog,

        // Queries
        getOrderLogs,
        getUserLogs,
        logs,

        // State
        isLogging,
    }
}
