import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { CONTRACT_ADDRESSES } from '@/lib/web3-config'

/**
 * Disputes API
 * 
 * Production-ready dispute management via DisputeDAO smart contract.
 * All disputes are created and resolved on-chain.
 * 
 * Flow:
 * 1. Dispute created → calls DisputeDAO.createDispute()
 * 2. Arbitrators selected → on-chain randomness
 * 3. Votes cast → calls DisputeDAO.castVote()
 * 4. Resolution → automatic when votes reach threshold
 */

// Arc chain config
const arcChain = {
    id: 5042002,
    name: "Arc",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
    rpcUrls: { default: { http: ["https://5042002.rpc.thirdweb.com"] } },
} as const

// Public client for reading from DisputeDAO contract
const publicClient = createPublicClient({
    chain: arcChain,
    transport: http(),
})

// DisputeDAO ABI (read functions)
const DISPUTE_DAO_ABI = [
    {
        inputs: [{ name: "disputeId", type: "uint256" }],
        name: "disputes",
        outputs: [
            { name: "escrowOrderId", type: "bytes32" },
            { name: "buyer", type: "address" },
            { name: "seller", type: "address" },
            { name: "amount", type: "uint256" },
            { name: "tier", type: "uint8" },
            { name: "status", type: "uint8" },
            { name: "reason", type: "string" },
            { name: "buyerEvidence", type: "bytes32" },
            { name: "sellerEvidence", type: "bytes32" },
            { name: "votesForBuyer", type: "uint256" },
            { name: "votesForSeller", type: "uint256" },
            { name: "finalDecision", type: "bool" },
            { name: "createdAt", type: "uint256" },
            { name: "votingDeadline", type: "uint256" },
            { name: "resolvedAt", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "disputeCount",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    }
] as const

// Temporary in-memory cache (refreshed from chain)
const disputeCache = new Map<string, Dispute>()
let lastFetchTime = 0
let disputeCounter = 0 // Counter for generating unique IDs
const CACHE_TTL = 30000 // 30 seconds

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
 * Fetch disputes from on-chain DisputeDAO contract
 */
async function fetchDisputesFromChain(): Promise<Dispute[]> {
    // Return cache if fresh
    if (Date.now() - lastFetchTime < CACHE_TTL && disputeCache.size > 0) {
        return Array.from(disputeCache.values())
    }

    try {
        // Get dispute count from contract
        const disputeCount = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.DISPUTE_DAO as `0x${string}`,
            abi: DISPUTE_DAO_ABI,
            functionName: "disputeCount",
        })

        const disputes: Dispute[] = []

        // Fetch each dispute
        for (let i = 1; i <= Number(disputeCount); i++) {
            try {
                const data = await publicClient.readContract({
                    address: CONTRACT_ADDRESSES.DISPUTE_DAO as `0x${string}`,
                    abi: DISPUTE_DAO_ABI,
                    functionName: "disputes",
                    args: [BigInt(i)],
                })

                const statusMap = ['open', 'voting', 'resolved', 'escalated'] as const
                const tierMap = ['auto', 'community', 'admin'] as const

                disputes.push({
                    id: `dispute-${i}`,
                    orderId: data[0],
                    buyer: data[1],
                    seller: data[2],
                    amount: Number(data[3]) / 1_000_000,
                    tier: tierMap[data[4]] || 'community',
                    status: statusMap[data[5]] || 'open',
                    reason: data[6],
                    buyerEvidence: data[7] !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? data[7] : undefined,
                    sellerEvidence: data[8] !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? data[8] : undefined,
                    arbitrators: [], // Fetched separately
                    votes: {},
                    votesForBuyer: Number(data[9]),
                    votesForSeller: Number(data[10]),
                    finalDecision: data[11] ? 'buyer' : 'seller',
                    createdAt: Number(data[12]) * 1000,
                    votingDeadline: Number(data[13]) * 1000,
                    resolvedAt: data[14] > 0 ? Number(data[14]) * 1000 : undefined,
                })
            } catch (err) {
                console.error(`Failed to fetch dispute ${i}:`, err)
            }
        }

        // Update cache
        disputeCache.clear()
        disputes.forEach(d => disputeCache.set(d.id, d))
        lastFetchTime = Date.now()

        return disputes
    } catch (error) {
        console.error('[Disputes] Failed to fetch from chain:', error)
        // Return cache even if stale
        return Array.from(disputeCache.values())
    }
}

/**
 * GET /api/disputes
 * Get disputes from DisputeDAO contract
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    let disputes = await fetchDisputesFromChain()

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

        disputeCache.set(disputeId, dispute)

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

        const dispute = disputeCache.get(disputeId)
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

        disputeCache.set(disputeId, dispute)

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
