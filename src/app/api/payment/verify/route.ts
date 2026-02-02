import { NextRequest, NextResponse } from 'next/server'
import { keccak256, stringToBytes } from 'viem'

/**
 * Payment Verification API
 * POST /api/payment/verify
 * 
 * Stores verification results and triggers auto-release if confidence is high
 */

// In-memory verification store (in production, use database)
const verificationStore = new Map<string, VerificationRecord>()

interface VerificationRecord {
    orderId: string
    utr: string
    utrHash: string
    confidence: number
    autoRelease: boolean
    requiresReview: boolean
    verified: boolean
    evidenceIPFS?: string
    createdAt: number
    reviewedAt?: number
    reviewedBy?: string
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, utr, timestamp, result } = body

        if (!orderId || !utr) {
            return NextResponse.json(
                { success: false, error: 'Missing orderId or utr' },
                { status: 400 }
            )
        }

        // Generate UTR hash for on-chain storage
        const utrHash = keccak256(stringToBytes(`${utr}:${result?.amount || 0}:${timestamp}`))

        // Create verification record
        const record: VerificationRecord = {
            orderId,
            utr,
            utrHash,
            confidence: result?.confidence || 0,
            autoRelease: result?.autoRelease || false,
            requiresReview: result?.requiresReview || false,
            verified: result?.verified || false,
            evidenceIPFS: result?.evidenceIPFS,
            createdAt: Date.now(),
        }

        // Store verification
        verificationStore.set(orderId, record)

        console.log(`[PaymentVerify] Order ${orderId}:`, {
            confidence: record.confidence,
            autoRelease: record.autoRelease,
            requiresReview: record.requiresReview,
        })

        // If auto-release, trigger escrow release
        if (record.autoRelease) {
            // In production, this would call the escrow contract
            console.log(`[PaymentVerify] Auto-releasing escrow for order ${orderId}`)

            // Update order status
            try {
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/orders`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId,
                        action: 'complete',
                    }),
                })
            } catch (e) {
                console.error('[PaymentVerify] Failed to update order:', e)
            }
        }

        return NextResponse.json({
            success: true,
            verification: record,
            message: record.autoRelease
                ? 'Payment verified and USDC auto-released'
                : record.requiresReview
                    ? 'Payment submitted for manual review'
                    : 'Verification failed, dispute may be created',
        })
    } catch (error) {
        console.error('[PaymentVerify] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Verification failed' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/payment/verify?orderId=xxx
 * Get verification status for an order
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
        return NextResponse.json(
            { success: false, error: 'Missing orderId' },
            { status: 400 }
        )
    }

    const record = verificationStore.get(orderId)

    if (!record) {
        return NextResponse.json(
            { success: false, error: 'Verification not found' },
            { status: 404 }
        )
    }

    return NextResponse.json({
        success: true,
        verification: record,
    })
}

/**
 * PATCH /api/payment/verify
 * Manual review decision
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, action, reviewerAddress } = body

        if (!orderId || !action) {
            return NextResponse.json(
                { success: false, error: 'Missing orderId or action' },
                { status: 400 }
            )
        }

        const record = verificationStore.get(orderId)

        if (!record) {
            return NextResponse.json(
                { success: false, error: 'Verification not found' },
                { status: 404 }
            )
        }

        if (!record.requiresReview) {
            return NextResponse.json(
                { success: false, error: 'This verification does not require review' },
                { status: 400 }
            )
        }

        record.reviewedAt = Date.now()
        record.reviewedBy = reviewerAddress

        if (action === 'approve') {
            record.verified = true
            record.autoRelease = true

            // Release escrow
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/orders`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    action: 'complete',
                }),
            })
        } else if (action === 'reject') {
            record.verified = false

            // Create dispute
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/orders`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    action: 'dispute',
                }),
            })
        }

        verificationStore.set(orderId, record)

        return NextResponse.json({
            success: true,
            verification: record,
            message: action === 'approve' ? 'Payment approved, USDC released' : 'Payment rejected, dispute created',
        })
    } catch (error) {
        console.error('[PaymentVerify] Review error:', error)
        return NextResponse.json(
            { success: false, error: 'Review failed' },
            { status: 500 }
        )
    }
}
