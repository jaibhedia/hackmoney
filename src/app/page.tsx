"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Twitter, Linkedin, Youtube, Instagram, Shield, Zap, Globe, Lock } from "lucide-react"

export default function LandingPage() {
  const markets = [
    { name: "USDC", icon: "DollarSign", apy: "12.4%", liquidity: "$420.69M", color: "#3b82f6" },
    { name: "ETH", icon: "Zap", apy: "8.2%", liquidity: "$1.2B", color: "#8b5cf6" },
    { name: "WBTC", icon: "Bitcoin", apy: "6.5%", liquidity: "$890M", color: "#f59e0b" },
  ]

  const features = [
    { title: "Non-Custodial", desc: "You maintain full control of your assets.", icon: Shield },
    { title: "Instant Settlment", desc: "Lightning fast peer-to-peer swaps.", icon: Zap },
    { title: "Global Access", desc: "Trade from anywhere, anytime.", icon: Globe },
    { title: "Audited & Secure", desc: "Top-tier security and regular audits.", icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-x-hidden selection:bg-[#3b82f6] selection:text-white">

      {/* Background Ghosts (Premium Aave style) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="ghost-blob w-[600px] h-[600px] bg-[#3b82f6]/10 top-[-200px] left-[-200px] animate-ghost-flow" style={{ animationDelay: '0s' }} />
        <div className="ghost-blob w-[500px] h-[500px] bg-[#ec4899]/10 top-[20%] right-[-200px] animate-ghost-flow" style={{ animationDelay: '-2s' }} />
        <div className="ghost-blob w-[700px] h-[700px] bg-[#8b5cf6]/10 bottom-[-300px] left-[10%] animate-ghost-flow" style={{ animationDelay: '-4s' }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto backdrop-blur-md sticky top-0 border-b border-white/5 bg-[#050505]/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#ec4899] flex items-center justify-center">
            <span className="text-white font-bold text-sm">uW</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">uWu</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#a3a3a3]">
          <Link href="#" className="hover:text-white transition-colors">Markets</Link>
          <Link href="#" className="hover:text-white transition-colors">Governance</Link>
          <Link href="#" className="hover:text-white transition-colors">Developers</Link>
          <Link href="#" className="hover:text-white transition-colors">Blog</Link>
        </div>

        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors"
        >
          Launch App
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">

        {/* Hero Section */}
        <main className="pt-24 pb-32 text-center md:text-left relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tight leading-[1.1] mb-8">
              The liquidity protocol <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#ec4899]">
                for P2P payments.
              </span>
            </h1>

            <p className="text-xl text-[#a3a3a3] max-w-2xl mb-12 leading-relaxed">
              uWu is a non-custodial decentralized liquidity market protocol where users can participate as liquidity providers or borrowers.
            </p>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <Link
                href="/dashboard"
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#3b82f6] to-[#ec4899] text-white font-bold rounded-full hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-shadow flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#"
                className="w-full md:w-auto px-8 py-4 bg-[#171717] text-white font-bold rounded-full hover:bg-[#262626] transition-colors border border-[#262626]"
              >
                Read the docs
              </Link>
            </div>
          </motion.div>

          {/* Floating Stats Card (Premium style) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="hidden lg:block absolute right-0 top-10 w-[350px]"
          >
            <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl skew-y-[-3deg] hover:skew-y-0 transition-all duration-500 group hover:border-[#3b82f6]/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[#a3a3a3]">Total Market Size</span>
                <span className="text-[#10b981] font-mono group-hover:scale-110 transition-transform">$2.8B</span>
              </div>
              <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                <div className="flex-1">
                  <p className="text-xs text-[#a3a3a3]">Deposit APY</p>
                  <p className="text-xl font-bold text-white">4.2%</p>
                </div>
                <div className="w-[1px] h-8 bg-white/10"></div>
                <div className="flex-1">
                  <p className="text-xs text-[#a3a3a3]">Borrow APY</p>
                  <p className="text-xl font-bold text-[#3b82f6]">5.8%</p>
                </div>
              </div>
            </div>
          </motion.div>
        </main>

        {/* Markets Section */}
        <section className="py-24 border-t border-white/5">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-white">Markets</h2>
            <Link href="/dashboard" className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors flex items-center gap-2">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {markets.map((market, i) => (
              <motion.div
                key={market.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#171717]/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl hover:bg-[#171717] hover:border-[#3b82f6]/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`} style={{ backgroundColor: `${market.color}20` }}>
                      <span className="font-bold" style={{ color: market.color }}>{market.name[0]}</span>
                    </div>
                    <span className="font-bold text-white">{market.name}</span>
                  </div>
                  <span className="text-sm font-mono text-[#a3a3a3]">{market.liquidity}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-[#a3a3a3] mb-1">Deposit APY</p>
                    <p className="text-2xl font-bold text-[#10b981]">{market.apy}</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors">
                    Supply
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features / Security */}
        <section className="py-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Security is our priority.</h2>
            <p className="text-[#a3a3a3] text-lg">
              The uWu Protocol has been audited by the world&apos;s leading security firms and operates with an open-source codebase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-6 rounded-3xl hover:bg-white/5 transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center mb-6 text-[#3b82f6]">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[#a3a3a3] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      {/* uWu Footer (Refactored to 100xDevs Style) */}
      <footer className="relative z-10 bg-black pt-20 pb-0 px-6 border-t border-[#1a1a1f] overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-20">

          <div className="flex flex-col md:flex-row justify-between items-start w-full relative z-30 mb-8 md:mb-0">
            {/* Left: Logo */}
            <div className="mb-8 md:mb-0">
              <span className="text-2xl font-bold text-white tracking-tight">uWu</span>
            </div>

            {/* Center: Links */}
            <div className="flex flex-col gap-4 text-sm text-[#a3a3a3] text-center md:text-left">
              <Link href="#" className="hover:text-white transition-colors">Terms & Conditions</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Refund & Cancellation</Link>
            </div>

            {/* Right: Socials & Copyright */}
            <div className="flex flex-col items-end gap-6 mt-8 md:mt-0">
              <div className="flex gap-4">
                <Link href="#" className="w-10 h-10 rounded-lg bg-[#171717] flex items-center justify-center hover:bg-[#262626] transition-colors"><Youtube className="w-5 h-5 text-white" /></Link>
                <Link href="#" className="w-10 h-10 rounded-lg bg-[#171717] flex items-center justify-center hover:bg-[#262626] transition-colors"><Twitter className="w-5 h-5 text-white" /></Link>
                <Link href="#" className="w-10 h-10 rounded-lg bg-[#171717] flex items-center justify-center hover:bg-[#262626] transition-colors"><Instagram className="w-5 h-5 text-white" /></Link>
                <Link href="#" className="w-10 h-10 rounded-lg bg-[#171717] flex items-center justify-center hover:bg-[#262626] transition-colors"><Linkedin className="w-5 h-5 text-white" /></Link>
              </div>
              <p className="text-[#52525b] text-xs">
                © 2026 uWu. All rights reserved.
              </p>
            </div>
          </div>

          {/* Watermark */}
          <div className="w-full text-center mt-20 relative z-10 select-none pointer-events-none">
            <h1 className="footer-watermark text-[35vw] leading-[0.8] tracking-tighter">
              uWu
            </h1>
          </div>

        </div>
      </footer>
    </div>
  )
}
