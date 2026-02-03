"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Shield, Coins, TrendingUp, CheckCircle } from "lucide-react"

const TIER_INFO = [
    {
        name: "Bronze",
        stake: 50,
        maxOrder: "₹25,000",
        color: "from-orange-500 to-orange-700",
        features: ["Priority matching", "2% rewards"]
    },
    {
        name: "Silver",
        stake: 200,
        maxOrder: "₹1,00,000",
        color: "from-slate-300 to-slate-500",
        features: ["Priority matching", "Lower fees", "2.5% rewards"]
    },
    {
        name: "Gold",
        stake: 500,
        maxOrder: "₹5,00,000",
        color: "from-yellow-400 to-yellow-600",
        features: ["Priority matching", "Lower fees", "LP access", "3% rewards"]
    },
    {
        name: "Diamond",
        stake: 2000,
        maxOrder: "Unlimited",
        color: "from-blue-400 to-blue-600",
        features: ["All Gold benefits", "API access", "Unlimited orders", "3.5% rewards"]
    }
]

export function LPStakeSection() {
    return (
        <section id="lp-stake" className="py-32 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1a2e_0%,_transparent_70%)] opacity-50 z-0" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                        <Coins className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-400 text-sm font-medium">Become a Liquidity Provider</span>
                    </div>
                    
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        Stake USDC. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Earn Rewards.</span>
                    </h2>
                    
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Become a Liquidity Provider by staking a minimum of 50 USDC. 
                        Your stake determines your maximum order matching value and unlocks exclusive benefits.
                    </p>
                </motion.div>

                {/* Tier Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {TIER_INFO.map((tier, index) => (
                        <motion.div
                            key={tier.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="relative group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl blur-xl" 
                                 style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                            
                            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all h-full">
                                {/* Tier Badge */}
                                <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 bg-gradient-to-r ${tier.color} text-white`}>
                                    {tier.name}
                                </div>
                                
                                {/* Stake Amount */}
                                <div className="mb-4">
                                    <div className="text-3xl font-bold text-white mb-1">
                                        ${tier.stake}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        USDC Stake Required
                                    </div>
                                </div>
                                
                                {/* Max Order */}
                                <div className="mb-6 p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase mb-1">Max Order Value</div>
                                    <div className="text-lg font-bold text-white">{tier.maxOrder}</div>
                                </div>
                                
                                {/* Features */}
                                <ul className="space-y-2">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <Link
                        href="/lp/register"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:opacity-90 transition-all group"
                    >
                        <Shield className="w-5 h-5" />
                        Start as LP with $50
                        <TrendingUp className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    <p className="text-sm text-gray-500 mt-4">
                        Minimum stake: 50 USDC | Earn 2-3.5% on every matched order
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
