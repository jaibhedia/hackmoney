"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Scale, Users, Vote, Shield, ArrowUpRight } from "lucide-react"

export function DAOSection() {
    return (
        <section id="dao" className="py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#2d1b4e_0%,_transparent_60%)] opacity-30 z-0" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                            <Scale className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-400 text-sm font-medium">Community Governance</span>
                        </div>
                        
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                            Dispute Resolution <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">DAO</span>
                        </h2>
                        
                        <p className="text-gray-400 text-lg mb-8">
                            Our community-driven dispute resolution ensures fair outcomes for every trade. 
                            Qualified arbitrators vote on disputes, with transparent on-chain governance.
                        </p>
                        
                        {/* Features */}
                        <div className="space-y-4 mb-8">
                            {[
                                { icon: Users, title: "Community Arbitrators", desc: "Qualified stakers can become arbitrators" },
                                { icon: Vote, title: "Democratic Voting", desc: "Multi-sig voting ensures fair decisions" },
                                { icon: Shield, title: "Stake Protection", desc: "Losers are slashed, winners are protected" }
                            ].map((feature, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <feature.icon className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{feature.title}</div>
                                        <div className="text-sm text-gray-500">{feature.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <Link
                            href="/dao"
                            className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-all group"
                        >
                            <Scale className="w-5 h-5" />
                            Enter Dispute DAO
                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                    </motion.div>
                    
                    {/* Visual */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="relative bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/20 rounded-3xl p-8">
                            {/* Dispute Resolution Visual */}
                            <div className="bg-black/40 rounded-2xl p-6 border border-white/10 mb-4">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs text-purple-400 font-mono uppercase">On-Chain DAO</span>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Live</span>
                                </div>
                                <div className="text-white font-medium mb-2">Decentralized Dispute Resolution</div>
                                <div className="text-sm text-gray-500 mb-4">3 arbitrators vote on each dispute</div>
                                
                                {/* How it works */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs">1</span>
                                        <span>Dispute raised on-chain</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs">2</span>
                                        <span>3 arbitrators randomly selected</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <span className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs">3</span>
                                        <span>Majority vote wins, funds released</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Features */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-black/30 rounded-xl">
                                    <div className="text-2xl font-bold text-white">4hr</div>
                                    <div className="text-xs text-gray-500">Max Resolution</div>
                                </div>
                                <div className="text-center p-4 bg-black/30 rounded-xl">
                                    <div className="text-2xl font-bold text-white">3</div>
                                    <div className="text-xs text-gray-500">Arbitrators</div>
                                </div>
                                <div className="text-center p-4 bg-black/30 rounded-xl">
                                    <div className="text-2xl font-bold text-white">0.5%</div>
                                    <div className="text-xs text-gray-500">Arb Reward</div>
                                </div>
                            </div>
                            
                            {/* Glow */}
                            <div className="absolute -inset-4 bg-purple-500/10 blur-3xl -z-10 rounded-3xl" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
