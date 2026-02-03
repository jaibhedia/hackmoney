"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Check, QrCode } from "lucide-react"

export function Hero() {
    return (
        <div className="relative pt-32 pb-20 min-h-screen flex items-center overflow-hidden">
            {/* Globe Background Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center_80%,_#1e3a8a_0%,_#000000_60%)] opacity-40 z-0 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold">uw</div>
                        <span className="text-white font-bold">uWu</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight mb-6">
                        Scan. Pay. <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Done.</span>
                    </h1>

                    <p className="text-lg text-gray-400 max-w-md mb-10 leading-relaxed">
                        Pay anywhere that accepts QR codes using USDC. Deposit to your Arc wallet, scan any UPI QR, and our LPs handle the fiat settlement instantly.
                    </p>

                    <div className="space-y-4 mb-10">
                        {[
                            "Deposit & Withdraw USDC on Arc",
                            "Scan any UPI QR to pay",
                            "Instant LP matching & settlement"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-blue-500" />
                                </div>
                                <span className="text-gray-300 font-medium">{item}</span>
                            </div>
                        ))}
                    </div>

                    <Link
                        href="/onboarding"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-all group"
                    >
                        <QrCode className="w-5 h-5" />
                        Start Scanning
                    </Link>
                </motion.div>

                {/* Phone Visual */}
                <motion.div
                    initial={{ opacity: 0, x: 50, rotate: 10 }}
                    animate={{ opacity: 1, x: 0, rotate: 12 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative"
                >
                    {/* Phone Frame */}
                    <div className="relative w-[300px] h-[600px] border-[14px] border-[#202020] rounded-[3rem] bg-black shadow-2xl mx-auto overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-[#202020] rounded-b-xl z-20" />

                        {/* Screen Content */}
                        <div className="w-full h-full bg-[#0a0a0a] pt-14 px-6 flex flex-col items-center">
                            <h3 className="text-white font-bold text-xl mb-8">Scan & Pay</h3>

                            <div className="w-48 h-48 bg-white/10 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center mb-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 animate-pulse" />
                                <div className="w-32 h-32 bg-white p-2 rounded-lg">
                                    {/* Mock QR */}
                                    <div className="w-full h-full bg-black pattern-grid-lg opacity-80" />
                                </div>
                                {/* Scanning Line */}
                                <motion.div
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]"
                                />
                            </div>

                            <div className="bg-white/5 rounded-xl p-3 w-full mb-6">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>You Pay</span>
                                    <span>Merchant Receives</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-bold">2.2 USDC</span>
                                    <span className="text-gray-600">→</span>
                                    <span className="text-white font-bold">₹ 199.34 INR</span>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-bold shadow-lg shadow-purple-500/20">
                                Pay
                            </button>
                        </div>
                    </div>

                    {/* Glow Effect behind phone */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[600px] bg-blue-600/20 blur-[100px] -z-10 rounded-full pointer-events-none" />
                </motion.div>

            </div>
        </div>
    )
}
