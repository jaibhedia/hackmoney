"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ArrowDownLeft, Send, History, Wallet, X, Loader2, QrCode, Users, Scale, Shield, User, Receipt, Settings, ChevronRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { WalletConnect } from "@/components/app/wallet-connect"
import { BottomNav } from "@/components/app/bottom-nav"
import { TierProgress } from "@/components/app/tier-progress"
import { useWallet } from "@/hooks/useWallet"
import { useStaking } from "@/hooks/useStaking"

export default function DashboardPage() {
    const router = useRouter()
    const { isConnected, address, balance, shortAddress, isLoading, isFirstTimeUser } = useWallet()
    const { stakeProfile, fetchStakeProfile } = useStaking()
    const [mounted, setMounted] = useState(false)
    const [showDepositModal, setShowDepositModal] = useState(false)
    const [depositAmount, setDepositAmount] = useState("")
    const [isDepositing, setIsDepositing] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (address) {
            fetchStakeProfile()
        }
    }, [address, fetchStakeProfile])

    // Redirect first-time users to onboarding
    useEffect(() => {
        if (mounted && isConnected && isFirstTimeUser) {
            router.push('/onboarding')
        }
    }, [mounted, isConnected, isFirstTimeUser, router])

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount)
        if (isNaN(amount) || amount <= 0 || !address) return

        setIsDepositing(true)
        // Show user their wallet address to send USDC
        alert(`Send ${amount} USDC to your wallet:\n${address}`)
        setIsDepositing(false)
        setShowDepositModal(false)
        setDepositAmount("")
    }

    if (!mounted) {
        return (
            <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-background">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-surface rounded w-32"></div>
                    <div className="h-40 bg-surface rounded"></div>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-background">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-xl font-bold text-text-primary">uWu</h1>
                    <ThemeToggle />
                </div>

                <div className="bg-surface border border-border p-6 text-center mb-6">
                    <Wallet className="w-16 h-16 text-brand mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-text-primary mb-2">Welcome to uWu</h2>
                    <p className="text-sm text-text-secondary mb-6">
                        Pay with USDC at any UPI QR. Create your wallet to get started.
                    </p>
                    <WalletConnect />
                </div>

                <div className="space-y-3">
                    <div className="bg-surface border border-border p-4">
                        <h3 className="font-bold text-text-primary mb-2">How it works</h3>
                        <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
                            <li>Create wallet & deposit USDC</li>
                            <li>Scan any UPI QR to create order</li>
                            <li>LP pays your QR, you get fiat</li>
                        </ol>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
            {/* Header / System Status */}
            <div className="flex items-center justify-between mb-8 border-b border-border pb-4 border-dashed">
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-wider text-brand">uWu_TERMINAL</h1>
                    <p className="text-xs text-text-secondary uppercase">v2.0.4 [TESTNET]</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold text-success">ONLINE</span>
                </div>
            </div>

            {/* Account Info Block */}
            <div className="mb-8">
                <div className="flex items-center justify-between text-xs text-text-secondary mb-1 uppercase tracking-widest">
                    <span>Accountlink</span>
                    <span>{shortAddress}</span>
                </div>
                <div className="border border-border bg-surface/50 p-6 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 opacity-50">
                        <Wallet className="w-12 h-12 text-border -rotate-12 group-hover:text-brand/20 transition-colors" />
                    </div>

                    <p className="text-xs text-brand mb-2 uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-brand"></span>
                        Available_Balance
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold tracking-tight text-white">${balance.toFixed(2)}</span>
                        <span className="text-sm text-text-muted">USDC</span>
                    </div>

                    <div className="h-px w-full bg-border my-4 border-dashed" />

                    <button
                        onClick={() => setShowDepositModal(true)}
                        className="w-full py-2 border border-dashed border-brand/50 text-brand text-xs font-bold uppercase hover:bg-brand/10 transition-colors flex items-center justify-center gap-2"
                    >
                        [ LOAD_FUNDS ]
                    </button>
                </div>
            </div>

            {/* Tier Progress */}
            <div className="mb-8">
                <h3 className="text-xs text-text-secondary uppercase mb-3 px-1 border-l-2 border-brand pl-2">
                    Trust_Status
                </h3>
                <TierProgress compact showUpgradePrompt />
            </div>

            {/* Command Palette / Actions */}
            <div className="mb-8">
                <h3 className="text-xs text-text-secondary uppercase mb-3 px-1 border-l-2 border-brand pl-2">
                    Quick_Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href="/scan"
                        className="flex flex-col gap-2 p-4 border border-border bg-card hover:border-brand hover:bg-surface-hover transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <QrCode className="w-5 h-5 text-text-secondary group-hover:text-brand transition-colors" />
                            <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">CMD_01</span>
                        </div>
                        <div>
                            <span className="block text-sm font-bold group-hover:text-brand">SCAN_&_PAY</span>
                            <span className="text-[10px] text-text-secondary lowercase">{">>"} scan_upi_qr</span>
                        </div>
                    </Link>

                    <Link
                        href="/wallet"
                        className="flex flex-col gap-2 p-4 border border-border bg-card hover:border-success hover:bg-surface-hover transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <Wallet className="w-5 h-5 text-text-secondary group-hover:text-success transition-colors" />
                            <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">CMD_02</span>
                        </div>
                        <div>
                            <span className="block text-sm font-bold group-hover:text-success">WALLET</span>
                            <span className="text-[10px] text-text-secondary lowercase">{">>"} deposit_withdraw</span>
                        </div>
                    </Link>

                    <Link
                        href="/orders"
                        className="flex flex-col gap-2 p-4 border border-border bg-card hover:border-purple-500 hover:bg-surface-hover transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <Receipt className="w-5 h-5 text-text-secondary group-hover:text-purple-500 transition-colors" />
                            <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">CMD_03</span>
                        </div>
                        <div>
                            <span className="block text-sm font-bold group-hover:text-purple-500">ORDERS</span>
                            <span className="text-[10px] text-text-secondary lowercase">{">>"} view_history</span>
                        </div>
                    </Link>

                    {/* LP Mode - Only show for LPs */}
                    {stakeProfile?.isLP && (
                        <Link
                            href="/solver"
                            className="flex flex-col gap-2 p-4 border border-border bg-card hover:border-warning hover:bg-surface-hover transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <Users className="w-5 h-5 text-text-secondary group-hover:text-warning transition-colors" />
                                <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">LP</span>
                            </div>
                            <div>
                                <span className="block text-sm font-bold group-hover:text-warning">LP_MODE</span>
                                <span className="text-[10px] text-text-secondary lowercase">{">>"} provide_liquidity</span>
                            </div>
                        </Link>
                    )}

                    {/* DAO Access - Only show for Gold+ tier users */}
                    {stakeProfile && ['Gold', 'Diamond'].includes(stakeProfile.tier) && (
                        <Link
                            href="/arbitrator"
                            className="flex flex-col gap-2 p-4 border border-border bg-card hover:border-purple-500 hover:bg-surface-hover transition-all group"
                        >
                            <div className="flex justify-between items-start">
                                <Scale className="w-5 h-5 text-text-secondary group-hover:text-purple-500 transition-colors" />
                                <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">DAO</span>
                            </div>
                            <div>
                                <span className="block text-sm font-bold group-hover:text-purple-500">DAO_VOTING</span>
                                <span className="text-[10px] text-text-secondary lowercase">{">>"} resolve_disputes</span>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* More Options */}
            <div className="mb-8">
                <h3 className="text-xs text-text-secondary uppercase mb-3 px-1 border-l-2 border-brand pl-2">
                    More_Options
                </h3>
                <div className="border border-border bg-surface/50 divide-y divide-border">
                    <Link href="/stake" className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors group">
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-blue-500" />
                            <div>
                                <span className="block text-sm font-medium text-text-primary group-hover:text-brand">Stake USDC</span>
                                <span className="text-[10px] text-text-secondary">Increase your tier & limits</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                    </Link>
                    
                    {/* LP Registration - Show for non-LPs who want to become LPs */}
                    {!stakeProfile?.isLP && stakeProfile && ['Gold', 'Diamond'].includes(stakeProfile.tier) && (
                        <Link href="/lp/register" className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors group">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-warning" />
                                <div>
                                    <span className="block text-sm font-medium text-text-primary group-hover:text-brand">Become an LP</span>
                                    <span className="text-[10px] text-text-secondary">Provide liquidity & earn fees</span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                        </Link>
                    )}
                    
                    <Link href="/profile" className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors group">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-green-500" />
                            <div>
                                <span className="block text-sm font-medium text-text-primary group-hover:text-brand">Profile</span>
                                <span className="text-[10px] text-text-secondary">Reputation & account details</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                    </Link>
                    
                    <Link href="/settings" className="flex items-center justify-between p-4 hover:bg-surface-hover transition-colors group">
                        <div className="flex items-center gap-3">
                            <Settings className="w-5 h-5 text-gray-500" />
                            <div>
                                <span className="block text-sm font-medium text-text-primary group-hover:text-brand">Settings</span>
                                <span className="text-[10px] text-text-secondary">App preferences</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                    </Link>
                </div>
            </div>

            {/* Recent Activity Log */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs text-text-secondary uppercase px-1 border-l-2 border-brand pl-2">System_Logs</h3>
                    <Link href="/orders" className="text-[10px] text-brand hover:underline uppercase">[View_All]</Link>
                </div>

                <div className="border border-border bg-surface/50 text-xs font-mono">
                    <div className="border-b border-border bg-surface p-2 flex justify-between text-text-muted">
                        <span>TIMESTAMP</span>
                        <span>EVENT</span>
                        <span>STATUS</span>
                    </div>
                    {/* Empty State */}
                    <div className="p-8 text-center text-text-secondary">
                        <p className="mb-2">{">"} No recent transactions found in buffer.</p>
                        <p className="opacity-50 text-[10px]">Prepare to execute first order...</p>
                    </div>
                </div>
            </div>

            {/* Deposit Modal (Terminal Style) */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-black border-2 border-brand w-full max-w-sm shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                        <div className="bg-brand text-black px-4 py-2 font-bold flex justify-between items-center">
                            <span>DEPOSIT_USDC.exe</span>
                            <button onClick={() => setShowDepositModal(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-brand text-sm mb-4 font-mono">
                                {">"} INITIATING_TRANSFER_SEQUENCE...<br />
                                {">"} SELECT_AMOUNT:
                            </p>

                            <div className="mb-6">
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-brand">$</span>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        className="w-full bg-black border border-brand/50 p-3 pl-8 text-white font-mono focus:border-brand focus:ring-1 focus:ring-brand outline-none"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[50, 100, 500].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setDepositAmount(amt.toString())}
                                        className="py-2 border border-brand/30 text-brand text-xs hover:bg-brand hover:text-black transition-colors"
                                    >
                                        ${amt}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleDeposit}
                                disabled={!depositAmount || isDepositing}
                                className="w-full py-3 bg-brand text-black font-bold uppercase hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDepositing ? "PROCESSING..." : "CONFIRM_TRANSACTION"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
