"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { QrCode, Wallet, ArrowDownToLine, ArrowUpFromLine, Eye, Zap, Shield, Users } from "lucide-react"

const FEATURES = [
    {
        icon: ArrowDownToLine,
        title: "Deposit USDC",
        description: "Transfer USDC from your external wallet to your uWu wallet on Arc",
        href: "/wallet?action=deposit",
        color: "from-green-500 to-emerald-500"
    },
    {
        icon: ArrowUpFromLine,
        title: "Withdraw USDC",
        description: "Send USDC from your uWu wallet to any external wallet address",
        href: "/wallet?action=withdraw",
        color: "from-blue-500 to-cyan-500"
    },
    {
        icon: Eye,
        title: "Wallet View",
        description: "View your balance, transaction history, and wallet details on Arc",
        href: "/wallet",
        color: "from-purple-500 to-pink-500"
    },
    {
        icon: QrCode,
        title: "Scan & Pay",
        description: "Scan any UPI QR code, place an order, and get matched to an LP instantly",
        href: "/scan",
        color: "from-orange-500 to-red-500"
    }
]

export function ScanPaySection() {
    return (
        <section id="scan-pay" className="py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a192f_0%,_transparent_60%)] opacity-50 z-0" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                        <QrCode className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-sm font-medium">Scan & Pay with USDC</span>
                    </div>
                    
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        Your Wallet. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Any QR.</span>
                    </h2>
                    
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Deposit USDC to your Arc wallet, scan any UPI QR code, and our LPs handle the fiat payment. 
                        Simple, secure, non-custodial.
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {FEATURES.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link href={feature.href} className="block group h-full">
                                <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all h-full">
                                    {/* Icon */}
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {feature.description}
                                    </p>
                                    
                                    {/* Hover indicator */}
                                    <div className="mt-4 text-sm text-gray-500 group-hover:text-white transition-colors flex items-center gap-1">
                                        Open →
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* How it works */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-12"
                >
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">How Scan & Pay Works</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { step: 1, icon: Wallet, title: "Load Wallet", desc: "Deposit USDC to your Arc wallet" },
                            { step: 2, icon: QrCode, title: "Scan QR", desc: "Scan any UPI/merchant QR code" },
                            { step: 3, icon: Users, title: "LP Match", desc: "Get matched with a liquidity provider" },
                            { step: 4, icon: Zap, title: "Instant Pay", desc: "LP pays the QR, you pay USDC" }
                        ].map((item, index) => (
                            <div key={item.step} className="relative">
                                {index < 3 && (
                                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
                                )}
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 relative">
                                        <item.icon className="w-7 h-7 text-white" />
                                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                                            {item.step}
                                        </span>
                                    </div>
                                    <h4 className="font-medium text-white mb-1">{item.title}</h4>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-12"
                >
                    <Link
                        href="/onboarding"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:opacity-90 transition-all group"
                    >
                        <QrCode className="w-5 h-5" />
                        Start Scanning
                        <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </Link>
                    
                    <p className="text-sm text-gray-500 mt-4">
                        Non-custodial • Instant matching • 24hr dispute protection
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
