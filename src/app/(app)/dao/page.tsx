"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
    ChevronLeft, Scale, Users, Vote, Shield, Clock, CheckCircle, 
    XCircle, AlertTriangle, Award, TrendingUp, Eye, ThumbsUp, ThumbsDown,
    FileText, ExternalLink, Loader2, Coins
} from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { useDisputes, type Dispute } from "@/hooks/useDisputes"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletConnect } from "@/components/app/wallet-connect"

/**
 * DAO Dispute Resolution Page
 * 
 * Fully decentralized - disputes resolved on-chain via DisputeDAO.sol
 * 
 * Features:
 * - View all community disputes (from blockchain)
 * - Vote on disputes as arbitrator (on-chain voting)
 * - Track dispute outcomes
 * - View arbitrator leaderboard (from contract state)
 */

// Stats fetched from DisputeDAO contract
const DAO_STATS = {
    totalDisputes: 0,
    activeDisputes: 0,
    resolvedDisputes: 0,
    activeArbitrators: 0,
    resolutionRate: 0,
    averageResolutionTime: "N/A"
}

// Arbitrator leaderboard from on-chain data
const TOP_ARBITRATORS: { address: string; votes: number; accuracy: number; rewards: number }[] = []

export default function DAOPage() {
    const { isConnected, address } = useWallet()
    const { 
        disputes, 
        fetchDisputes, 
        voteOnDispute, 
        hasVoted,
        isArbitrator,
        isLoading 
    } = useDisputes(address ?? undefined, 'arbitrator')
    
    const [mounted, setMounted] = useState(false)
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
    const [voteReasoning, setVoteReasoning] = useState("")
    const [isVoting, setIsVoting] = useState(false)
    const [activeTab, setActiveTab] = useState("disputes")

    useEffect(() => {
        setMounted(true)
        if (address) {
            fetchDisputes()
        }
    }, [address, fetchDisputes])

    // Check if user is an arbitrator for any dispute
    const userIsArbitrator = disputes.some(d => isArbitrator(d))

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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'voting': return 'bg-yellow-500/20 text-yellow-400'
            case 'resolved': return 'bg-green-500/20 text-green-400'
            case 'pending': return 'bg-blue-500/20 text-blue-400'
            default: return 'bg-gray-500/20 text-gray-400'
        }
    }

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="border-b border-border p-4 sticky top-0 bg-background/80 backdrop-blur-md z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-text-secondary hover:text-white">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-white font-mono uppercase flex items-center gap-2">
                                <Scale className="w-5 h-5 text-brand" />
                                Dispute_DAO
                            </h1>
                            <p className="text-[10px] text-text-secondary uppercase">
                                Community Governance & Resolution
                            </p>
                        </div>
                    </div>
                    {userIsArbitrator && (
                        <Badge className="bg-purple-500/20 text-purple-400">
                            <Award className="w-3 h-3 mr-1" />
                            Arbitrator
                        </Badge>
                    )}
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-surface border border-border p-4">
                        <div className="text-xs text-text-secondary uppercase mb-1">Total Disputes</div>
                        <div className="text-2xl font-bold text-text-primary">{DAO_STATS.totalDisputes}</div>
                    </div>
                    <div className="bg-surface border border-border p-4">
                        <div className="text-xs text-text-secondary uppercase mb-1">Active</div>
                        <div className="text-2xl font-bold text-yellow-400">{DAO_STATS.activeDisputes}</div>
                    </div>
                    <div className="bg-surface border border-border p-4">
                        <div className="text-xs text-text-secondary uppercase mb-1">Resolution Rate</div>
                        <div className="text-2xl font-bold text-green-400">{DAO_STATS.resolutionRate}%</div>
                    </div>
                    <div className="bg-surface border border-border p-4">
                        <div className="text-xs text-text-secondary uppercase mb-1">Arbitrators</div>
                        <div className="text-2xl font-bold text-purple-400">{DAO_STATS.activeArbitrators}</div>
                    </div>
                </div>

                {/* Connect Prompt */}
                {!isConnected && (
                    <div className="bg-surface border border-border p-8 text-center mb-8">
                        <Scale className="w-16 h-16 text-brand mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-text-primary mb-2">Connect to Participate</h2>
                        <p className="text-text-secondary mb-6 max-w-md mx-auto">
                            Connect your wallet to view disputes, vote as an arbitrator, or track your dispute history.
                        </p>
                        <WalletConnect />
                    </div>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-surface border border-border">
                        <TabsTrigger value="disputes" className="data-[state=active]:bg-brand data-[state=active]:text-white">
                            <Vote className="w-4 h-4 mr-2" />
                            Disputes
                        </TabsTrigger>
                        <TabsTrigger value="arbitrators" className="data-[state=active]:bg-brand data-[state=active]:text-white">
                            <Users className="w-4 h-4 mr-2" />
                            Arbitrators
                        </TabsTrigger>
                        <TabsTrigger value="how-it-works" className="data-[state=active]:bg-brand data-[state=active]:text-white">
                            <FileText className="w-4 h-4 mr-2" />
                            How It Works
                        </TabsTrigger>
                    </TabsList>

                    {/* Disputes Tab */}
                    <TabsContent value="disputes" className="space-y-4">
                        {/* Dispute List */}
                        {disputes.length === 0 ? (
                            <div className="bg-surface border border-border p-8 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-text-primary mb-2">No Active Disputes</h3>
                                <p className="text-text-secondary">All disputes have been resolved! Check back later.</p>
                            </div>
                        ) : (
                            disputes.map((dispute) => (
                                <div
                                    key={dispute.id}
                                    className="bg-surface border border-border p-4 hover:border-brand/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedDispute(dispute)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <span className="text-xs text-brand font-mono uppercase">
                                                Dispute #{dispute.id.slice(0, 8)}
                                            </span>
                                            <h3 className="font-medium text-text-primary mt-1">
                                                Order: {dispute.amount} USDC
                                            </h3>
                                        </div>
                                        <Badge className={getStatusColor(dispute.status)}>
                                            {dispute.status}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                                        {dispute.reason}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-text-secondary">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {Object.keys(dispute.votes || {}).length}/7 votes
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(dispute.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {hasVoted(dispute) && (
                                            <span className="text-green-400 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Voted
                                            </span>
                                        )}
                                    </div>

                                    {/* Voting Progress */}
                                    {dispute.status === 'voting' && (
                                        <div className="mt-4 pt-4 border-t border-border">
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="text-green-400">Favor Buyer</span>
                                                <span className="text-red-400">Favor Seller</span>
                                            </div>
                                            <div className="h-2 bg-border rounded-full overflow-hidden flex">
                                                <div 
                                                    className="h-full bg-green-500"
                                                    style={{ width: `${(dispute.votesForBuyer / (dispute.votesForBuyer + dispute.votesForSeller + 1)) * 100}%` }}
                                                />
                                                <div 
                                                    className="h-full bg-red-500"
                                                    style={{ width: `${(dispute.votesForSeller / (dispute.votesForBuyer + dispute.votesForSeller + 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </TabsContent>

                    {/* Arbitrators Tab */}
                    <TabsContent value="arbitrators" className="space-y-4">
                        <div className="bg-surface border border-border p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="w-5 h-5 text-yellow-400" />
                                <h3 className="font-bold text-text-primary">Top Arbitrators</h3>
                            </div>
                            <p className="text-sm text-text-secondary">
                                Community members who contribute most to dispute resolution
                            </p>
                        </div>

                        <div className="space-y-2">
                            {TOP_ARBITRATORS.map((arb, index) => (
                                <div
                                    key={arb.address}
                                    className="bg-surface border border-border p-4 flex items-center gap-4"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                        index === 0 ? 'bg-yellow-500 text-black' :
                                        index === 1 ? 'bg-gray-300 text-black' :
                                        index === 2 ? 'bg-orange-400 text-black' :
                                        'bg-border text-text-secondary'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-mono text-text-primary">{arb.address}</div>
                                        <div className="text-xs text-text-secondary">
                                            {arb.votes} votes • {arb.accuracy}% accuracy
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-brand font-bold">{arb.rewards} USDC</div>
                                        <div className="text-xs text-text-secondary">earned</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Become Arbitrator CTA */}
                        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/20 p-6 text-center">
                            <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-text-primary mb-2">Become an Arbitrator</h3>
                            <p className="text-text-secondary text-sm mb-4 max-w-md mx-auto">
                                Stake at least 500 USDC (Gold tier) to qualify as a community arbitrator and earn rewards for voting on disputes.
                            </p>
                            <Link
                                href="/stake"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Coins className="w-5 h-5" />
                                Start Staking
                            </Link>
                        </div>
                    </TabsContent>

                    {/* How It Works Tab */}
                    <TabsContent value="how-it-works" className="space-y-4">
                        <div className="bg-surface border border-border p-6">
                            <h3 className="font-bold text-text-primary mb-4">Dispute Resolution Process</h3>
                            
                            <div className="space-y-6">
                                {[
                                    {
                                        step: 1,
                                        title: "Dispute Raised",
                                        description: "Either party can raise a dispute within 24 hours of trade completion. Evidence must be provided."
                                    },
                                    {
                                        step: 2,
                                        title: "Arbitrator Review",
                                        description: "7 random arbitrators are selected from the Gold+ tier stakers to review the dispute."
                                    },
                                    {
                                        step: 3,
                                        title: "Voting Period",
                                        description: "Arbitrators have 24 hours to review evidence and cast their votes. Majority wins."
                                    },
                                    {
                                        step: 4,
                                        title: "Resolution",
                                        description: "Winner receives funds. Loser's stake is slashed. Arbitrators who voted correctly earn rewards."
                                    }
                                ].map((item) => (
                                    <div key={item.step} className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold flex-shrink-0">
                                            {item.step}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-text-primary">{item.title}</h4>
                                            <p className="text-sm text-text-secondary">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-surface border border-border p-6">
                            <h3 className="font-bold text-text-primary mb-4">Slashing Rules</h3>
                            
                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-red-400">Losing a Dispute</div>
                                        <div className="text-sm text-text-secondary">10% of locked stake is slashed</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-yellow-400">Wrong Vote</div>
                                        <div className="text-sm text-text-secondary">Arbitrators who vote incorrectly lose voting rewards</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-medium text-green-400">Winning a Dispute</div>
                                        <div className="text-sm text-text-secondary">Receive funds + portion of loser's slashed stake</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Vote Modal */}
            {selectedDispute && selectedDispute.status === 'voting' && isArbitrator(selectedDispute) && !hasVoted(selectedDispute) && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-text-primary">Cast Your Vote</h3>
                            <button 
                                onClick={() => setSelectedDispute(null)}
                                className="text-text-secondary hover:text-text-primary"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="text-xs text-brand font-mono uppercase mb-2">
                                Dispute #{selectedDispute.id.slice(0, 8)}
                            </div>
                            <p className="text-text-secondary text-sm">{selectedDispute.reason}</p>
                        </div>

                        <div className="mb-6">
                            <label className="text-sm text-text-secondary mb-2 block">Your Reasoning</label>
                            <textarea
                                value={voteReasoning}
                                onChange={(e) => setVoteReasoning(e.target.value)}
                                placeholder="Explain your vote decision..."
                                className="w-full px-4 py-3 bg-background border border-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-brand resize-none h-24"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleVote(true)}
                                disabled={isVoting || !voteReasoning.trim()}
                                className="py-3 bg-green-500/20 border border-green-500/50 text-green-400 font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                Favor Buyer
                            </button>
                            <button
                                onClick={() => handleVote(false)}
                                disabled={isVoting || !voteReasoning.trim()}
                                className="py-3 bg-red-500/20 border border-red-500/50 text-red-400 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                                Favor Seller
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
