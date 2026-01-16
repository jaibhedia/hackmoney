"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export function Hero() {
    return (
        <section className="min-h-screen flex items-center justify-center bg-white pt-16">
            <div className="max-w-6xl mx-auto px-6 py-20">
                <div className="text-center max-w-3xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 rounded-full text-sm text-gray-600 mb-8"
                    >
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Live on Base Network
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight tracking-tight mb-6"
                    >
                        Pay with USDC
                        <br />
                        <span className="text-gray-400">at any QR.</span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed"
                    >
                        Seamlessly trade crypto P2P with instant settlements.
                        AI-powered matching for the best rates.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/dashboard"
                            className="px-8 py-3.5 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-colors"
                        >
                            Open App
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="px-8 py-3.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                        >
                            Learn more →
                        </Link>
                    </motion.div>
                </div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
                >
                    {[
                        { value: "$2.5B+", label: "Volume Traded" },
                        { value: "150K+", label: "Active Users" },
                        { value: "<90s", label: "Settlement Time" },
                        { value: "99.9%", label: "Uptime" },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
