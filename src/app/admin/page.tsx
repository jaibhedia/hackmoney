"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Shield, ShieldAlert, AlertTriangle, CheckCircle, XCircle,
    Loader2, Eye, Users, DollarSign, Clock, ThumbsUp, ThumbsDown,
    ImageIcon, RefreshCw, Ban, Calendar, TrendingUp, Activity
} from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { Badge } from "@/components/ui/badge"
import { WalletConnect } from "@/components/app/wallet-connect"

/**
 * Hidden Admin Panel — /admin
 * 
 * Outside (app) layout group — no bottom nav.
 * Wallet-gated: only NEXT_PUBLIC_CORE_TEAM addresses.
 * 
 * Shows: escalated validation tasks, disputed orders, validator stats.
 * Actions: approve, slash LP, schedule meeting.
 */

const CORE_TEAM = (
    process.env.NEXT_PUBLIC_CORE_TEAM ||
    process.env.NEXT_PUBLIC_DAO_ADMINS ||
    "0x3a9C46B7E8ed4F8a6db3bbc92FD51e26cE2f17F7"
).split(',').map(a => a.trim().toLowerCase())

interface EscalatedCase {
    id: string
    orderId: string
    status: string
    evidence: {
        userQrImage?: string
        userAddress: string
        lpScreenshot?: string
        lpAddress: string
        amountUsdc: number
        amountFiat: number
        fiatCurrency: string
        paymentMethod: string
    }
    votes: { validator: string; decision: string; notes?: string; votedAt: number }[]
    voteBreakdown: {
        total: number
        approves: number
        flags: number
        flagReasons: { validator: string; notes?: string }[]
    }
    createdAt: number
    deadline: number
    order: any
}

interface Stats {
    totalValidations: number
    pending: number
    approved: number
    escalated: number
    totalValidators: number
    autoApproved: number
}

interface ValidatorInfo {
    address: string
    totalReviews: number
    totalEarned: number
    approvals: number
    flags: number
    accuracy: number
}

export default function AdminPage() {
    const { isConnected, address } = useWallet()
    const [mounted, setMounted] = useState(false)
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [stats, setStats] = useState<Stats | null>(null)
    const [pendingCases, setPendingCases] = useState<EscalatedCase[]>([])
    const [escalatedCases, setEscalatedCases] = useState<EscalatedCase[]>([])
    const [topValidators, setTopValidators] = useState<ValidatorInfo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCase, setSelectedCase] = useState<EscalatedCase | null>(null)
    const [resolving, setResolving] = useState(false)
    const [tab, setTab] = useState<'pending' | 'escalated' | 'validators'>('pending')

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (address) {
            setIsAuthorized(CORE_TEAM.includes(address.toLowerCase()))
        }
    }, [address])

    const fetchData = useCallback(async () => {
        if (!address || !isAuthorized) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/admin?address=${address}`)
            const data = await res.json()
            if (data.success) {
                setStats(data.stats)
                setPendingCases(data.pendingCases || [])
                setEscalatedCases(data.escalatedCases || [])
                setTopValidators(data.topValidators || [])
            }
        } catch (err) {
            console.error('Failed to fetch admin data:', err)
        } finally {
            setIsLoading(false)
        }
    }, [address, isAuthorized])

    useEffect(() => {
        if (isAuthorized) {
            fetchData()
            const interval = setInterval(fetchData, 15000)
            return () => clearInterval(interval)
        }
    }, [isAuthorized, fetchData])

    const resolveCase = async (taskId: string, resolution: 'approve' | 'slash' | 'schedule_meet') => {
        if (!address) return
        setResolving(true)
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    action: 'resolve_validation',
                    taskId,
                    resolution,
                })
            })
            const data = await res.json()
            if (data.success) {
                setSelectedCase(null)
                fetchData()
            } else {
                alert(data.error || 'Failed')
            }
        } catch (err) {
            alert('Network error')
        } finally {
            setResolving(false)
        }
    }

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
        )
    }

    // Gate: not connected
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-surface border border-border p-8 text-center max-w-md">
                    <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-text-primary mb-2 font-mono">ADMIN ACCESS</h1>
                    <p className="text-text-secondary mb-6 text-sm">Core team wallet required.</p>
                    <WalletConnect />
                </div>
            </div>
        )
    }

    // Gate: not authorized
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-surface border border-red-500/30 p-8 text-center max-w-md">
                    <Ban className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-red-400 mb-2 font-mono">UNAUTHORIZED</h1>
                    <p className="text-text-secondary text-sm mb-2">
                        Wallet <span className="font-mono text-brand">{address?.slice(0, 10)}...</span> is not in the core team list.
                    </p>
                    <p className="text-text-secondary text-xs">
                        Contact the team lead to get your wallet whitelisted.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-red-500/20 p-4 sticky top-0 bg-background/95 backdrop-blur-md z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-red-400" />
                        <div>
                            <h1 className="text-lg font-bold text-white font-mono uppercase">Admin Panel</h1>
                            <p className="text-[10px] text-red-400/80 uppercase tracking-wider font-mono">
                                Core Team Only &bull; {address?.slice(0, 8)}...
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        className="p-2 text-text-secondary hover:text-white transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <StatCard label="Total Validations" value={stats.totalValidations} icon={<Activity className="w-4 h-4" />} />
                        <StatCard label="Pending" value={stats.pending} icon={<Clock className="w-4 h-4" />} color="yellow" />
                        <StatCard label="Escalated" value={stats.escalated} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
                        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle className="w-4 h-4" />} color="green" />
                        <StatCard label="Auto-Approved" value={stats.autoApproved} icon={<Clock className="w-4 h-4" />} color="blue" />
                        <StatCard label="Validators" value={stats.totalValidators} icon={<Users className="w-4 h-4" />} color="purple" />
                        <StatCard label="Success Rate" value={stats.totalValidations > 0 ? `${Math.round((stats.approved / (stats.totalValidations || 1)) * 100)}%` : 'N/A'} icon={<TrendingUp className="w-4 h-4" />} color="green" />
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-border pb-2">
                    {[
                        { key: 'pending', label: 'Pending', count: pendingCases.length },
                        { key: 'escalated', label: 'Escalated', count: escalatedCases.length },
                        { key: 'validators', label: 'Validators', count: topValidators.length },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key as typeof tab)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                tab === t.key
                                    ? 'text-brand border-b-2 border-brand'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
                    </div>
                ) : (
                    <>
                        {/* Pending Validations */}
                        {tab === 'pending' && (
                            <div className="space-y-3">
                                {pendingCases.length === 0 ? (
                                    <div className="bg-surface border border-border p-8 text-center">
                                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                        <h3 className="font-bold text-text-primary mb-2">No Pending Validations</h3>
                                        <p className="text-text-secondary text-sm">All validations have been processed.</p>
                                    </div>
                                ) : pendingCases.map(c => (
                                    <div key={c.id} className="bg-surface border border-yellow-500/20 p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <span className="text-xs text-yellow-400 font-mono uppercase">
                                                    Pending &bull; {c.id.slice(0, 12)}
                                                </span>
                                                <div className="text-lg font-bold text-text-primary mt-1">
                                                    ${c.evidence.amountUsdc.toFixed(2)} USDC
                                                </div>
                                            </div>
                                            <Badge className="bg-yellow-500/20 text-yellow-400">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Awaiting Votes
                                            </Badge>
                                        </div>

                                        {/* Vote progress */}
                                        <div className="bg-background border border-border p-3 mb-3">
                                            <div className="text-xs text-text-secondary mb-2">Validator Votes ({c.voteBreakdown.approves + c.voteBreakdown.flags}/3 threshold)</div>
                                            <div className="flex gap-4 text-sm">
                                                <span className="text-green-400">
                                                    <ThumbsUp className="w-3 h-3 inline mr-1" />
                                                    {c.voteBreakdown.approves} approve
                                                </span>
                                                <span className="text-red-400">
                                                    <ThumbsDown className="w-3 h-3 inline mr-1" />
                                                    {c.voteBreakdown.flags} flag
                                                </span>
                                            </div>
                                        </div>

                                        {/* Evidence thumbnails */}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="bg-background border border-border p-2 text-center">
                                                <div className="text-[10px] text-text-secondary uppercase mb-1">User QR</div>
                                                {c.evidence.userQrImage ? (
                                                    <img src={c.evidence.userQrImage} alt="QR" className="w-full h-24 object-contain bg-white rounded" />
                                                ) : (
                                                    <div className="h-24 flex items-center justify-center text-xs text-text-secondary">None</div>
                                                )}
                                            </div>
                                            <div className="bg-background border border-border p-2 text-center">
                                                <div className="text-[10px] text-text-secondary uppercase mb-1">LP Proof</div>
                                                {c.evidence.lpScreenshot ? (
                                                    <img src={c.evidence.lpScreenshot} alt="Proof" className="w-full h-24 object-contain bg-white rounded" />
                                                ) : (
                                                    <div className="h-24 flex items-center justify-center text-xs text-text-secondary">None</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Addresses */}
                                        <div className="text-xs text-text-secondary space-y-1 mb-3">
                                            <div>User: <span className="font-mono text-text-primary">{c.evidence.userAddress}</span></div>
                                            <div>LP: <span className="font-mono text-text-primary">{c.evidence.lpAddress}</span></div>
                                        </div>

                                        {/* Admin action buttons */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => resolveCase(c.id, 'approve')}
                                                disabled={resolving}
                                                className="py-2 bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => resolveCase(c.id, 'slash')}
                                                disabled={resolving}
                                                className="py-2 bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                <XCircle className="w-3 h-3" />
                                                Slash LP
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Escalated Cases */}
                        {tab === 'escalated' && (
                            <div className="space-y-3">
                                {escalatedCases.length === 0 ? (
                                    <div className="bg-surface border border-border p-8 text-center">
                                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                        <h3 className="font-bold text-text-primary mb-2">No Escalated Cases</h3>
                                        <p className="text-text-secondary text-sm">All validations resolved by DAO.</p>
                                    </div>
                                ) : escalatedCases.map(c => (
                                    <div key={c.id} className="bg-surface border border-red-500/20 p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <span className="text-xs text-red-400 font-mono uppercase">
                                                    Escalated &bull; {c.id.slice(0, 12)}
                                                </span>
                                                <div className="text-lg font-bold text-text-primary mt-1">
                                                    ${c.evidence.amountUsdc.toFixed(2)} USDC
                                                </div>
                                            </div>
                                            <Badge className="bg-red-500/20 text-red-400">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Needs Review
                                            </Badge>
                                        </div>

                                        {/* Vote breakdown */}
                                        <div className="bg-background border border-border p-3 mb-3">
                                            <div className="text-xs text-text-secondary mb-2">Validator Votes</div>
                                            <div className="flex gap-4 text-sm">
                                                <span className="text-green-400">
                                                    <ThumbsUp className="w-3 h-3 inline mr-1" />
                                                    {c.voteBreakdown.approves} approve
                                                </span>
                                                <span className="text-red-400">
                                                    <ThumbsDown className="w-3 h-3 inline mr-1" />
                                                    {c.voteBreakdown.flags} flag
                                                </span>
                                            </div>
                                            {c.voteBreakdown.flagReasons.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    <div className="text-xs text-text-secondary">Flag reasons:</div>
                                                    {c.voteBreakdown.flagReasons.map((r, i) => (
                                                        <div key={i} className="text-xs text-red-300 bg-red-500/10 p-2 rounded">
                                                            <span className="font-mono text-red-400">{r.validator}</span>: {r.notes || 'No reason given'}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Evidence thumbnails */}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="bg-background border border-border p-2 text-center">
                                                <div className="text-[10px] text-text-secondary uppercase mb-1">User QR</div>
                                                {c.evidence.userQrImage ? (
                                                    <img src={c.evidence.userQrImage} alt="QR" className="w-full h-24 object-contain bg-white rounded" />
                                                ) : (
                                                    <div className="h-24 flex items-center justify-center text-xs text-text-secondary">None</div>
                                                )}
                                            </div>
                                            <div className="bg-background border border-border p-2 text-center">
                                                <div className="text-[10px] text-text-secondary uppercase mb-1">LP Proof</div>
                                                {c.evidence.lpScreenshot ? (
                                                    <img src={c.evidence.lpScreenshot} alt="Proof" className="w-full h-24 object-contain bg-white rounded" />
                                                ) : (
                                                    <div className="h-24 flex items-center justify-center text-xs text-text-secondary">None</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Addresses */}
                                        <div className="text-xs text-text-secondary space-y-1 mb-3">
                                            <div>User: <span className="font-mono text-text-primary">{c.evidence.userAddress}</span></div>
                                            <div>LP: <span className="font-mono text-text-primary">{c.evidence.lpAddress}</span></div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => resolveCase(c.id, 'approve')}
                                                disabled={resolving}
                                                className="py-2 bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                <CheckCircle className="w-3 h-3" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => resolveCase(c.id, 'slash')}
                                                disabled={resolving}
                                                className="py-2 bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                <XCircle className="w-3 h-3" />
                                                Slash LP
                                            </button>
                                            <button
                                                onClick={() => resolveCase(c.id, 'schedule_meet')}
                                                disabled={resolving}
                                                className="py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                <Calendar className="w-3 h-3" />
                                                Meet
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Validators */}
                        {tab === 'validators' && (
                            <div className="space-y-2">
                                {topValidators.length === 0 ? (
                                    <div className="bg-surface border border-border p-8 text-center">
                                        <Users className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                                        <h3 className="font-bold text-text-primary mb-2">No Validators Yet</h3>
                                    </div>
                                ) : topValidators.map((v, i) => (
                                    <div key={v.address} className="bg-surface border border-border p-3 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            i === 0 ? 'bg-yellow-500 text-black' :
                                            i === 1 ? 'bg-gray-300 text-black' :
                                            i === 2 ? 'bg-orange-400 text-black' :
                                            'bg-border text-text-secondary'
                                        }`}>
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-text-primary text-sm truncate">{v.address}</div>
                                            <div className="text-xs text-text-secondary">
                                                {v.totalReviews} reviews &bull; {v.accuracy}% accuracy
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-green-400 font-bold text-sm">${v.totalEarned.toFixed(2)}</div>
                                            <div className="text-[10px] text-text-secondary">
                                                {v.approvals}A / {v.flags}F
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function StatCard({ label, value, icon, color = 'brand' }: {
    label: string; value: string | number; icon: React.ReactNode; color?: string
}) {
    const colorMap: Record<string, string> = {
        brand: 'text-brand',
        yellow: 'text-yellow-400',
        red: 'text-red-400',
        green: 'text-green-400',
        blue: 'text-blue-400',
        orange: 'text-orange-400',
        purple: 'text-purple-400',
    }

    return (
        <div className="bg-surface border border-border p-3">
            <div className={`flex items-center gap-1 text-xs ${colorMap[color]} mb-1`}>
                {icon}
                <span className="uppercase text-text-secondary">{label}</span>
            </div>
            <div className={`text-xl font-bold font-mono ${colorMap[color]}`}>{value}</div>
        </div>
    )
}
