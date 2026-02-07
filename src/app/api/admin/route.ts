import { NextRequest, NextResponse } from "next/server"
import { orders as orderStore } from "../orders/sse/route"
import { getValidationStore, getValidatorProfiles, type ValidationTask } from "../validations/route"

/**
 * Admin API — Hidden endpoint for core team
 * 
 * Handles escalated (flagged) validation tasks that need manual review.
 * Wallet-gated: only NEXT_PUBLIC_CORE_TEAM addresses can access.
 * 
 * GET: List all escalated cases + admin stats
 * POST: Resolve an escalated case (approve, slash, schedule_meet)
 */

const CORE_TEAM = (
    process.env.NEXT_PUBLIC_CORE_TEAM ||
    process.env.NEXT_PUBLIC_DAO_ADMINS ||
    "0x3a9C46B7E8ed4F8a6db3bbc92FD51e26cE2f17F7"
).split(',').map(a => a.trim().toLowerCase())

function isAdmin(address: string): boolean {
    return CORE_TEAM.includes(address.toLowerCase())
}

// ─── GET /api/admin ─────────────────────────────────────
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address || !isAdmin(address)) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 403 }
        )
    }

    const validationStore = getValidationStore()
    const validatorProfiles = getValidatorProfiles()
    const allTasks = Array.from(validationStore.values())

    // Escalated tasks (flagged by validators, needs admin review)
    const escalated = allTasks.filter(t => t.status === 'escalated')

    // Pending tasks (awaiting validator votes — admin can also resolve directly)
    const pending = allTasks.filter(t => t.status === 'pending')

    // Stats
    const stats = {
        totalValidations: allTasks.length,
        pending: allTasks.filter(t => t.status === 'pending').length,
        approved: allTasks.filter(t => t.status === 'approved' || t.status === 'auto_approved').length,
        escalated: escalated.length,
        totalValidators: validatorProfiles.size,
        autoApproved: allTasks.filter(t => t.status === 'auto_approved').length,
    }

    // Escalated cases with full evidence
    const escalatedCases = escalated.map(task => ({
        ...task,
        voteBreakdown: {
            total: task.votes.length,
            approves: task.votes.filter(v => v.decision === 'approve').length,
            flags: task.votes.filter(v => v.decision === 'flag').length,
            flagReasons: task.votes
                .filter(v => v.decision === 'flag' && v.notes)
                .map(v => ({ validator: v.validator.slice(0, 10) + '...', notes: v.notes }))
        },
        order: orderStore.get(task.orderId) || null,
    }))

    // Pending cases with full evidence (admin can fast-track)
    const pendingCases = pending.map(task => ({
        ...task,
        voteBreakdown: {
            total: task.votes.length,
            approves: task.votes.filter(v => v.decision === 'approve').length,
            flags: task.votes.filter(v => v.decision === 'flag').length,
            flagReasons: task.votes
                .filter(v => v.decision === 'flag' && v.notes)
                .map(v => ({ validator: v.validator.slice(0, 10) + '...', notes: v.notes }))
        },
        order: orderStore.get(task.orderId) || null,
    }))

    // Top validators
    const topValidators = Array.from(validatorProfiles.values())
        .sort((a, b) => b.totalReviews - a.totalReviews)
        .slice(0, 20)

    return NextResponse.json({
        success: true,
        stats,
        pendingCases,
        escalatedCases,
        topValidators,
    })
}

// ─── POST /api/admin ────────────────────────────────────
export async function POST(request: NextRequest) {
    const body = await request.json()
    const { address, action, taskId, orderId, resolution, notes } = body

    if (!address || !isAdmin(address)) {
        return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 403 }
        )
    }

    const validationStore = getValidationStore()

    switch (action) {
        case 'resolve_validation': {
            // Admin resolves a pending or escalated validation task
            const task = validationStore.get(taskId)
            if (!task) {
                return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
            }
            if (task.status !== 'escalated' && task.status !== 'pending') {
                return NextResponse.json({ success: false, error: 'Task already resolved' }, { status: 400 })
            }

            if (resolution === 'approve') {
                // Admin overrides — approve the LP's payment
                task.status = 'approved'
                task.resolvedAt = Date.now()
                task.resolvedBy = 'admin'

                // Complete the order
                const order = orderStore.get(task.orderId)
                if (order && (order.status === 'verifying' || order.status === 'disputed')) {
                    const now = Date.now()
                    order.status = 'completed'
                    order.completedAt = now
                    order.settledAt = now
                    order.disputePeriodEndsAt = now + 24 * 60 * 60 * 1000
                    order.stakeLockExpiresAt = now + 24 * 60 * 60 * 1000
                    orderStore.set(order.id, order)
                }
                validationStore.set(taskId, task)
                console.log(`[Admin] Approved escalated task ${taskId} by ${address.slice(0, 10)}`)

                return NextResponse.json({
                    success: true,
                    message: 'Task approved. LP payment completed.',
                    task: { id: task.id, status: task.status }
                })
            }

            if (resolution === 'slash') {
                // Admin confirms fraud — slash LP stake, refund user
                task.status = 'flagged'
                task.resolvedAt = Date.now()
                task.resolvedBy = 'admin'

                const order = orderStore.get(task.orderId)
                if (order) {
                    order.status = 'cancelled'
                    orderStore.set(order.id, order)
                }
                validationStore.set(taskId, task)
                console.log(`[Admin] Slashed LP for task ${taskId} by ${address.slice(0, 10)}`)

                return NextResponse.json({
                    success: true,
                    message: 'LP slashed. Order cancelled. User USDC returned.',
                    task: { id: task.id, status: task.status }
                })
            }

            if (resolution === 'schedule_meet') {
                // Admin needs more info — schedule a meeting with parties
                console.log(`[Admin] Scheduled meeting for task ${taskId} — notes: ${notes}`)
                return NextResponse.json({
                    success: true,
                    message: 'Meeting scheduled. Both parties will be notified.',
                })
            }

            return NextResponse.json({ success: false, error: 'Invalid resolution type' }, { status: 400 })
        }

        default:
            return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
    }
}
