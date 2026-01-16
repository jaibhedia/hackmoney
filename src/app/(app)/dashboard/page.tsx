"use client"

import Link from "next/link"
import { ArrowUpRight, ArrowDownLeft, Scan, Users, Gift, Activity } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Dashboard() {
    return (
        <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-background text-text-primary transition-colors duration-300">

            {/* Header / Identity */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand flex items-center justify-center">
                        <span className="text-white font-bold font-mono text-sm">uW</span>
                    </div>
                    <div>
                        <span className="font-bold text-text-primary tracking-tight">TERMINAL</span>
                        <span className="text-[10px] text-brand font-mono ml-2">v2.0.4</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs text-success font-mono uppercase">Online</span>
                    </div>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-2 gap-3">

                {/* Net Worth - Full Width */}
                <div className="col-span-2 bg-surface border border-border p-5">
                    <p className="text-xs text-text-secondary font-mono mb-2 uppercase tracking-wider">Total Net Worth</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-text-primary font-mono tracking-tighter">$2,480.00</span>
                        <span className="text-sm text-brand font-mono">+12.4%</span>
                    </div>
                </div>

                {/* Quick Actions - Grid of 3 */}
                <Link href="/buy" className="bg-surface border border-border p-4 hover:border-brand transition-colors group">
                    <div className="mb-3 w-8 h-8 flex items-center justify-center bg-brand-light group-hover:bg-brand transition-colors">
                        <ArrowDownLeft className="w-4 h-4 text-brand group-hover:text-white" />
                    </div>
                    <p className="text-sm font-bold text-text-primary uppercase">Buy</p>
                </Link>

                <Link href="/sell" className="bg-surface border border-border p-4 hover:border-brand transition-colors group">
                    <div className="mb-3 w-8 h-8 flex items-center justify-center bg-brand-light group-hover:bg-brand transition-colors">
                        <ArrowUpRight className="w-4 h-4 text-brand group-hover:text-white" />
                    </div>
                    <p className="text-sm font-bold text-text-primary uppercase">Sell</p>
                </Link>

                <div className="bg-surface border border-border p-4">
                    <p className="text-xs text-text-secondary font-mono mb-2 uppercase">Limit</p>
                    <p className="text-lg font-bold text-text-primary font-mono">$150</p>
                    <div className="w-full h-1 bg-border mt-2">
                        <div className="h-full w-[20%] bg-brand"></div>
                    </div>
                </div>

                <Link href="/scan" className="bg-surface border border-border p-4 hover:border-brand transition-colors group">
                    <div className="mb-3 w-8 h-8 flex items-center justify-center bg-brand-light group-hover:bg-brand transition-colors">
                        <Scan className="w-4 h-4 text-brand group-hover:text-white" />
                    </div>
                    <p className="text-sm font-bold text-text-primary uppercase">Scan</p>
                </Link>

                {/* Rewards / Referral - Full Width Banner */}
                <div className="col-span-2 bg-surface border border-border p-0 flex">
                    <div className="p-4 flex-1 border-r border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <Gift className="w-4 h-4 text-brand" />
                            <span className="text-xs text-text-primary font-bold uppercase">Rewards</span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary font-mono">0<span className="text-sm text-text-secondary ml-1">USDC</span></p>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-brand" />
                            <span className="text-xs text-text-primary font-bold uppercase">Referrals</span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary font-mono">0<span className="text-sm text-text-secondary ml-1">Friends</span></p>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="col-span-2 mt-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-4 h-4 text-brand" />
                            Live Feed
                        </h3>
                        <span className="text-xs text-brand font-mono animate-pulse">SYNCED</span>
                    </div>

                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-surface border border-border p-3 flex items-center justify-between hover:border-text-secondary transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-xs font-mono text-text-secondary">14:2{i}</div>
                                    <div className="text-sm text-text-primary font-medium">Bought USDC</div>
                                </div>
                                <div className="text-sm font-mono text-brand">+100.00</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
