import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/disputes/[id]/resolve
 * Manual dispute resolution for MVP (arbitrator only)
 * 
 * Body:
 * - decision: 'user_wins' | 'lp_wins'
 * - slashPercentage: 0 | 20 | 50 | 100
 * - notes: string
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    
    try {
        const body = await request.json()
        const { decision, slashPercentage, notes } = body

        // Validate input
        if (!decision || !['user_wins', 'lp_wins'].includes(decision)) {
            return NextResponse.json(
                { error: 'Invalid decision. Must be "user_wins" or "lp_wins"' },
                { status: 400 }
            )
        }

        if (slashPercentage !== undefined && ![0, 20, 50, 100].includes(slashPercentage)) {
            return NextResponse.json(
                { error: 'Invalid slash percentage. Must be 0, 20, 50, or 100' },
                { status: 400 }
            )
        }

        // In production, this would:
        // 1. Verify arbitrator authentication
        // 2. Call smart contract resolveDispute()
        // 3. Update database records
        // 4. Send notifications to both parties

        console.log(`[Dispute Resolution] Dispute ${id}:`, {
            decision,
            slashPercentage,
            notes
        })

        // Mock response for MVP
        const resolution = {
            disputeId: id,
            decision,
            slashPercentage: decision === 'user_wins' ? slashPercentage : 0,
            notes,
            resolvedAt: Date.now(),
            resolvedBy: 'arbitrator', // Would be actual arbitrator address
            
            // Actions taken
            actions: {
                fundsReleased: decision === 'user_wins',
                fundsRefunded: decision === 'lp_wins',
                lpSlashed: decision === 'user_wins' && slashPercentage > 0,
                lpBanned: slashPercentage === 100,
                userBanned: decision === 'lp_wins' // User loses = banned
            }
        }

        return NextResponse.json({
            success: true,
            resolution
        })

    } catch (error) {
        console.error('Error resolving dispute:', error)
        return NextResponse.json(
            { error: 'Failed to resolve dispute' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/disputes/[id]
 * Get single dispute details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    
    try {
        // Mock dispute data for MVP
        const dispute = {
            id,
            orderId: `0x${id}abc123def456`,
            status: 'pending',
            raisedBy: 'user',
            raisedAt: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
            
            amount: 50_000000, // $50 USDC
            lockedRate: 83.45,
            inrAmount: 4172.50,
            
            user: {
                address: '0x1234567890123456789012345678901234567890',
                totalOrders: 12,
                disputesRaised: 1,
                disputesLost: 0
            },
            lp: {
                address: '0x2345678901234567890123456789012345678901',
                name: 'LP Alpha',
                totalTrades: 89,
                disputesLost: 0,
                stake: 250_000000 // $250
            },
            
            evidence: {
                utrReference: 'UTR123456789012',
                explanation: 'I sent the payment via UPI but the LP is not confirming. Payment was sent at 2:30 PM IST. Amount was ₹4,173 to the provided UPI ID.',
                screenshots: [
                    { 
                        cid: 'QmExampleCid123', 
                        url: 'https://gateway.pinata.cloud/ipfs/QmExampleCid123' 
                    }
                ],
                submittedAt: Date.now() - (1.5 * 60 * 60 * 1000)
            }
        }

        return NextResponse.json(dispute)

    } catch (error) {
        console.error('Error fetching dispute:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dispute' },
            { status: 500 }
        )
    }
}
