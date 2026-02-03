"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { QrCode, Wallet, Coins, Scale } from "lucide-react"
import { useWallet } from "@/hooks/useWallet"

export function Navbar() {
    const { isConnected, isFirstTimeUser } = useWallet()
    
    // If connected and not first time, go to dashboard. Otherwise go to onboarding
    const launchHref = isConnected && !isFirstTimeUser ? '/dashboard' : '/onboarding'
    const launchText = isConnected ? 'Open App' : 'Launch App'

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto backdrop-blur-sm bg-black/50">
            <Link href="/" className="flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#EC4899] flex items-center justify-center">
                    <span className="text-white font-bold text-sm tracking-tighter">uw</span>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">uWu</span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/90">
                <Link href="#scan-pay" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-blue-400" />
                    Scan & Pay
                </Link>
                <Link href="/wallet" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-green-400" />
                    Wallet
                </Link>
                <Link href="#lp-stake" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-purple-400" />
                    Become LP
                </Link>
                <Link href="#dao" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-pink-400" />
                    DAO
                </Link>
            </div>

            <Link
                href={launchHref}
                className="px-6 py-3 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
            >
                {launchText}
            </Link>
        </nav>
    )
}
