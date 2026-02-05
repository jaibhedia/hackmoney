"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
    ChevronLeft, User, Shield, TrendingUp, Award, Clock, 
    CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink,
    Star, Coins, History, Settings, AtSign, Loader2, Check, LogOut
} from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { useStaking, TIER_CONFIG, type Tier } from "@/hooks/useStaking"
import { useTrustScore } from "@/hooks/useTrustScore"
import { useUwuName } from "@/hooks/useUwuName"
import { useENS } from "@/hooks/useENS"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { WalletConnect } from "@/components/app/wallet-connect"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * User/LP Profile Page
 * 
 * Shows:
 * - Reputation Score
 * - Tier and staking info
 * - Trade history summary
 * - LP status and earnings
 */

export default function ProfilePage() {
    const router = useRouter()
    const { isConnected, address, balance, displayName, disconnect } = useWallet()
    const { stakeProfile, isLoading: stakeLoading, fetchStakeProfile } = useStaking()
    const { trustData, isLoading: trustLoading } = useTrustScore()
    const { uwuName, isLoading: uwuLoading, register, checkAvailability } = useUwuName(address || undefined)
    const { ensName: ethEnsName, isLoading: ensLoading } = useENS(address || undefined)
    const [mounted, setMounted] = useState(false)
    const [copied, setCopied] = useState(false)
    
    // Name registration state
    const [nameInput, setNameInput] = useState("")
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
    const [isChecking, setIsChecking] = useState(false)
    const [isRegistering, setIsRegistering] = useState(false)
    const [registerError, setRegisterError] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
        if (address) {
            fetchStakeProfile()
        }
    }, [address, fetchStakeProfile])
    
    // Check name availability with debounce
    useEffect(() => {
        if (!nameInput || nameInput.length < 3) {
            setIsAvailable(null)
            return
        }
        
        const timer = setTimeout(async () => {
            setIsChecking(true)
            const available = await checkAvailability(nameInput)
            setIsAvailable(available)
            setIsChecking(false)
        }, 500)
        
        return () => clearTimeout(timer)
    }, [nameInput, checkAvailability])
    
    const handleRegisterName = async () => {
        if (!nameInput || !isAvailable) return
        
        setIsRegistering(true)
        setRegisterError(null)
        
        const result = await register(nameInput)
        if (result.success) {
            setNameInput("")
            setIsAvailable(null)
        } else {
            setRegisterError(result.error || "Registration failed")
        }
        
        setIsRegistering(false)
    }
    
    // Display name priority: ENS .eth > registered .uwu > auto-generated
    const resolvedDisplayName = ethEnsName || uwuName || displayName || 'Anonymous'

    const handleCopyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleDisconnect = async () => {
        await disconnect()
        router.push('/')
    }

    const getTierColor = (tier: Tier) => {
        const colors: Record<Tier, string> = {
            Starter: 'bg-gray-500',
            Bronze: 'bg-orange-500',
            Silver: 'bg-slate-400',
            Gold: 'bg-yellow-500',
            Diamond: 'bg-blue-500'
        }
        return colors[tier]
    }

    const getTierGradient = (tier: Tier) => {
        const gradients: Record<Tier, string> = {
            Starter: 'from-gray-500 to-gray-700',
            Bronze: 'from-orange-400 to-orange-600',
            Silver: 'from-slate-300 to-slate-500',
            Gold: 'from-yellow-400 to-yellow-600',
            Diamond: 'from-blue-400 to-blue-600'
        }
        return gradients[tier]
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-400'
        if (score >= 70) return 'text-yellow-400'
        if (score >= 50) return 'text-orange-400'
        return 'text-red-400'
    }

    const getScoreGradient = (score: number) => {
        if (score >= 90) return 'from-green-500 to-emerald-500'
        if (score >= 70) return 'from-yellow-500 to-orange-500'
        if (score >= 50) return 'from-orange-500 to-red-500'
        return 'from-red-500 to-red-700'
    }

    if (!mounted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-background">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="text-text-secondary hover:text-text-primary">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-text-primary">Profile</h1>
                </div>
                
                <div className="bg-surface border border-border p-6 text-center">
                    <User className="w-16 h-16 text-brand mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-text-primary mb-2">Connect to View Profile</h2>
                    <p className="text-sm text-text-secondary mb-6">
                        Connect your wallet to view your reputation and trading history
                    </p>
                    <WalletConnect />
                </div>
            </div>
        )
    }

    const currentTier = stakeProfile?.tier || 'Starter'
    const trustScore = trustData?.score || 85 // Default score for demo

    return (
        <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4 border-dashed">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-text-secondary hover:text-brand">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold uppercase text-brand">USER_PROFILE</h1>
                        <p className="text-[10px] text-text-secondary uppercase">IDENTITY_MODULE_V2</p>
                    </div>
                </div>
                <Link href="/settings" className="p-2 text-text-secondary hover:text-brand">
                    <Settings className="w-5 h-5" />
                </Link>
            </div>

            {/* Profile Card */}
            <div className="bg-surface border border-border p-6 mb-6">
                {/* Avatar and Name */}
                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTierGradient(currentTier)} flex items-center justify-center`}>
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xl font-bold text-text-primary">{resolvedDisplayName}</div>
                        <div className="flex items-center gap-2 mt-1">
                            {ethEnsName && (
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                                    .eth
                                </Badge>
                            )}
                            {uwuName && (
                                <Badge variant="outline" className="text-[10px] bg-brand/10 text-brand border-brand/30">
                                    .uwu
                                </Badge>
                            )}
                            <span className="text-xs text-text-secondary font-mono">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                            <button onClick={handleCopyAddress} className="text-text-secondary hover:text-brand">
                                {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>
                    <Badge className={`${getTierColor(currentTier)} text-white`}>
                        {currentTier}
                    </Badge>
                </div>

                {/* Balance */}
                <div className="bg-background/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs text-text-secondary uppercase mb-1">Wallet Balance</div>
                            <div className="text-2xl font-bold text-text-primary">{balance.toFixed(2)} USDC</div>
                        </div>
                        <Coins className="w-8 h-8 text-brand" />
                    </div>
                </div>

                {/* LP Status */}
                {stakeProfile?.isLP && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-500" />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-green-400">Active LP</div>
                            <div className="text-xs text-green-500/70">Earning rewards on matched orders</div>
                        </div>
                    </div>
                )}
            </div>

            {/* .uwu Name Registration */}
            <div className="bg-surface border border-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <AtSign className="w-5 h-5 text-brand" />
                    <h2 className="font-bold text-text-primary uppercase">.uwu Name</h2>
                </div>
                
                {uwuName ? (
                    <div className="bg-brand/10 border border-brand/20 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
                                <Check className="w-5 h-5 text-brand" />
                            </div>
                            <div className="flex-1">
                                <div className="text-lg font-bold text-brand">{uwuName}</div>
                                <div className="text-xs text-text-secondary">Your registered uWu identity</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-text-secondary">
                            Register a unique .uwu name. Others can send you payments using just your name!
                        </p>
                        
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Input
                                    placeholder="yourname"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                    className="pr-16"
                                    disabled={isRegistering}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                                    .uwu
                                </span>
                            </div>
                        </div>
                        
                        {/* Availability Status */}
                        {nameInput.length > 0 && nameInput.length < 3 && (
                            <p className="text-xs text-yellow-500">Name must be at least 3 characters</p>
                        )}
                        
                        {nameInput.length >= 3 && (
                            <div className="flex items-center gap-2">
                                {isChecking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
                                        <span className="text-sm text-text-secondary">Checking availability...</span>
                                    </>
                                ) : isAvailable === true ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-green-500">{nameInput}.uwu is available!</span>
                                    </>
                                ) : isAvailable === false ? (
                                    <>
                                        <XCircle className="w-4 h-4 text-red-500" />
                                        <span className="text-sm text-red-500">{nameInput}.uwu is taken</span>
                                    </>
                                ) : null}
                            </div>
                        )}
                        
                        {registerError && (
                            <p className="text-xs text-red-500">{registerError}</p>
                        )}
                        
                        <Button
                            onClick={handleRegisterName}
                            disabled={!isAvailable || isRegistering || nameInput.length < 3}
                            className="w-full bg-brand hover:bg-brand/90 text-white"
                        >
                            {isRegistering ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Registering...
                                </>
                            ) : (
                                'Register Name'
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Reputation Score */}
            <div className="bg-surface border border-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-brand" />
                    <h2 className="font-bold text-text-primary uppercase">Reputation Score</h2>
                </div>

                {/* Score Display */}
                <div className="relative mb-6">
                    <div className="flex items-center justify-center">
                        <div className="relative w-32 h-32">
                            {/* Background Circle */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="none"
                                    className="text-border"
                                />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="url(#scoreGradient)"
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={`${(trustScore / 100) * 352} 352`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={trustScore >= 70 ? '#22c55e' : '#f97316'} />
                                        <stop offset="100%" stopColor={trustScore >= 70 ? '#10b981' : '#ef4444'} />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-3xl font-bold ${getScoreColor(trustScore)}`}>
                                    {trustScore}
                                </span>
                                <span className="text-xs text-text-secondary uppercase">/ 100</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Completed Trades</span>
                        <span className="text-text-primary font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {stakeProfile?.completedTrades || 12}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Disputes Won</span>
                        <span className="text-text-primary font-medium flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-500" />
                            {Math.max(0, (trustData?.disputes || 2) - (trustData?.disputesLost || 0))}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Disputes Lost</span>
                        <span className="text-text-primary font-medium flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-500" />
                            {stakeProfile?.disputesLost || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Account Age</span>
                        <span className="text-text-primary font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-500" />
                            {trustData?.accountAge ? `${trustData.accountAge} days` : '45 days'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Staking Info */}
            <div className="bg-surface border border-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-brand" />
                    <h2 className="font-bold text-text-primary uppercase">Staking</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-background/50 rounded-lg p-3">
                        <div className="text-xs text-text-secondary uppercase mb-1">Base Stake</div>
                        <div className="text-lg font-bold text-text-primary">
                            {stakeProfile?.baseStake.toFixed(2) || '0.00'} USDC
                        </div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3">
                        <div className="text-xs text-text-secondary uppercase mb-1">Trading Limit</div>
                        <div className="text-lg font-bold text-text-primary">
                            ₹{stakeProfile?.tradingLimit.toLocaleString() || '5,000'}
                        </div>
                    </div>
                </div>

                {/* Tier Progress */}
                <div className="space-y-3">
                    {TIER_CONFIG.slice(0, 4).map((tier, index) => {
                        const isCurrentTier = tier.name === currentTier
                        const isPastTier = TIER_CONFIG.findIndex(t => t.name === currentTier) > index
                        
                        return (
                            <div key={tier.name} className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    isPastTier || isCurrentTier ? getTierColor(tier.name) : 'bg-border'
                                }`}>
                                    {isPastTier ? (
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    ) : (
                                        <span className="text-xs text-white">{index + 1}</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className={`text-sm ${isCurrentTier ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                                        {tier.name}
                                    </div>
                                </div>
                                <div className="text-xs text-text-secondary">
                                    ${tier.stakeRequired}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <Link
                    href="/stake"
                    className="mt-4 block w-full py-3 bg-brand/10 border border-brand/20 text-brand text-center text-sm font-medium rounded-lg hover:bg-brand/20 transition-colors"
                >
                    Manage Stake
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Link
                    href="/orders"
                    className="bg-surface border border-border p-4 text-center hover:border-brand/50 transition-colors"
                >
                    <History className="w-6 h-6 text-brand mx-auto mb-2" />
                    <div className="text-sm font-medium text-text-primary">Order History</div>
                </Link>
                <Link
                    href="/dao"
                    className="bg-surface border border-border p-4 text-center hover:border-brand/50 transition-colors"
                >
                    <Award className="w-6 h-6 text-brand mx-auto mb-2" />
                    <div className="text-sm font-medium text-text-primary">DAO Disputes</div>
                </Link>
            </div>

            {/* Logout Button */}
            <button 
                onClick={handleDisconnect}
                className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
            >
                <LogOut className="w-5 h-5" />
                Disconnect Wallet
            </button>
        </div>
    )
}
