"use client"

import { useState, useEffect } from 'react'
import { 
    Scale, Clock, CheckCircle, XCircle, AlertTriangle, 
    ExternalLink, FileImage, Copy, User, Wallet, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Dispute {
    id: string
    orderId: string
    status: 'pending' | 'reviewing' | 'resolved'
    raisedBy: 'user' | 'lp'
    raisedAt: number
    
    // Order details
    amount: number
    lockedRate: number
    inrAmount: number
    
    // Parties
    user: {
        address: string
        totalOrders: number
        disputesRaised: number
        disputesLost: number
    }
    lp: {
        address: string
        name: string
        totalTrades: number
        disputesLost: number
        stake: number
    }
    
    // Evidence
    evidence: {
        utrReference: string
        explanation: string
        screenshots: { cid: string; url: string }[]
        submittedAt: number
    } | null
    
    // Resolution
    resolution?: {
        decision: 'user_wins' | 'lp_wins'
        slashPercentage: number
        notes: string
        resolvedAt: number
        resolvedBy: string
    }
}

/**
 * Arbitrator Dashboard for MVP
 * Manual dispute resolution with evidence review
 */
export default function ArbitratorDashboard() {
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
    const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending')
    const [isLoading, setIsLoading] = useState(true)
    const [resolving, setResolving] = useState(false)

    // Fetch disputes
    useEffect(() => {
        fetchDisputes()
    }, [filter])

    const fetchDisputes = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/disputes?status=${filter}`)
            const data = await response.json()
            setDisputes(data.disputes || [])
        } catch (error) {
            console.error('Failed to fetch disputes:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const resolveDispute = async (
        disputeId: string, 
        decision: 'user_wins' | 'lp_wins',
        slashPercentage: number,
        notes: string
    ) => {
        setResolving(true)
        try {
            const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision, slashPercentage, notes })
            })
            
            if (response.ok) {
                await fetchDisputes()
                setSelectedDispute(null)
            }
        } catch (error) {
            console.error('Failed to resolve dispute:', error)
        } finally {
            setResolving(false)
        }
    }

    const getTimeRemaining = (raisedAt: number) => {
        const deadline = raisedAt + (4 * 60 * 60 * 1000) // 4 hours
        const remaining = deadline - Date.now()
        
        if (remaining <= 0) return { text: 'OVERDUE', urgent: true }
        
        const hours = Math.floor(remaining / (60 * 60 * 1000))
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
        
        return {
            text: `${hours}h ${minutes}m`,
            urgent: remaining < 60 * 60 * 1000 // Less than 1 hour
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const filteredDisputes = disputes.filter(d => {
        if (filter === 'pending') return d.status !== 'resolved'
        if (filter === 'resolved') return d.status === 'resolved'
        return true
    })

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-surface border-b border-border p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Scale className="w-8 h-8 text-brand" />
                        <div>
                            <h1 className="text-xl font-bold text-text-primary">Dispute Resolution</h1>
                            <p className="text-sm text-text-secondary">Arbitrator Dashboard</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-2xl font-bold text-brand">
                                {disputes.filter(d => d.status === 'pending').length}
                            </p>
                            <p className="text-xs text-text-secondary">Pending</p>
                        </div>
                        <Button onClick={fetchDisputes} variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-3 gap-6">
                    {/* Dispute List */}
                    <div className="col-span-1 space-y-4">
                        {/* Filters */}
                        <div className="flex gap-2">
                            {(['pending', 'resolved', 'all'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                        filter === f
                                            ? 'bg-brand text-white'
                                            : 'bg-surface text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        {isLoading ? (
                            <div className="text-center py-8 text-text-secondary">Loading...</div>
                        ) : filteredDisputes.length === 0 ? (
                            <div className="text-center py-8 text-text-secondary">
                                No disputes found
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredDisputes.map((dispute) => {
                                    const timeInfo = getTimeRemaining(dispute.raisedAt)
                                    const isSelected = selectedDispute?.id === dispute.id
                                    
                                    return (
                                        <button
                                            key={dispute.id}
                                            onClick={() => setSelectedDispute(dispute)}
                                            className={`w-full text-left p-4 border transition-colors ${
                                                isSelected
                                                    ? 'bg-brand/10 border-brand'
                                                    : 'bg-surface border-border hover:border-brand/50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <span className="text-xs font-mono text-text-secondary">
                                                    {dispute.orderId.slice(0, 10)}...
                                                </span>
                                                {dispute.status === 'resolved' ? (
                                                    <CheckCircle className="w-4 h-4 text-success" />
                                                ) : (
                                                    <span className={`text-xs font-medium ${
                                                        timeInfo.urgent ? 'text-error' : 'text-warning'
                                                    }`}>
                                                        {timeInfo.text}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="font-medium text-text-primary">
                                                ${(dispute.amount / 1_000000).toFixed(2)} USDC
                                            </p>
                                            <p className="text-xs text-text-secondary mt-1">
                                                Raised by {dispute.raisedBy === 'user' ? 'User' : 'LP'}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Dispute Details */}
                    <div className="col-span-2">
                        {selectedDispute ? (
                            <DisputeDetails 
                                dispute={selectedDispute}
                                onResolve={resolveDispute}
                                resolving={resolving}
                                copyToClipboard={copyToClipboard}
                            />
                        ) : (
                            <div className="bg-surface border border-border p-8 text-center">
                                <Scale className="w-12 h-12 mx-auto mb-4 text-text-secondary opacity-50" />
                                <p className="text-text-secondary">Select a dispute to review</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DisputeDetails({ 
    dispute, 
    onResolve,
    resolving,
    copyToClipboard
}: { 
    dispute: Dispute
    onResolve: (id: string, decision: 'user_wins' | 'lp_wins', slash: number, notes: string) => void
    resolving: boolean
    copyToClipboard: (text: string) => void
}) {
    const [notes, setNotes] = useState('')
    const [slashPercentage, setSlashPercentage] = useState(20)
    const timeInfo = getTimeRemaining(dispute.raisedAt)

    function getTimeRemaining(raisedAt: number) {
        const deadline = raisedAt + (4 * 60 * 60 * 1000)
        const remaining = deadline - Date.now()
        
        if (remaining <= 0) return { text: 'OVERDUE', urgent: true }
        
        const hours = Math.floor(remaining / (60 * 60 * 1000))
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
        
        return { text: `${hours}h ${minutes}m`, urgent: remaining < 60 * 60 * 1000 }
    }

    return (
        <div className="bg-surface border border-border">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-text-primary">Dispute #{dispute.id.slice(0, 8)}</h2>
                    <p className="text-xs text-text-secondary">
                        Order: {dispute.orderId}
                    </p>
                </div>
                {dispute.status !== 'resolved' && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 ${
                        timeInfo.urgent ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                    }`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{timeInfo.text} remaining</span>
                    </div>
                )}
            </div>

            <div className="p-4 space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-background p-3 border border-border">
                        <p className="text-xs text-text-secondary mb-1">Amount</p>
                        <p className="text-lg font-bold text-text-primary">
                            ${(dispute.amount / 1_000000).toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-background p-3 border border-border">
                        <p className="text-xs text-text-secondary mb-1">Rate (Locked)</p>
                        <p className="text-lg font-bold text-text-primary">
                            ₹{dispute.lockedRate.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-background p-3 border border-border">
                        <p className="text-xs text-text-secondary mb-1">INR Amount</p>
                        <p className="text-lg font-bold text-text-primary">
                            ₹{dispute.inrAmount.toFixed(0)}
                        </p>
                    </div>
                </div>

                {/* Parties */}
                <div className="grid grid-cols-2 gap-4">
                    {/* User */}
                    <div className="bg-background p-4 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-brand" />
                            <span className="font-medium text-text-primary">User</span>
                            {dispute.raisedBy === 'user' && (
                                <span className="text-xs bg-brand/10 text-brand px-2 py-0.5">
                                    Raised dispute
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-text-secondary">Address</span>
                                <button 
                                    onClick={() => copyToClipboard(dispute.user.address)}
                                    className="font-mono text-text-primary hover:text-brand flex items-center gap-1"
                                >
                                    {dispute.user.address.slice(0, 8)}...
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Total Orders</span>
                                <span className="text-text-primary">{dispute.user.totalOrders}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Disputes Raised</span>
                                <span className={dispute.user.disputesRaised > 2 ? 'text-warning' : 'text-text-primary'}>
                                    {dispute.user.disputesRaised}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Disputes Lost</span>
                                <span className={dispute.user.disputesLost > 0 ? 'text-error' : 'text-success'}>
                                    {dispute.user.disputesLost}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* LP */}
                    <div className="bg-background p-4 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                            <Wallet className="w-4 h-4 text-brand" />
                            <span className="font-medium text-text-primary">{dispute.lp.name}</span>
                            {dispute.raisedBy === 'lp' && (
                                <span className="text-xs bg-brand/10 text-brand px-2 py-0.5">
                                    Raised dispute
                                </span>
                            )}
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-text-secondary">Address</span>
                                <button 
                                    onClick={() => copyToClipboard(dispute.lp.address)}
                                    className="font-mono text-text-primary hover:text-brand flex items-center gap-1"
                                >
                                    {dispute.lp.address.slice(0, 8)}...
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Total Trades</span>
                                <span className="text-text-primary">{dispute.lp.totalTrades}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Stake</span>
                                <span className="text-text-primary">
                                    ${(dispute.lp.stake / 1_000000).toFixed(0)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Disputes Lost</span>
                                <span className={dispute.lp.disputesLost > 0 ? 'text-error' : 'text-success'}>
                                    {dispute.lp.disputesLost}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evidence */}
                {dispute.evidence && (
                    <div className="border border-border">
                        <div className="bg-background px-4 py-2 border-b border-border">
                            <h3 className="font-medium text-text-primary">Evidence Submitted</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* UTR */}
                            <div>
                                <p className="text-xs text-text-secondary mb-1">UTR Reference</p>
                                <div className="flex items-center gap-2">
                                    <code className="bg-background px-3 py-2 font-mono text-text-primary border border-border flex-1">
                                        {dispute.evidence.utrReference}
                                    </code>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => copyToClipboard(dispute.evidence!.utrReference)}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Explanation */}
                            <div>
                                <p className="text-xs text-text-secondary mb-1">Explanation</p>
                                <p className="bg-background p-3 border border-border text-sm text-text-primary">
                                    {dispute.evidence.explanation}
                                </p>
                            </div>

                            {/* Screenshots */}
                            {dispute.evidence.screenshots.length > 0 && (
                                <div>
                                    <p className="text-xs text-text-secondary mb-2">Screenshots</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {dispute.evidence.screenshots.map((ss, i) => (
                                            <a
                                                key={ss.cid}
                                                href={ss.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="aspect-video bg-background border border-border flex items-center justify-center hover:border-brand transition-colors"
                                            >
                                                <div className="text-center">
                                                    <FileImage className="w-6 h-6 mx-auto text-text-secondary" />
                                                    <span className="text-xs text-brand mt-1 flex items-center gap-1">
                                                        View <ExternalLink className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Resolution Form */}
                {dispute.status !== 'resolved' && (
                    <div className="border border-brand/20 bg-brand/5 p-4">
                        <h3 className="font-medium text-text-primary mb-4">Resolution</h3>
                        
                        {/* Notes */}
                        <div className="mb-4">
                            <label className="text-xs text-text-secondary mb-1 block">
                                Resolution Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Explain your decision..."
                                rows={2}
                                className="w-full bg-background border border-border px-3 py-2 text-sm"
                            />
                        </div>

                        {/* Slash percentage */}
                        <div className="mb-4">
                            <label className="text-xs text-text-secondary mb-1 block">
                                LP Slash Percentage (if LP loses)
                            </label>
                            <select
                                value={slashPercentage}
                                onChange={(e) => setSlashPercentage(Number(e.target.value))}
                                className="bg-background border border-border px-3 py-2 text-sm"
                            >
                                <option value={0}>No slash</option>
                                <option value={20}>20% (Warning)</option>
                                <option value={50}>50% (Strike)</option>
                                <option value={100}>100% (Ban)</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                onClick={() => onResolve(dispute.id, 'user_wins', slashPercentage, notes)}
                                disabled={resolving}
                                className="flex-1 bg-success hover:bg-success/90"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                User Wins
                            </Button>
                            <Button
                                onClick={() => onResolve(dispute.id, 'lp_wins', 0, notes)}
                                disabled={resolving}
                                variant="outline"
                                className="flex-1 border-error text-error hover:bg-error/10"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                LP Wins
                            </Button>
                        </div>
                    </div>
                )}

                {/* Resolution Result */}
                {dispute.resolution && (
                    <div className={`border p-4 ${
                        dispute.resolution.decision === 'user_wins' 
                            ? 'border-success/20 bg-success/5' 
                            : 'border-error/20 bg-error/5'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            {dispute.resolution.decision === 'user_wins' ? (
                                <CheckCircle className="w-5 h-5 text-success" />
                            ) : (
                                <XCircle className="w-5 h-5 text-error" />
                            )}
                            <span className="font-medium text-text-primary">
                                {dispute.resolution.decision === 'user_wins' ? 'User Won' : 'LP Won'}
                            </span>
                        </div>
                        {dispute.resolution.slashPercentage > 0 && (
                            <p className="text-sm text-warning mb-2">
                                LP slashed {dispute.resolution.slashPercentage}%
                            </p>
                        )}
                        {dispute.resolution.notes && (
                            <p className="text-sm text-text-secondary">{dispute.resolution.notes}</p>
                        )}
                        <p className="text-xs text-text-secondary mt-2">
                            Resolved {new Date(dispute.resolution.resolvedAt).toLocaleString()}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
