"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Numpad } from "@/components/app/numpad"
import { ThemeToggle } from "@/components/theme-toggle"

export default function BuyPage() {
    const [amount, setAmount] = useState("0")

    return (
        <div className="min-h-screen bg-background text-text-primary flex flex-col max-w-md mx-auto relative transition-colors duration-300">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 -ml-2 hover:bg-surface rounded-lg transition-colors">
                        <ChevronLeft className="w-6 h-6 text-text-secondary" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-text-primary tracking-tight">BUY USDC</h1>
                        <p className="text-[10px] text-text-secondary font-mono">TERMINAL_MODE</p>
                    </div>
                </div>
                <ThemeToggle />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-4">

                {/* Input Display box */}
                <div className="bg-surface border border-border p-6 mb-4 flex flex-col items-center justify-center min-h-[160px]">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-bold font-mono text-text-primary tracking-tighter">₹</span>
                        <span className="text-6xl font-bold font-mono text-text-primary tracking-tighter">{amount === "0" ? "00" : amount}</span>
                        <span className="text-4xl font-bold font-mono text-text-secondary animate-pulse">_</span>
                    </div>
                    <p className="text-xs text-text-secondary font-mono uppercase tracking-widest mt-4">Enter Amount (INR)</p>
                </div>

                {/* Conversion Preview */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-surface border border-border p-3">
                        <p className="text-[10px] text-text-secondary uppercase mb-1">Exchange Rate</p>
                        <p className="text-sm font-bold font-mono text-text-primary">1 USDC = 90.42 INR</p>
                    </div>
                    <div className="bg-surface border border-border p-3">
                        <p className="text-[10px] text-text-secondary uppercase mb-1">Est. Receive</p>
                        <p className="text-sm font-bold font-mono text-brand">{(Number(amount) / 90.42).toFixed(2)} USDC</p>
                    </div>
                </div>

                <div className="flex-1" />

                {/* Numpad Area */}
                <div className="pb-24">
                    <Numpad value={amount} onChange={setAmount} />

                    <button
                        className="w-full mt-6 bg-brand text-white font-bold py-4 uppercase tracking-widest hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                        disabled={amount === "0"}
                    >
                        Execute Order
                    </button>
                </div>
            </div>
        </div>
    )
}
