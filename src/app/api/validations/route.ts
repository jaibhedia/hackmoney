import { NextRequest, NextResponse } from "next/server"
import { orders as orderStore } from "../orders/sse/route"

/**
 * DAO Validation API
 * 
 * Open pool model: ALL Gold+ stakers see ALL pending validations.
 * Any validator can review — first 3 votes resolve the task.
 * Majority approve → LP gets paid. Majority flag → escalated to admin.
 * Validators earn $0.05 USDC per review.
 */

// ─── Config ─────────────────────────────────────────────
const VALIDATION_THRESHOLD = Number(process.env.NEXT_PUBLIC_VALIDATION_THRESHOLD || "3")
const VALIDATOR_REWARD = Number(process.env.NEXT_PUBLIC_VALIDATOR_REWARD || "0.05")
const VALIDATION_TIMEOUT_MS = 60 * 60 * 1000 // 1 hour auto-approve

// Core team addresses for admin escalation
const CORE_TEAM = (
    process.env.NEXT_PUBLIC_CORE_TEAM ||
    process.env.NEXT_PUBLIC_DAO_ADMINS ||
    "0x3a9C46B7E8ed4F8a6db3bbc92FD51e26cE2f17F7"
).split(',').map(a => a.trim().toLowerCase())

// ─── Types ──────────────────────────────────────────────
export interface ValidationVote {
    validator: string
    decision: 'approve' | 'flag'
    notes?: string
    votedAt: number
}

export interface ValidationTask {
    id: string
    orderId: string
    status: 'pending' | 'approved' | 'flagged' | 'escalated' | 'auto_approved'
    // Evidence snapshot (frozen at creation time)
    evidence: {
        userQrImage?: string      // User's UPI QR (base64)
        userAddress: string
        lpScreenshot?: string     // LP's payment proof (base64)
        lpAddress: string
        amountUsdc: number
        amountFiat: number
        fiatCurrency: string
        paymentMethod: string
    }
    votes: ValidationVote[]
    threshold: number
    createdAt: number
    deadline: number           // 1hr from creation
    resolvedAt?: number
    resolvedBy?: string        // 'dao' | 'admin' | 'timeout'
}

// Validator earnings tracker
export interface ValidatorProfile {
    address: string
    totalReviews: number
    totalEarned: number        // In USDC
    approvals: number
    flags: number
    accuracy: number           // % of votes that matched majority
    lastReviewAt?: number
}

// ─── In-Memory Stores ───────────────────────────────────
const validationStore = new Map<string, ValidationTask>()
const validatorProfiles = new Map<string, ValidatorProfile>()
let validationCounter = 0

// Registry of Gold+ staker addresses (updated by staking actions)
// In production this would read from contract
const validatorRegistry = new Set<string>()

/**
 * Register a Gold+ staker as validator
 * Called externally when someone stakes to Gold+ tier
 */
export function registerValidator(address: string) {
    validatorRegistry.add(address.toLowerCase())
}

export function unregisterValidator(address: string) {
    validatorRegistry.delete(address.toLowerCase())
}

export function isValidator(address: string): boolean {
    return validatorRegistry.has(address.toLowerCase())
}

export function getValidationStore() {
    return validationStore
}

export function getValidatorProfiles() {
    return validatorProfiles
}

/**
 * Create a validation task for an order entering "verifying" status.
 * Called from orders API when LP submits payment proof.
 */
export function createValidationTask(order: {
    id: string
    qrImage?: string
    userAddress: string
    lpPaymentProof?: string
    solverAddress?: string
    amountUsdc: number
    amountFiat: number
    fiatCurrency: string
    paymentMethod: string
}): ValidationTask {
    validationCounter++
    const taskId = `val-${validationCounter}-${Date.now()}`

    const task: ValidationTask = {
        id: taskId,
        orderId: order.id,
        status: 'pending',
        evidence: {
            userQrImage: order.qrImage,
            userAddress: order.userAddress,
            lpScreenshot: order.lpPaymentProof,
            lpAddress: order.solverAddress || '',
            amountUsdc: order.amountUsdc,
            amountFiat: order.amountFiat,
            fiatCurrency: order.fiatCurrency,
            paymentMethod: order.paymentMethod,
        },
        votes: [],
        threshold: VALIDATION_THRESHOLD,
        createdAt: Date.now(),
        deadline: Date.now() + VALIDATION_TIMEOUT_MS,
    }

    validationStore.set(taskId, task)
    console.log(`[Validation] Created task ${taskId} for order ${order.id}`)
    return task
}

/**
 * Check and resolve timed-out validations
 */
function checkTimeouts() {
    const now = Date.now()
    validationStore.forEach((task) => {
        if (task.status === 'pending' && now > task.deadline) {
            // Auto-approve on timeout (prevents stuck orders)
            task.status = 'auto_approved'
            task.resolvedAt = now
            task.resolvedBy = 'timeout'
            completeOrder(task.orderId)
            console.log(`[Validation] Auto-approved task ${task.id} (timeout)`)
        }
    })
}

/**
 * Complete order after validation approval
 */
function completeOrder(orderId: string) {
    const order = orderStore.get(orderId)
    if (!order || order.status !== 'verifying') return

    const now = Date.now()
    order.status = 'completed'
    order.completedAt = now
    order.settledAt = now
    order.disputePeriodEndsAt = now + 24 * 60 * 60 * 1000
    order.stakeLockExpiresAt = now + 24 * 60 * 60 * 1000
    orderStore.set(orderId, order)
    console.log(`[Validation] Order ${orderId} completed after DAO approval`)
}

/**
 * Freeze order after validation flagging (escalate to admin)
 */
function freezeOrder(orderId: string) {
    const order = orderStore.get(orderId)
    if (!order) return

    order.status = 'disputed'
    orderStore.set(orderId, order)
    console.log(`[Validation] Order ${orderId} frozen — escalated to admin`)
}

/**
 * Credit validator reward
 */
function creditValidator(address: string) {
    const addr = address.toLowerCase()
    const profile = validatorProfiles.get(addr) || {
        address: addr,
        totalReviews: 0,
        totalEarned: 0,
        approvals: 0,
        flags: 0,
        accuracy: 100,
    }
    profile.totalReviews++
    profile.totalEarned += VALIDATOR_REWARD
    profile.lastReviewAt = Date.now()
    validatorProfiles.set(addr, profile)
}

/**
 * Update validator accuracy based on final outcome
 */
function updateAccuracy(task: ValidationTask) {
    const finalDecision = task.status // 'approved' or 'flagged'/'escalated'
    const isApproved = finalDecision === 'approved' || finalDecision === 'auto_approved'

    task.votes.forEach(vote => {
        const addr = vote.validator.toLowerCase()
        const profile = validatorProfiles.get(addr)
        if (!profile) return

        const votedCorrectly = isApproved
            ? vote.decision === 'approve'
            : vote.decision === 'flag'

        if (vote.decision === 'approve') profile.approvals++
        else profile.flags++

        // Recalculate accuracy
        const totalDecisions = profile.approvals + profile.flags
        const correct = votedCorrectly
            ? Math.round(profile.accuracy * (totalDecisions - 1) / 100) + 1
            : Math.round(profile.accuracy * (totalDecisions - 1) / 100)
        profile.accuracy = totalDecisions > 0 ? Math.round((correct / totalDecisions) * 100) : 100

        validatorProfiles.set(addr, profile)
    })
}


// ─── GET /api/validations ───────────────────────────────
// Returns all pending validations for any Gold+ validator
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const includeResolved = searchParams.get('resolved') === 'true'

    // Run timeout checks
    checkTimeouts()

    let tasks = Array.from(validationStore.values())

    if (!includeResolved) {
        tasks = tasks.filter(t => t.status === 'pending')
    }

    // If address provided, exclude tasks where caller is buyer or seller
    if (address) {
        const addr = address.toLowerCase()
        tasks = tasks.filter(t =>
            t.evidence.userAddress.toLowerCase() !== addr &&
            t.evidence.lpAddress.toLowerCase() !== addr
        )
    }

    // Mark which ones this validator already voted on
    const tasksWithMeta = tasks.map(t => ({
        ...t,
        // Strip large base64 from list view for performance
        evidence: {
            ...t.evidence,
            userQrImage: t.evidence.userQrImage ? '[has_image]' : undefined,
            lpScreenshot: t.evidence.lpScreenshot ? '[has_image]' : undefined,
        },
        myVote: address
            ? t.votes.find(v => v.validator.toLowerCase() === address.toLowerCase())?.decision || null
            : null,
        votesCount: t.votes.length,
        approvesCount: t.votes.filter(v => v.decision === 'approve').length,
        flagsCount: t.votes.filter(v => v.decision === 'flag').length,
    }))

    // Validator profile
    const profile = address
        ? validatorProfiles.get(address.toLowerCase()) || null
        : null

    return NextResponse.json({
        success: true,
        validations: tasksWithMeta,
        count: tasksWithMeta.length,
        profile,
        config: {
            threshold: VALIDATION_THRESHOLD,
            rewardPerReview: VALIDATOR_REWARD,
            timeoutMs: VALIDATION_TIMEOUT_MS,
        }
    })
}

// ─── GET single validation with full evidence ───────────
// (accessed via query param ?id=xxx)
export async function POST(request: NextRequest) {
    const body = await request.json()

    // If body has `action: 'get_detail'`, return full task with images
    if (body.action === 'get_detail') {
        const task = validationStore.get(body.taskId)
        if (!task) {
            return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true, validation: task })
    }

    // Otherwise this is a vote submission
    const { taskId, validator, decision, notes } = body

    if (!taskId || !validator || !decision) {
        return NextResponse.json(
            { success: false, error: 'Missing taskId, validator, or decision' },
            { status: 400 }
        )
    }

    if (!['approve', 'flag'].includes(decision)) {
        return NextResponse.json(
            { success: false, error: 'Decision must be "approve" or "flag"' },
            { status: 400 }
        )
    }

    const task = validationStore.get(taskId)
    if (!task) {
        return NextResponse.json(
            { success: false, error: 'Validation task not found' },
            { status: 404 }
        )
    }

    if (task.status !== 'pending') {
        return NextResponse.json(
            { success: false, error: 'Task already resolved' },
            { status: 400 }
        )
    }

    // Can't vote on own order
    const addr = validator.toLowerCase()
    if (addr === task.evidence.userAddress.toLowerCase() || addr === task.evidence.lpAddress.toLowerCase()) {
        return NextResponse.json(
            { success: false, error: 'Cannot validate your own order' },
            { status: 403 }
        )
    }

    // Can't vote twice
    if (task.votes.some(v => v.validator.toLowerCase() === addr)) {
        return NextResponse.json(
            { success: false, error: 'Already voted on this task' },
            { status: 400 }
        )
    }

    // Record vote
    const vote: ValidationVote = {
        validator: addr,
        decision,
        notes,
        votedAt: Date.now(),
    }
    task.votes.push(vote)

    // Credit reward immediately
    creditValidator(addr)

    console.log(`[Validation] Vote on ${taskId}: ${decision} by ${addr.slice(0, 8)}... (${task.votes.length}/${task.threshold})`)

    // Check if threshold reached
    let resolved = false
    if (task.votes.length >= task.threshold) {
        const approves = task.votes.filter(v => v.decision === 'approve').length
        const flags = task.votes.filter(v => v.decision === 'flag').length

        if (approves > flags) {
            // Majority approve → complete order
            task.status = 'approved'
            task.resolvedAt = Date.now()
            task.resolvedBy = 'dao'
            completeOrder(task.orderId)
            resolved = true
            console.log(`[Validation] Task ${taskId} APPROVED (${approves}/${task.votes.length})`)
        } else {
            // Majority flag → escalate to admin
            task.status = 'escalated'
            task.resolvedAt = Date.now()
            task.resolvedBy = 'dao'
            freezeOrder(task.orderId)
            resolved = true
            console.log(`[Validation] Task ${taskId} ESCALATED (${flags}/${task.votes.length} flags)`)
        }

        if (resolved) {
            updateAccuracy(task)
        }
    }

    validationStore.set(taskId, task)

    return NextResponse.json({
        success: true,
        vote,
        task: {
            id: task.id,
            status: task.status,
            votesCount: task.votes.length,
            approvesCount: task.votes.filter(v => v.decision === 'approve').length,
            flagsCount: task.votes.filter(v => v.decision === 'flag').length,
            threshold: task.threshold,
            resolved,
        },
        reward: VALIDATOR_REWARD,
    })
}
