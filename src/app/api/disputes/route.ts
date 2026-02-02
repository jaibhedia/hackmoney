import { NextRequest, NextResponse } from 'next/server'

/**
 * Disputes API
 * Manages dispute creation, voting, and resolution
 */

// In-memory dispute store (in production, use database + blockchain)
const disputeStore = new Map<string, Dispute>()
let disputeCounter = 0

interface Dispute {
    id: string
    orderId: string
    buyer: string
    seller: string
    amount: number
    tier: 'auto' | 'community' | 'admin'
    status: 'open' | 'voting' | 'resolved' | 'escalated'
    reason: string
    buyerEvidence?: string    // IPFS hash
    sellerEvidence?: string   // IPFS hash
    arbitrators: string[]
    votes: Record<string, { favorBuyer: boolean; reasoning: string; votedAt: number }>
    votesForBuyer: number
    votesForSeller: number
    finalDecision?: 'buyer' | 'seller'
    createdAt: number
    votingDeadline?: number
    resolvedAt?: number
}

/**
 * GET /api/disputes
 * Get disputes (filtered by role)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const role = searchParams.get('role') // 'party', 'arbitrator', or 'all'
    const status = searchParams.get('status')

    let disputes = Array.from(disputeStore.values())

    // Filter by status
    if (status) {
        disputes = disputes.filter(d => d.status === status)
    }

    // Filter by role
    if (address && role === 'party') {
        disputes = disputes.filter(d =>
            d.buyer.toLowerCase() === address.toLowerCase() ||
            d.seller.toLowerCase() === address.toLowerCase()
        )
    } else if (address && role === 'arbitrator') {
        disputes = disputes.filter(d =>
            d.arbitrators.some(a => a.toLowerCase() === address.toLowerCase())
        )
    }

    return NextResponse.json({
        success: true,
        disputes,
        count: disputes.length,
    })
}

/**
 * POST /api/disputes
 * Create a new dispute
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, buyer, seller, amount, reason, tier = 'community' } = body

        if (!orderId || !buyer || !seller || !amount || !reason) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        disputeCounter++
        const disputeId = `dispute-${disputeCounter}-${Date.now()}`

        const dispute: Dispute = {
            id: disputeId,
            orderId,
            buyer,
            seller,
            amount,
            tier,
            status: 'open',
            reason,
            arbitrators: [],
            votes: {},
            votesForBuyer: 0,
            votesForSeller: 0,
            createdAt: Date.now(),
        }

        // For community tier, select arbitrators
        if (tier === 'community') {
            dispute.arbitrators = await selectArbitrators(buyer, seller)
            if (dispute.arbitrators.length >= 3) {
                dispute.status = 'voting'
                dispute.votingDeadline = Date.now() + (4 * 60 * 60 * 1000) // 4 hours
            }
        }

        disputeStore.set(disputeId, dispute)

        console.log(`[Disputes] Created dispute ${disputeId} for order ${orderId}`)

        return NextResponse.json({
            success: true,
            dispute,
        })
    } catch (error) {
        console.error('[Disputes] Create error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create dispute' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/disputes
 * Update dispute (submit evidence, vote, resolve)
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json()
        const { disputeId, action, arbitratorAddress, ...data } = body

        if (!disputeId || !action) {
            return NextResponse.json(
                { success: false, error: 'Missing disputeId or action' },
                { status: 400 }
            )
        }

        const dispute = disputeStore.get(disputeId)
        if (!dispute) {
            return NextResponse.json(
                { success: false, error: 'Dispute not found' },
                { status: 404 }
            )
        }

        switch (action) {
            case 'submit_evidence': {
                const { party, evidenceHash } = data
                if (party === 'buyer') {
                    dispute.buyerEvidence = evidenceHash
                } else if (party === 'seller') {
                    dispute.sellerEvidence = evidenceHash
                }
                break
            }

            case 'start_voting': {
                if (dispute.status !== 'open') {
                    return NextResponse.json(
                        { success: false, error: 'Cannot start voting in current status' },
                        { status: 400 }
                    )
                }
                dispute.status = 'voting'
                dispute.votingDeadline = Date.now() + (4 * 60 * 60 * 1000)
                break
            }

            case 'vote': {
                if (!arbitratorAddress) {
                    return NextResponse.json(
                        { success: false, error: 'Missing arbitratorAddress' },
                        { status: 400 }
                    )
                }
                if (dispute.status !== 'voting') {
                    return NextResponse.json(
                        { success: false, error: 'Voting not open' },
                        { status: 400 }
                    )
                }
                if (dispute.votes[arbitratorAddress]) {
                    return NextResponse.json(
                        { success: false, error: 'Already voted' },
                        { status: 400 }
                    )
                }
                if (!dispute.arbitrators.includes(arbitratorAddress)) {
                    return NextResponse.json(
                        { success: false, error: 'Not an arbitrator for this dispute' },
                        { status: 403 }
                    )
                }

                const { favorBuyer, reasoning } = data
                dispute.votes[arbitratorAddress] = {
                    favorBuyer,
                    reasoning,
                    votedAt: Date.now(),
                }

                if (favorBuyer) {
                    dispute.votesForBuyer++
                } else {
                    dispute.votesForSeller++
                }

                // Check if we have enough votes to resolve
                const totalVotes = dispute.votesForBuyer + dispute.votesForSeller
                if (totalVotes >= 3) {
                    resolveDispute(dispute)
                }
                break
            }

            case 'admin_resolve': {
                // Admin can force resolve
                const { favorBuyer } = data
                dispute.finalDecision = favorBuyer ? 'buyer' : 'seller'
                dispute.status = 'resolved'
                dispute.resolvedAt = Date.now()

                // Update order status
                await updateOrderFromDispute(dispute.orderId, dispute.finalDecision)
                break
            }

            case 'escalate': {
                dispute.status = 'escalated'
                dispute.tier = 'admin'
                break
            }

            default:
                return NextResponse.json(
                    { success: false, error: `Unknown action: ${action}` },
                    { status: 400 }
                )
        }

        disputeStore.set(disputeId, dispute)

        return NextResponse.json({
            success: true,
            dispute,
        })
    } catch (error) {
        console.error('[Disputes] Update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update dispute' },
            { status: 500 }
        )
    }
}

// Helper functions

async function selectArbitrators(buyer: string, seller: string): Promise<string[]> {
    // In production, this would query the DisputeDAO contract
    // For now, return mock arbitrators
    // TODO: Integrate with actual arbitrator registry
    return [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222',
        '0x3333333333333333333333333333333333333333',
    ]
}

function resolveDispute(dispute: Dispute) {
    const buyerWins = dispute.votesForBuyer > dispute.votesForSeller
    dispute.finalDecision = buyerWins ? 'buyer' : 'seller'
    dispute.status = 'resolved'
    dispute.resolvedAt = Date.now()

    // Update order status
    updateOrderFromDispute(dispute.orderId, dispute.finalDecision)

    console.log(`[Disputes] Resolved ${dispute.id}: ${dispute.finalDecision} wins`)
}

async function updateOrderFromDispute(orderId: string, winner: 'buyer' | 'seller') {
    try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/orders`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId,
                action: winner === 'buyer' ? 'complete' : 'cancel',
                disputeResolved: true,
            }),
        })
    } catch (error) {
        console.error('[Disputes] Failed to update order:', error)
    }
}
