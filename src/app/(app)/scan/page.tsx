"use client"

import { useState } from "react"
import { ChevronLeft, Camera, Scan } from "lucide-react"
import Link from "next/link"
import { Numpad } from "@/components/app/numpad"

export default function ScanPage() {
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
                        <h1 className="text-lg font-bold text-text-primary tracking-tight">SCAN & PAY</h1>
                        <p className="text-[10px] text-text-secondary font-mono">TERMINAL_MODE</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                    <span className="text-xs text-brand font-mono">CAMERA_ACTIVE</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col p-4">

                {/* Camera Viewfinder */}
                <div className="relative aspect-square w-full bg-[#000] rounded-xl border-2 border-dashed border-border mb-6 overflow-hidden group">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-border group-hover:text-brand transition-colors" />
                    </div>
                    {/* Corner Reticles */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-brand" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-brand" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-brand" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-brand" />

                    {/* Scan Line Animation */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-brand/50 shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                </div>

                {/* Amount Input */}
                <div className="bg-surface border border-border p-4 mb-4 flex items-center justify-between">
                    <span className="text-xs text-text-secondary font-mono uppercase">Bill Amount</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold font-mono text-text-primary">{amount === "0" ? "0" : amount}</span>
                        <span className="text-sm font-mono text-text-secondary">INR</span>
                    </div>
                </div>

                <div className="flex-1" />

                {/* Numpad Area */}
                <div className="pb-24">
                    <Numpad value={amount} onChange={setAmount} />
                </div>
            </div>
        </div>
    )
}
