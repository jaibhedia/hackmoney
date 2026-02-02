import { NextRequest, NextResponse } from 'next/server'
import { FraudDetector, type OrderAnalysisData, type UserHistory } from '@/lib/fraud-detection'

/**
 * Fraud Analysis API
 * POST /api/fraud/analyze
 * 
 * Analyzes trade risk before order creation
 */

// Mock user history storage (in production, use database)
const userHistoryCache = new Map<string, UserHistory>()

/**
 * Get or create user history
 */
function getUserHistory(userAddress: string): UserHistory {
    const existing = userHistoryCache.get(userAddress.toLowerCase())
    if (existing) {
        return existing
    }

    // Default history for new users
    const newHistory: UserHistory = {
        ordersLastHour: 0,
        ordersLast24h: 0,
        averageOrderAmount: 0,
        completedOrders: 0,
        totalVolume: 0,
        disputeCount: 0,
        walletCreatedAt: Date.now() - (7 * 24 * 60 * 60 * 1000), // Default: 7 days ago
    }

    userHistoryCache.set(userAddress.toLowerCase(), newHistory)
    return newHistory
}

/**
 * Update user history after order
 */
export function updateUserHistory(
    userAddress: string,
    orderAmount: number,
    completed: boolean = false,
    dispute: boolean = false
) {
    const history = getUserHistory(userAddress)

    history.ordersLastHour++
    history.ordersLast24h++

    if (completed) {
        history.completedOrders++
        history.totalVolume += orderAmount
        history.averageOrderAmount = history.totalVolume / history.completedOrders
    }

    if (dispute) {
        history.disputeCount++
    }

    userHistoryCache.set(userAddress.toLowerCase(), history)
}

/**
 * Reset hourly counters (call via cron)
 */
export function resetHourlyCounters() {
    userHistoryCache.forEach((history, address) => {
        history.ordersLastHour = 0
        userHistoryCache.set(address, history)
    })
}

/**
 * Reset daily counters (call via cron)
 */
export function resetDailyCounters() {
    userHistoryCache.forEach((history, address) => {
        history.ordersLast24h = 0
        userHistoryCache.set(address, history)
    })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderData, userAddress } = body

        if (!orderData || !userAddress) {
            return NextResponse.json(
                { success: false, error: 'Missing orderData or userAddress' },
                { status: 400 }
            )
        }

        // Get user history
        const userHistory = getUserHistory(userAddress)

        // Get IP address from request headers
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown'

        // Prepare order data for analysis
        const analysisData: OrderAnalysisData = {
            amountUsdc: orderData.amountUsdc,
            paymentMethod: orderData.paymentMethod || 'upi',
            fiatCurrency: orderData.fiatCurrency || 'INR',
            userAddress,
            ipAddress,
            deviceId: orderData.deviceId,
        }

        // Run fraud analysis
        const detector = new FraudDetector()
        const assessment = await detector.analyzeTrade(analysisData, userHistory)

        // Log the analysis (for monitoring)
        console.log(`[Fraud] Analysis for ${userAddress}:`, {
            riskScore: assessment.riskScore,
            riskLevel: assessment.riskLevel,
            blocked: assessment.blocked,
            actions: assessment.requiredActions,
        })

        return NextResponse.json({
            success: true,
            ...assessment,
        })
    } catch (error) {
        console.error('[Fraud] Analysis failed:', error)
        return NextResponse.json(
            { success: false, error: 'Fraud analysis failed' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/fraud/analyze?address=0x...
 * Get user's current risk profile
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
        return NextResponse.json(
            { success: false, error: 'Missing address parameter' },
            { status: 400 }
        )
    }

    const history = getUserHistory(address)

    return NextResponse.json({
        success: true,
        history,
    })
}
