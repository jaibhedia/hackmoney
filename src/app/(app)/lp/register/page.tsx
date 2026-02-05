"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
    ChevronLeft, Shield, Coins, Check, AlertTriangle, Loader2, 
    DollarSign, Clock, Users, TrendingUp, Percent, Home
} from "lucide-react"
import { useWallet } from "@/hooks/useWallet"
import { useStaking, TIER_CONFIG } from "@/hooks/useStaking"
import { useTrustScore } from "@/hooks/useTrustScore"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { WalletConnect } from "@/components/app/wallet-connect"
import { useSafeNavigation } from "@/hooks/useSafeNavigation"

/**
 * LP Registration Page
 * 
 * Requirements to become LP:
 * - Minimum 50 USDC stake (Bronze tier)
 * - Account in good standing (trust score >= 70)
 * - Complete onboarding steps
 */

const STEPS = [
    { id: 1, title: 'Requirements', description: 'Check eligibility' },
    { id: 2, title: 'Stake', description: 'Deposit collateral' },
    { id: 3, title: 'Configure', description: 'Set preferences' },
    { id: 4, title: 'Confirm', description: 'Activate LP status' }
]

const MIN_LP_STAKE = 50 // USDC
const RECOMMENDED_STAKE = 500 // USDC for Gold tier

export default function LPRegisterPage() {
    const router = useRouter()
    const { goBack, goHome } = useSafeNavigation()
    const { isConnected, address, balanceFormatted, isLoading: walletLoading } = useWallet()
    const { 
        stakeProfile, 
        isLoading: stakeLoading, 
        depositStake, 
        fetchStakeProfile 
    } = useStaking()
    const { trustData, canBecomeLp } = useTrustScore()

    const [mounted, setMounted] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [stakeAmount, setStakeAmount] = useState("")
    const [isDepositing, setIsDepositing] = useState(false)
    const [isActivating, setIsActivating] = useState(false)
    
    // LP Configuration
    const [marketRate, setMarketRate] = useState<number | null>(null)
    const [minOrder, setMinOrder] = useState("10")
    const [maxOrder, setMaxOrder] = useState("1000")

    // Fetch live INR rate on mount
    useEffect(() => {
        const fetchRate = async () => {
            try {
                const { fetchLiveRates } = await import('@/lib/currency-converter')
                const rates = await fetchLiveRates()
                const inrRate = rates.INR || 83.50
                setMarketRate(inrRate)
            } catch (error) {
                console.error('Failed to fetch rate:', error)
                setMarketRate(83.50)
            }
        }
        fetchRate()
    }, [])

    useEffect(() => {
        setMounted(true)
        if (address) {
            fetchStakeProfile()
        }
    }, [address, fetchStakeProfile])

    // Check if already LP
    useEffect(() => {
        if (stakeProfile?.isLP) {
            router.push('/solver')
        }
    }, [stakeProfile?.isLP, router])

    const currentStake = stakeProfile?.baseStake || 0
    const hasMinStake = currentStake >= MIN_LP_STAKE
    const trustScore = trustData?.score || 50
    
    // LPs can bootstrap trust via stake:
    // - 50+ USDC stake = Trust score treated as 70 (Bronze LP)
    // - 200+ USDC stake = Trust score treated as 80 (Silver LP)
    // - 500+ USDC stake = Trust score treated as 90 (Gold LP)
    const stakeBasedTrust = currentStake >= 500 ? 90 : currentStake >= 200 ? 80 : currentStake >= 50 ? 70 : 0
    const effectiveTrustScore = Math.max(trustScore, stakeBasedTrust)
    const hasGoodStanding = effectiveTrustScore >= 70
    const meetsRequirements = hasMinStake && hasGoodStanding

    const handleDeposit = async () => {
        const amount = parseFloat(stakeAmount)
        if (isNaN(amount) || amount <= 0) return

        // Check if user has enough balance
        const walletBalance = parseFloat(balanceFormatted || '0')
        if (amount > walletBalance) {
            alert(`Insufficient USDC balance!\n\nYou have: ${walletBalance.toFixed(2)} USDC\nTrying to stake: ${amount.toFixed(2)} USDC\n\nPlease send USDC to your wallet address first.`)
            return
        }

        setIsDepositing(true)
        const success = await depositStake(amount)
        setIsDepositing(false)

        if (success) {
            setStakeAmount("")
            await fetchStakeProfile()
            if ((currentStake + amount) >= MIN_LP_STAKE) {
                setCurrentStep(3)
            }
        }
    }

    const handleActivateLP = async () => {
        setIsActivating(true)
        
        try {
            // Call API to register as LP
            const response = await fetch('/api/lp/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    rate: marketRate, // Use live market rate
                    minOrder: parseFloat(minOrder),
                    maxOrder: parseFloat(maxOrder),
                    paymentMethods: ['UPI'], // Only UPI supported
                }),
            })

            const data = await response.json()

            if (data.success) {
                // Redirect to LP dashboard
                router.push('/solver')
            } else {
                alert(data.error || 'Failed to activate LP status')
            }
        } catch (error) {
            console.error('LP activation failed:', error)
            alert('Failed to activate LP status')
        } finally {
            setIsActivating(false)
        }
    }

    if (!mounted) return null

    // Show loading while wallet is initializing
    if (walletLoading) {
        return (
            <div className="min-h-screen bg-background p-4 flex items-center justify-center">
                <div className="text-center font-mono">
                    <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                    <p className="text-text-secondary text-sm uppercase">LOADING_WALLET...</p>
                </div>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-background p-4 flex items-center justify-center">
                <div className="text-center font-mono max-w-sm">
                    <Users className="w-16 h-16 text-brand mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-text-primary mb-2">BECOME_LP</h1>
                    <p className="text-text-secondary text-sm uppercase mb-6">Connect wallet to continue</p>
                    <WalletConnect />
                    <button 
                        onClick={goBack}
                        className="block mt-4 text-xs text-text-secondary hover:text-brand uppercase mx-auto"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border p-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={goBack} className="text-text-secondary hover:text-text-primary">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-text-primary font-mono uppercase">
                                Become_LP
                            </h1>
                            <p className="text-[10px] text-text-secondary uppercase">
                                Liquidity Provider Registration
                            </p>
                        </div>
                    </div>
                    <button onClick={goHome} className="text-text-secondary hover:text-brand">
                        <Home size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Progress Steps */}
                <div className="flex justify-between">
                    {STEPS.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex flex-col items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                    currentStep > step.id 
                                        ? 'bg-success text-white' 
                                        : currentStep === step.id 
                                            ? 'bg-brand text-white' 
                                            : 'bg-surface text-text-secondary'
                                }`}>
                                    {currentStep > step.id ? <Check size={16} /> : step.id}
                                </div>
                                <span className="text-xs text-text-secondary mt-1 text-center">
                                    {step.title}
                                </span>
                            </div>
                            {index < STEPS.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-2 ${
                                    currentStep > step.id ? 'bg-success' : 'bg-border'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                {currentStep === 1 && (
                    <div className="space-y-4">
                        {/* Benefits */}
                        <div className="bg-brand/10 border border-brand rounded-lg p-4">
                            <h3 className="font-bold text-brand mb-3">LP Benefits</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <Percent className="w-5 h-5 text-brand" />
                                    <span className="text-sm">2% fee on trades</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-brand" />
                                    <span className="text-sm">Set your hours</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-brand" />
                                    <span className="text-sm">Your own rates</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-brand" />
                                    <span className="text-sm">Priority matching</span>
                                </div>
                            </div>
                        </div>

                        {/* Requirements Checklist */}
                        <div className="bg-surface border border-border rounded-lg p-4">
                            <h3 className="font-bold text-text-primary mb-4 uppercase text-sm">Requirements</h3>
                            
                            {/* Wallet Balance Info */}
                            <div className="bg-brand/5 border border-brand/20 rounded-lg p-3 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-text-secondary">Wallet Balance</span>
                                    <span className="text-sm font-bold text-brand">${balanceFormatted} USDC</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-text-secondary">Staked in Escrow</span>
                                    <span className="text-sm font-bold text-text-primary">{currentStake.toFixed(2)} USDC</span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {hasMinStake ? (
                                            <Check className="w-5 h-5 text-success" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-warning" />
                                        )}
                                        <div>
                                            <p className="font-bold">Minimum {MIN_LP_STAKE} USDC Stake</p>
                                            <p className="text-xs text-text-secondary">
                                                Staked: {currentStake.toFixed(2)} USDC
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={hasMinStake ? 'success' : 'warning'}>
                                        {hasMinStake ? 'Met' : 'Required'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {hasGoodStanding ? (
                                            <Check className="w-5 h-5 text-success" />
                                        ) : (
                                            <TrendingUp className="w-5 h-5 text-blue-400" />
                                        )}
                                        <div>
                                            <p className="font-bold">Trust Score ≥ 70</p>
                                            <p className="text-xs text-text-secondary">
                                                {hasGoodStanding ? (
                                                    <>Effective: {effectiveTrustScore}</>
                                                ) : (
                                                    <>Current: {trustScore} → <span className="text-blue-400">Will be 70+ after stake</span></>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={hasGoodStanding ? 'success' : 'secondary'}>
                                        {hasGoodStanding ? 'Met' : 'After Stake'}
                                    </Badge>
                                </div>
                            </div>
                            
                            {/* Stake-based trust explanation */}
                            {!hasGoodStanding && (
                                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <p className="text-xs text-green-400 font-bold">
                                        ✅ You have {balanceFormatted} USDC - enough to become a Bronze LP!
                                    </p>
                                    <p className="text-xs text-text-secondary mt-1">
                                        Click "Continue to Stake" below. Once you stake 50+ USDC, your trust score will automatically boost to 70.
                                    </p>
                                </div>
                            )}
                            
                            {/* Wallet address for deposits */}
                            <div className="mt-4 p-3 bg-surface border border-border rounded-lg">
                                <p className="text-xs text-text-secondary mb-1">Your wallet address (for deposits):</p>
                                <div className="bg-black/50 p-2 rounded font-mono text-[10px] break-all text-brand select-all">
                                    {address}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setCurrentStep(hasMinStake ? 3 : 2)}
                            className="w-full py-4 bg-brand text-white rounded-lg font-bold hover:bg-brand/90 transition-colors"
                        >
                            {hasMinStake && hasGoodStanding ? 'Continue to Configuration' : 'Continue to Stake →'}
                        </button>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-4">
                        {/* Need USDC? Show wallet address */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-sm text-blue-400 font-bold mb-2">💡 Need USDC in your wallet first?</p>
                            <p className="text-xs text-text-secondary mb-2">
                                Send USDC on Arc chain to your wallet address:
                            </p>
                            <div className="bg-black/50 p-2 rounded font-mono text-xs break-all text-brand select-all">
                                {address}
                            </div>
                            <p className="text-[10px] text-text-secondary mt-2">
                                Current wallet balance: <span className="text-brand">{balanceFormatted} USDC</span>
                            </p>
                        </div>

                        <div className="bg-surface border border-border rounded-lg p-4">
                            <h3 className="font-bold text-text-primary mb-4">Stake USDC into Escrow</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-text-secondary">Amount to Stake (USDC)</label>
                                    <Input
                                        type="number"
                                        placeholder={`Minimum ${MIN_LP_STAKE} USDC`}
                                        value={stakeAmount}
                                        onChange={(e) => setStakeAmount(e.target.value)}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-text-secondary mt-1">
                                        Wallet Balance: {balanceFormatted} USDC | Staked: {currentStake.toFixed(2)} USDC
                                    </p>
                                </div>

                                {/* Quick amounts */}
                                <div className="flex gap-2">
                                    {[50, 200, 500, 2000].map(amount => (
                                        <button
                                            key={amount}
                                            onClick={() => setStakeAmount(amount.toString())}
                                            className={`flex-1 py-2 text-sm border rounded transition-colors ${
                                                amount === RECOMMENDED_STAKE 
                                                    ? 'border-brand bg-brand/10 text-brand' 
                                                    : 'border-border hover:border-brand'
                                            }`}
                                        >
                                            {amount}
                                            {amount === RECOMMENDED_STAKE && (
                                                <span className="block text-[10px]">Recommended</span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Tier Preview */}
                                {stakeAmount && (
                                    <div className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm text-text-secondary">
                                            With {parseFloat(stakeAmount) + currentStake} USDC stake:
                                        </p>
                                        <p className="font-bold text-brand">
                                            {TIER_CONFIG.find(t => 
                                                (parseFloat(stakeAmount) + currentStake) >= t.stakeRequired
                                            )?.name || 'Starter'} Tier
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentStep(1)}
                                className="flex-1 py-3 border border-border rounded-lg font-bold"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleDeposit}
                                disabled={isDepositing || !stakeAmount || parseFloat(stakeAmount) < (MIN_LP_STAKE - currentStake)}
                                className="flex-1 py-3 bg-brand text-white rounded-lg font-bold disabled:opacity-50"
                            >
                                {isDepositing ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                    'Deposit & Continue'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-4">
                        <div className="bg-surface border border-border rounded-lg p-4">
                            <h3 className="font-bold text-text-primary mb-4">Order Limits</h3>
                            
                            <div className="space-y-4">
                                {/* Show current market rate (read-only) */}
                                <div className="bg-brand/5 border border-brand/20 rounded-lg p-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-text-secondary">Market Rate</span>
                                        <span className="font-bold text-brand">₹{marketRate?.toFixed(2) || '...'}/USDC</span>
                                    </div>
                                    <p className="text-[10px] text-green-400 mt-1">Live from CoinGecko • Auto-updated</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-text-secondary">Min Order (USDC)</label>
                                        <Input
                                            type="number"
                                            value={minOrder}
                                            onChange={(e) => setMinOrder(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-text-secondary">Max Order (USDC)</label>
                                        <Input
                                            type="number"
                                            value={maxOrder}
                                            onChange={(e) => setMaxOrder(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-text-secondary">Payment Method</label>
                                    <div className="flex gap-2 mt-2">
                                        <div className="px-4 py-2 text-sm border border-brand bg-brand/10 text-brand rounded-lg font-bold">
                                            UPI ✓
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-text-secondary mt-1">Only UPI is supported for instant P2P transfers</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentStep(hasMinStake ? 1 : 2)}
                                className="flex-1 py-3 border border-border rounded-lg font-bold"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setCurrentStep(4)}
                                disabled={!minOrder || !maxOrder}
                                className="flex-1 py-3 bg-brand text-white rounded-lg font-bold disabled:opacity-50"
                            >
                                Review
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="space-y-4">
                        <div className="bg-surface border border-border rounded-lg p-4">
                            <h3 className="font-bold text-text-primary mb-4">Confirm LP Registration</h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span className="text-text-secondary">Stake Amount</span>
                                    <span className="font-mono font-bold">{currentStake.toFixed(2)} USDC</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span className="text-text-secondary">Market Rate</span>
                                    <span className="font-mono text-green-400">₹{marketRate?.toFixed(2) || '...'} / USDC (live)</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border">
                                    <span className="text-text-secondary">Order Range</span>
                                    <span className="font-mono">{minOrder} - {maxOrder} USDC</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-text-secondary">Payment Method</span>
                                    <span className="font-mono">UPI</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold text-warning">Important</p>
                                    <p className="text-text-secondary mt-1">
                                        By activating LP status, you agree to fulfill orders promptly. 
                                        Your stake can be slashed for failing to release USDC or fraudulent behavior.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentStep(3)}
                                className="flex-1 py-3 border border-border rounded-lg font-bold"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleActivateLP}
                                disabled={isActivating}
                                className="flex-1 py-3 bg-success text-white rounded-lg font-bold disabled:opacity-50"
                            >
                                {isActivating ? (
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                    'Activate LP Status'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
