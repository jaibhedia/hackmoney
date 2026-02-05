"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Scale, CheckCircle, XCircle, Clock, AlertTriangle, Users, Award, Shield, Zap, Eye, Image as ImageIcon, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/hooks/useWallet"
import { useDisputes, formatTimeRemaining, type Dispute } from "@/hooks/useDisputes"
import { formatCurrency } from "@/lib/currency-converter"

// Admin addresses for hackathon MVP (centralized resolution)
const ADMIN_ADDRESSES = [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f5bA21", // Team wallet 1
    "0x8ba1f109551bD432803012645Ac136ddd64DBA72", // Team wallet 2
].map(a => a.toLowerCase())

// Resolution SLA (4 hours)
const RESOLUTION_SLA_MS = 4 * 60 * 60 * 1000

/**
 * Arbitrator Dashboard
 * Supports both:
 * - Admin mode: Manual resolution for hackathon MVP (centralized, fast)
 * - DAO mode: Community voting for production (decentralized)
 */
export default function ArbitratorDashboard() {
    const { address, isConnected } = useWallet()
    const {
        disputes,
        fetchDisputes,
        voteOnDispute,
        hasVoted,
        isArbitrator,
        getVotingTimeRemaining,
        isLoading,
    } = useDisputes(address ?? undefined, 'arbitrator')

    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
    const [voteReasoning, setVoteReasoning] = useState("")
    const [isVoting, setIsVoting] = useState(false)
    const [mounted, setMounted] = useState(false)
    
    // Admin mode state
    const isAdmin = address ? ADMIN_ADDRESSES.includes(address.toLowerCase()) : false
    const [adminMode, setAdminMode] = useState(false)
    const [resolving, setResolving] = useState(false)
    const [slashPercent, setSlashPercent] = useState(0)
    const [adminNotes, setAdminNotes] = useState("")
    const [viewEvidence, setViewEvidence] = useState<Dispute | null>(null)

    useEffect(() => {
        setMounted(true)
        if (address) {
            fetchDisputes()
            // Auto-enable admin mode for admins
            if (ADMIN_ADDRESSES.includes(address.toLowerCase())) {
                setAdminMode(true)
            }
        }
    }, [address, fetchDisputes])

    // Refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (address) fetchDisputes()
        }, 30000)
        return () => clearInterval(interval)
    }, [address, fetchDisputes])

    const handleVote = async (favorBuyer: boolean) => {
        if (!selectedDispute || !voteReasoning.trim()) return

        setIsVoting(true)
        const success = await voteOnDispute(selectedDispute.id, favorBuyer, voteReasoning)

        if (success) {
            setSelectedDispute(null)
            setVoteReasoning("")
        }
        setIsVoting(false)
    }

    // Admin resolution handler (hackathon MVP)
    const handleAdminResolve = async (decision: 'user_wins' | 'lp_wins') => {
        if (!selectedDispute) return
        
        setResolving(true)
        try {
            const res = await fetch(`/api/disputes/${selectedDispute.id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    decision,
                    slashPercentage: slashPercent,
                    notes: adminNotes,
                    resolvedBy: address
                })
            })
            
            if (res.ok) {
                setSelectedDispute(null)
                setAdminNotes("")
                setSlashPercent(0)
                fetchDisputes()
            }
        } catch (error) {
            console.error('Resolution failed:', error)
        }
        setResolving(false)
    }

    // Calculate SLA countdown
    const getSLARemaining = (dispute: Dispute) => {
        const created = new Date(dispute.createdAt).getTime()
        const deadline = created + RESOLUTION_SLA_MS
        return Math.max(0, deadline - Date.now())
    }

    if (!mounted) return null

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-black p-4 flex items-center justify-center">
                <div className="text-center font-mono">
                    <Scale className="w-16 h-16 text-brand mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">ARBITRATOR_DASHBOARD</h1>
                    <p className="text-text-secondary text-sm uppercase">Connect wallet to continue</p>
                </div>
            </div>
        )
    }

    const pendingDisputes = disputes.filter(d => d.status === 'voting' && !hasVoted(d))
    const votedDisputes = disputes.filter(d => hasVoted(d))
    const resolvedDisputes = disputes.filter(d => d.status === 'resolved')

    return (
        <div className="min-h-screen bg-black">
            {/* Header */}
            <header className="border-b border-border p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-text-secondary hover:text-white">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-white font-mono uppercase flex items-center gap-2">
                                {adminMode ? (
                                    <>
                                        <Shield size={18} className="text-brand" />
                                        Admin_Resolution
                                    </>
                                ) : (
                                    <>
                                        <Scale size={18} className="text-brand" />
                                        Arbitrator_Dashboard
                                    </>
                                )}
                            </h1>
                            <p className="text-[10px] text-text-secondary uppercase">
                                {adminMode ? '< 4hr SLA • Manual Review' : 'Community dispute resolution'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAdmin && (
                            <button
                                onClick={() => setAdminMode(!adminMode)}
                                className={`px-3 py-1 text-[10px] uppercase font-bold border transition-colors ${
                                    adminMode 
                                        ? 'border-brand bg-brand/20 text-brand' 
                                        : 'border-border text-text-secondary hover:border-brand'
                                }`}
                            >
                                {adminMode ? '✓ Admin' : 'DAO'}
                            </button>
                        )}
                        <div className="text-right">
                            <div className="text-[10px] text-text-secondary uppercase">Pending</div>
                            <div className="text-lg font-bold text-brand">{pendingDisputes.length}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-text-secondary uppercase">Resolved</div>
                            <div className="text-lg font-bold text-green-500">{resolvedDisputes.length}</div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4">
                {/* Admin Mode SLA Warning */}
                {adminMode && pendingDisputes.length > 0 && (
                    <div className="border border-yellow-500/50 bg-yellow-500/10 p-3 mb-4 font-mono">
                        <div className="flex items-center gap-2 text-yellow-500">
                            <Zap size={16} />
                            <span className="text-sm font-bold uppercase">Hackathon SLA: Resolve within 4 hours</span>
                        </div>
                        <p className="text-[10px] text-yellow-500/80 mt-1">
                            Review evidence carefully. Your decision is final and impacts user trust.
                        </p>
                    </div>
                )}

                {/* Stats Banner */}
                <div className="border border-border p-4 mb-6">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <Scale size={24} className="mx-auto mb-2 text-brand" />
                            <div className="text-2xl font-bold text-white">{disputes.length}</div>
                            <div className="text-[10px] text-text-secondary uppercase">Total {adminMode ? 'Cases' : 'Assigned'}</div>
                        </div>
                        <div>
                            <Clock size={24} className="mx-auto mb-2 text-yellow-500" />
                            <div className="text-2xl font-bold text-white">{pendingDisputes.length}</div>
                            <div className="text-[10px] text-text-secondary uppercase">{adminMode ? 'Needs Review' : 'Pending Vote'}</div>
                        </div>
                        <div>
                            <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                            <div className="text-2xl font-bold text-white">{adminMode ? resolvedDisputes.length : votedDisputes.length}</div>
                            <div className="text-[10px] text-text-secondary uppercase">{adminMode ? 'Resolved' : 'Voted'}</div>
                        </div>
                        <div>
                            <Award size={24} className="mx-auto mb-2 text-brand" />
                            <div className="text-2xl font-bold text-white">{adminMode ? '<4hr' : '--'}</div>
                            <div className="text-[10px] text-text-secondary uppercase">{adminMode ? 'Target SLA' : 'Accuracy'}</div>
                        </div>
                    </div>
                </div>

                {/* Pending Disputes */}
                {pendingDisputes.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-bold text-brand uppercase mb-4 font-mono flex items-center gap-2">
                            <AlertTriangle size={16} />
                            {adminMode ? 'Needs_Review' : 'Pending_Votes'} ({pendingDisputes.length})
                        </h2>
                        <div className="space-y-3">
                            {pendingDisputes.map(dispute => (
                                <DisputeCard
                                    key={dispute.id}
                                    dispute={dispute}
                                    onSelect={() => setSelectedDispute(dispute)}
                                    onViewEvidence={() => setViewEvidence(dispute)}
                                    timeRemaining={adminMode ? getSLARemaining(dispute) : getVotingTimeRemaining(dispute)}
                                    adminMode={adminMode}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Voted Disputes */}
                {votedDisputes.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-bold text-text-secondary uppercase mb-4 font-mono flex items-center gap-2">
                            <CheckCircle size={16} />
                            Already_Voted ({votedDisputes.length})
                        </h2>
                        <div className="space-y-3 opacity-60">
                            {votedDisputes.map(dispute => (
                                <DisputeCard
                                    key={dispute.id}
                                    dispute={dispute}
                                    voted
                                    userVote={dispute.votes[address!]?.favorBuyer}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {disputes.length === 0 && !isLoading && (
                    <div className="text-center py-16">
                        <Scale size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
                        <h2 className="text-lg font-bold text-white mb-2">No Disputes Assigned</h2>
                        <p className="text-sm text-text-secondary">
                            You'll be notified when disputes require your vote
                        </p>
                    </div>
                )}
            </main>

            {/* DAO Vote Modal */}
            {selectedDispute && !adminMode && (
                <VoteModal
                    dispute={selectedDispute}
                    reasoning={voteReasoning}
                    onReasoningChange={setVoteReasoning}
                    onVote={handleVote}
                    onClose={() => {
                        setSelectedDispute(null)
                        setVoteReasoning("")
                    }}
                    isVoting={isVoting}
                    timeRemaining={getVotingTimeRemaining(selectedDispute)}
                />
            )}

            {/* Admin Resolution Modal */}
            {selectedDispute && adminMode && (
                <AdminResolveModal
                    dispute={selectedDispute}
                    notes={adminNotes}
                    onNotesChange={setAdminNotes}
                    slashPercent={slashPercent}
                    onSlashChange={setSlashPercent}
                    onResolve={handleAdminResolve}
                    onClose={() => {
                        setSelectedDispute(null)
                        setAdminNotes("")
                        setSlashPercent(0)
                    }}
                    isResolving={resolving}
                    slaRemaining={getSLARemaining(selectedDispute)}
                />
            )}

            {/* Evidence Viewer Modal */}
            {viewEvidence && (
                <EvidenceViewerModal
                    dispute={viewEvidence}
                    onClose={() => setViewEvidence(null)}
                />
            )}
        </div>
    )
}

// Dispute Card Component
function DisputeCard({
    dispute,
    onSelect,
    onViewEvidence,
    voted = false,
    userVote,
    timeRemaining,
    adminMode = false,
}: {
    dispute: Dispute
    onSelect?: () => void
    onViewEvidence?: () => void
    voted?: boolean
    userVote?: boolean
    timeRemaining?: number
    adminMode?: boolean
}) {
    const slaUrgent = adminMode && timeRemaining !== undefined && timeRemaining < 60 * 60 * 1000 // < 1hr
    
    return (
        <div
            className={`border p-4 font-mono ${voted
                ? 'border-border bg-surface/20'
                : slaUrgent 
                    ? 'border-red-500/50 bg-red-500/5 cursor-pointer hover:border-red-500'
                    : 'border-brand/50 bg-brand/5 cursor-pointer hover:border-brand'
                }`}
            onClick={!voted ? onSelect : undefined}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="text-[10px] text-text-secondary uppercase">
                        {adminMode ? 'Case' : 'Dispute'} #{dispute.id.slice(-8)}
                    </div>
                    <div className="text-lg font-bold text-white">
                        ${dispute.amount.toFixed(2)} USDC
                    </div>
                </div>
                {timeRemaining !== undefined && timeRemaining > 0 && (
                    <div className="text-right">
                        <div className="text-[10px] text-text-secondary uppercase">
                            {adminMode ? 'SLA Timer' : 'Time Left'}
                        </div>
                        <div className={`text-sm font-bold ${slaUrgent ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
                            {formatTimeRemaining(timeRemaining)}
                        </div>
                    </div>
                )}
                {voted && (
                    <div className={`px-2 py-1 text-[10px] uppercase font-bold ${userVote ? 'bg-blue-500/20 text-blue-500' : 'bg-orange-500/20 text-orange-500'
                        }`}>
                        Voted: {userVote ? 'Buyer' : 'Seller'}
                    </div>
                )}
            </div>

            <div className="text-sm text-text-secondary mb-3">
                <span className="text-brand">{">"}</span> {dispute.reason}
            </div>

            <div className="flex gap-4 text-[10px] text-text-secondary uppercase">
                <div>
                    <span className="text-blue-400">Buyer:</span>{" "}
                    {dispute.buyer.slice(0, 6)}...{dispute.buyer.slice(-4)}
                </div>
                <div>
                    <span className="text-orange-400">Seller:</span>{" "}
                    {dispute.seller.slice(0, 6)}...{dispute.seller.slice(-4)}
                </div>
            </div>

            {/* Admin mode: evidence indicators */}
            {adminMode && (
                <div className="flex gap-2 mt-3">
                    {dispute.buyerEvidence && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 uppercase">
                            <ImageIcon size={10} className="inline mr-1" />
                            Buyer Evidence
                        </span>
                    )}
                    {dispute.sellerEvidence && (
                        <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-400 uppercase">
                            <ImageIcon size={10} className="inline mr-1" />
                            Seller Evidence
                        </span>
                    )}
                    {(dispute as any).utr && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 uppercase">
                            <FileText size={10} className="inline mr-1" />
                            UTR: {(dispute as any).utr}
                        </span>
                    )}
                    {onViewEvidence && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onViewEvidence(); }}
                            className="text-[10px] px-2 py-0.5 bg-brand/20 text-brand uppercase hover:bg-brand/40"
                        >
                            <Eye size={10} className="inline mr-1" />
                            View All
                        </button>
                    )}
                </div>
            )}

            {/* DAO mode: vote counts */}
            {!adminMode && (
                <div className="flex gap-4 mt-3 text-[10px]">
                    <div className="text-blue-400">
                        Votes for Buyer: {dispute.votesForBuyer}
                    </div>
                    <div className="text-orange-400">
                        Votes for Seller: {dispute.votesForSeller}
                    </div>
                </div>
            )}
        </div>
    )
}

// Vote Modal Component
function VoteModal({
    dispute,
    reasoning,
    onReasoningChange,
    onVote,
    onClose,
    isVoting,
    timeRemaining,
}: {
    dispute: Dispute
    reasoning: string
    onReasoningChange: (v: string) => void
    onVote: (favorBuyer: boolean) => void
    onClose: () => void
    isVoting: boolean
    timeRemaining: number
}) {
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-brand max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="border-b border-border p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-brand uppercase font-mono">
                            Cast_Vote
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-text-secondary hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    {timeRemaining > 0 && (
                        <div className="text-[10px] text-yellow-500 uppercase mt-1">
                            Time remaining: {formatTimeRemaining(timeRemaining)}
                        </div>
                    )}
                </div>

                {/* Dispute Details */}
                <div className="p-4 border-b border-border">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <div className="text-[10px] text-text-secondary uppercase">Amount</div>
                            <div className="text-lg font-bold text-white">
                                ${dispute.amount.toFixed(2)} USDC
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-text-secondary uppercase">Order</div>
                            <div className="text-sm font-mono text-white">
                                {dispute.orderId.slice(0, 12)}...
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="text-[10px] text-text-secondary uppercase mb-1">Reason</div>
                        <div className="text-sm text-white bg-surface/20 p-2 border border-border">
                            {dispute.reason}
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-blue-500/30 bg-blue-500/5 p-3">
                            <div className="text-[10px] text-blue-400 uppercase mb-1">Buyer</div>
                            <div className="text-xs font-mono text-white">
                                {dispute.buyer.slice(0, 10)}...{dispute.buyer.slice(-6)}
                            </div>
                            {dispute.buyerEvidence && (
                                <div className="text-[10px] text-green-500 mt-1">✓ Evidence submitted</div>
                            )}
                        </div>
                        <div className="border border-orange-500/30 bg-orange-500/5 p-3">
                            <div className="text-[10px] text-orange-400 uppercase mb-1">Seller</div>
                            <div className="text-xs font-mono text-white">
                                {dispute.seller.slice(0, 10)}...{dispute.seller.slice(-6)}
                            </div>
                            {dispute.sellerEvidence && (
                                <div className="text-[10px] text-green-500 mt-1">✓ Evidence submitted</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reasoning Input */}
                <div className="p-4 border-b border-border">
                    <label className="text-[10px] text-brand uppercase block mb-2 font-bold">
                        {">"} Your Reasoning (Required)
                    </label>
                    <textarea
                        value={reasoning}
                        onChange={(e) => onReasoningChange(e.target.value)}
                        placeholder="Explain your vote decision..."
                        className="w-full bg-black border border-border p-3 text-white font-mono text-sm 
                                   focus:border-brand outline-none placeholder:text-gray-700 min-h-[100px]"
                    />
                    <p className="text-[10px] text-text-secondary mt-1">
                        Your reasoning will be recorded on-chain for transparency
                    </p>
                </div>

                {/* Vote Buttons */}
                <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onVote(true)}
                            disabled={!reasoning.trim() || isVoting}
                            className="py-4 bg-blue-500/10 border-2 border-blue-500 text-blue-500 
                                       font-bold uppercase text-sm hover:bg-blue-500 hover:text-black 
                                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Users size={20} className="mx-auto mb-1" />
                            Vote Buyer
                        </button>
                        <button
                            onClick={() => onVote(false)}
                            disabled={!reasoning.trim() || isVoting}
                            className="py-4 bg-orange-500/10 border-2 border-orange-500 text-orange-500 
                                       font-bold uppercase text-sm hover:bg-orange-500 hover:text-black 
                                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Users size={20} className="mx-auto mb-1" />
                            Vote Seller
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-[10px] text-text-secondary uppercase">
                            Your vote is final and cannot be changed
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Admin Resolution Modal (Hackathon MVP - Centralized)
function AdminResolveModal({
    dispute,
    notes,
    onNotesChange,
    slashPercent,
    onSlashChange,
    onResolve,
    onClose,
    isResolving,
    slaRemaining,
}: {
    dispute: Dispute
    notes: string
    onNotesChange: (v: string) => void
    slashPercent: number
    onSlashChange: (v: number) => void
    onResolve: (decision: 'user_wins' | 'lp_wins') => void
    onClose: () => void
    isResolving: boolean
    slaRemaining: number
}) {
    const slaUrgent = slaRemaining < 60 * 60 * 1000
    
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-brand max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="border-b border-border p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-brand uppercase font-mono flex items-center gap-2">
                            <Shield size={20} />
                            Admin_Resolution
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-text-secondary hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    <div className={`text-[10px] uppercase mt-1 flex items-center gap-2 ${slaUrgent ? 'text-red-500' : 'text-yellow-500'}`}>
                        <Clock size={12} />
                        SLA: {formatTimeRemaining(slaRemaining)} remaining
                        {slaUrgent && <span className="animate-pulse">⚠️ URGENT</span>}
                    </div>
                </div>

                {/* Case Details */}
                <div className="p-4 border-b border-border">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <div className="text-[10px] text-text-secondary uppercase">Amount</div>
                            <div className="text-lg font-bold text-white">
                                ${dispute.amount.toFixed(2)} USDC
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-text-secondary uppercase">Order ID</div>
                            <div className="text-sm font-mono text-white">
                                {dispute.orderId.slice(0, 12)}...
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] text-text-secondary uppercase">Filed</div>
                            <div className="text-sm text-white">
                                {new Date(dispute.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="text-[10px] text-text-secondary uppercase mb-1">Dispute Reason</div>
                        <div className="text-sm text-white bg-surface/20 p-2 border border-border">
                            {dispute.reason}
                        </div>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="border border-blue-500/30 bg-blue-500/5 p-3">
                            <div className="text-[10px] text-blue-400 uppercase mb-1">User (Buyer)</div>
                            <div className="text-xs font-mono text-white">
                                {dispute.buyer.slice(0, 10)}...{dispute.buyer.slice(-6)}
                            </div>
                            {dispute.buyerEvidence && (
                                <div className="text-[10px] text-green-500 mt-1">✓ Evidence submitted</div>
                            )}
                        </div>
                        <div className="border border-orange-500/30 bg-orange-500/5 p-3">
                            <div className="text-[10px] text-orange-400 uppercase mb-1">LP (Seller)</div>
                            <div className="text-xs font-mono text-white">
                                {dispute.seller.slice(0, 10)}...{dispute.seller.slice(-6)}
                            </div>
                            {dispute.sellerEvidence && (
                                <div className="text-[10px] text-green-500 mt-1">✓ Evidence submitted</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Slash Percentage */}
                <div className="p-4 border-b border-border">
                    <label className="text-[10px] text-brand uppercase block mb-2 font-bold">
                        {">"} Penalty for losing party
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {[0, 20, 50, 100].map(pct => (
                            <button
                                key={pct}
                                onClick={() => onSlashChange(pct)}
                                className={`py-2 text-sm font-mono border transition-colors ${
                                    slashPercent === pct
                                        ? 'border-brand bg-brand/20 text-brand'
                                        : 'border-border text-text-secondary hover:border-brand/50'
                                }`}
                            >
                                {pct}%
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-text-secondary mt-2">
                        {slashPercent === 0 && "No penalty - return funds only"}
                        {slashPercent === 20 && "Minor violation - 20% of stake slashed"}
                        {slashPercent === 50 && "Moderate violation - 50% of stake slashed"}
                        {slashPercent === 100 && "Severe violation - Full stake slashed + ban"}
                    </p>
                </div>

                {/* Admin Notes */}
                <div className="p-4 border-b border-border">
                    <label className="text-[10px] text-brand uppercase block mb-2 font-bold">
                        {">"} Resolution Notes (Internal)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        placeholder="Document your reasoning for the resolution..."
                        className="w-full bg-black border border-border p-3 text-white font-mono text-sm 
                                   focus:border-brand outline-none placeholder:text-gray-700 min-h-[80px]"
                    />
                </div>

                {/* Resolution Buttons */}
                <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onResolve('user_wins')}
                            disabled={isResolving}
                            className="py-4 bg-blue-500/10 border-2 border-blue-500 text-blue-500 
                                       font-bold uppercase text-sm hover:bg-blue-500 hover:text-black 
                                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle size={20} className="mx-auto mb-1" />
                            User Wins
                            <span className="block text-[10px] font-normal mt-1">Refund buyer</span>
                        </button>
                        <button
                            onClick={() => onResolve('lp_wins')}
                            disabled={isResolving}
                            className="py-4 bg-orange-500/10 border-2 border-orange-500 text-orange-500 
                                       font-bold uppercase text-sm hover:bg-orange-500 hover:text-black 
                                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle size={20} className="mx-auto mb-1" />
                            LP Wins
                            <span className="block text-[10px] font-normal mt-1">Release to seller</span>
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-[10px] text-red-500 uppercase">
                            ⚠️ This decision is final and will be recorded permanently
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Evidence Viewer Modal
function EvidenceViewerModal({
    dispute,
    onClose,
}: {
    dispute: Dispute
    onClose: () => void
}) {
    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-brand max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="border-b border-border p-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-brand uppercase font-mono flex items-center gap-2">
                            <Eye size={20} />
                            Evidence_Review
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-text-secondary hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="text-[10px] text-text-secondary uppercase mt-1">
                        Case #{dispute.id.slice(-8)} • ${dispute.amount.toFixed(2)} USDC
                    </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-border">
                    {/* Buyer Evidence */}
                    <div className="p-4">
                        <h3 className="text-sm font-bold text-blue-400 uppercase mb-3 flex items-center gap-2">
                            <Users size={16} />
                            Buyer Evidence
                        </h3>
                        {dispute.buyerEvidence ? (
                            <div className="space-y-3">
                                {/* UTR */}
                                {(dispute as any).buyerUtr && (
                                    <div className="bg-surface/20 border border-border p-3">
                                        <div className="text-[10px] text-text-secondary uppercase mb-1">UTR Number</div>
                                        <div className="font-mono text-white">{(dispute as any).buyerUtr}</div>
                                    </div>
                                )}
                                
                                {/* Explanation */}
                                {(dispute as any).buyerExplanation && (
                                    <div className="bg-surface/20 border border-border p-3">
                                        <div className="text-[10px] text-text-secondary uppercase mb-1">Explanation</div>
                                        <div className="text-sm text-white whitespace-pre-wrap">
                                            {(dispute as any).buyerExplanation}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Screenshots */}
                                {(dispute as any).buyerScreenshots?.length > 0 && (
                                    <div>
                                        <div className="text-[10px] text-text-secondary uppercase mb-2">Screenshots</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(dispute as any).buyerScreenshots.map((url: string, i: number) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="border border-border hover:border-brand transition-colors block aspect-video bg-surface/10 flex items-center justify-center"
                                                >
                                                    <ImageIcon size={24} className="text-text-secondary" />
                                                    <ExternalLink size={12} className="ml-1 text-brand" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Timestamp */}
                                <div className="text-[10px] text-text-secondary">
                                    Submitted: {new Date((dispute as any).buyerEvidenceAt || dispute.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-text-secondary">
                                <XCircle size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No evidence submitted</p>
                            </div>
                        )}
                    </div>

                    {/* Seller Evidence */}
                    <div className="p-4">
                        <h3 className="text-sm font-bold text-orange-400 uppercase mb-3 flex items-center gap-2">
                            <Users size={16} />
                            Seller (LP) Evidence
                        </h3>
                        {dispute.sellerEvidence ? (
                            <div className="space-y-3">
                                {/* UTR */}
                                {(dispute as any).sellerUtr && (
                                    <div className="bg-surface/20 border border-border p-3">
                                        <div className="text-[10px] text-text-secondary uppercase mb-1">UTR Number</div>
                                        <div className="font-mono text-white">{(dispute as any).sellerUtr}</div>
                                    </div>
                                )}
                                
                                {/* Explanation */}
                                {(dispute as any).sellerExplanation && (
                                    <div className="bg-surface/20 border border-border p-3">
                                        <div className="text-[10px] text-text-secondary uppercase mb-1">Explanation</div>
                                        <div className="text-sm text-white whitespace-pre-wrap">
                                            {(dispute as any).sellerExplanation}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Screenshots */}
                                {(dispute as any).sellerScreenshots?.length > 0 && (
                                    <div>
                                        <div className="text-[10px] text-text-secondary uppercase mb-2">Screenshots</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(dispute as any).sellerScreenshots.map((url: string, i: number) => (
                                                <a
                                                    key={i}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="border border-border hover:border-brand transition-colors block aspect-video bg-surface/10 flex items-center justify-center"
                                                >
                                                    <ImageIcon size={24} className="text-text-secondary" />
                                                    <ExternalLink size={12} className="ml-1 text-brand" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Timestamp */}
                                <div className="text-[10px] text-text-secondary">
                                    Submitted: {new Date((dispute as any).sellerEvidenceAt || dispute.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-text-secondary">
                                <XCircle size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No evidence submitted</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Close Button */}
                <div className="border-t border-border p-4">
                    <button
                        onClick={onClose}
                        className="w-full py-3 border border-brand text-brand font-bold uppercase text-sm hover:bg-brand hover:text-black transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}