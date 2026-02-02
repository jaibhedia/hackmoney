"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Scale, CheckCircle, XCircle, Clock, AlertTriangle, Users, Award } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/hooks/useWallet"
import { useDisputes, formatTimeRemaining, type Dispute } from "@/hooks/useDisputes"
import { formatCurrency } from "@/lib/currency-converter"

/**
 * Arbitrator Dashboard
 * For community arbitrators to view and vote on disputes
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

    useEffect(() => {
        setMounted(true)
        if (address) {
            fetchDisputes()
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
                            <h1 className="text-lg font-bold text-white font-mono uppercase">
                                Arbitrator_Dashboard
                            </h1>
                            <p className="text-[10px] text-text-secondary uppercase">
                                Community dispute resolution
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
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
                {/* Stats Banner */}
                <div className="border border-border p-4 mb-6">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <Scale size={24} className="mx-auto mb-2 text-brand" />
                            <div className="text-2xl font-bold text-white">{disputes.length}</div>
                            <div className="text-[10px] text-text-secondary uppercase">Total Assigned</div>
                        </div>
                        <div>
                            <Clock size={24} className="mx-auto mb-2 text-yellow-500" />
                            <div className="text-2xl font-bold text-white">{pendingDisputes.length}</div>
                            <div className="text-[10px] text-text-secondary uppercase">Pending Vote</div>
                        </div>
                        <div>
                            <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                            <div className="text-2xl font-bold text-white">{votedDisputes.length}</div>
                            <div className="text-[10px] text-text-secondary uppercase">Voted</div>
                        </div>
                        <div>
                            <Award size={24} className="mx-auto mb-2 text-brand" />
                            <div className="text-2xl font-bold text-white">--</div>
                            <div className="text-[10px] text-text-secondary uppercase">Accuracy</div>
                        </div>
                    </div>
                </div>

                {/* Pending Disputes */}
                {pendingDisputes.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-bold text-brand uppercase mb-4 font-mono flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Pending_Votes ({pendingDisputes.length})
                        </h2>
                        <div className="space-y-3">
                            {pendingDisputes.map(dispute => (
                                <DisputeCard
                                    key={dispute.id}
                                    dispute={dispute}
                                    onSelect={() => setSelectedDispute(dispute)}
                                    timeRemaining={getVotingTimeRemaining(dispute)}
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

            {/* Vote Modal */}
            {selectedDispute && (
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
        </div>
    )
}

// Dispute Card Component
function DisputeCard({
    dispute,
    onSelect,
    voted = false,
    userVote,
    timeRemaining,
}: {
    dispute: Dispute
    onSelect?: () => void
    voted?: boolean
    userVote?: boolean
    timeRemaining?: number
}) {
    return (
        <div
            className={`border p-4 font-mono ${voted
                ? 'border-border bg-surface/20'
                : 'border-brand/50 bg-brand/5 cursor-pointer hover:border-brand'
                }`}
            onClick={!voted ? onSelect : undefined}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="text-[10px] text-text-secondary uppercase">
                        Dispute #{dispute.id.slice(-8)}
                    </div>
                    <div className="text-lg font-bold text-white">
                        ${dispute.amount.toFixed(2)} USDC
                    </div>
                </div>
                {timeRemaining !== undefined && timeRemaining > 0 && (
                    <div className="text-right">
                        <div className="text-[10px] text-text-secondary uppercase">Time Left</div>
                        <div className="text-sm font-bold text-yellow-500">
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

            <div className="flex gap-4 mt-3 text-[10px]">
                <div className="text-blue-400">
                    Votes for Buyer: {dispute.votesForBuyer}
                </div>
                <div className="text-orange-400">
                    Votes for Seller: {dispute.votesForSeller}
                </div>
            </div>
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
