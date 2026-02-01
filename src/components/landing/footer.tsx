"use client"

import Link from "next/link"
import { Facebook, Github, Instagram, Linkedin, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="relative bg-black pt-32 pb-12 overflow-hidden border-t border-white/5">
            {/* Watermark */}
            <div className="absolute bottom-0 left-0 w-full flex justify-center select-none pointer-events-none opacity-20 overflow-hidden">
                <h1 className="text-[40vw] font-black leading-none tracking-tighter text-white translate-y-[30%]">
                    uWu
                </h1>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#EC4899] flex items-center justify-center">
                            <span className="text-white font-bold text-sm">uw</span>
                        </div>
                        <span className="text-xl font-bold text-white">uWu</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                        A decentralized liquidity protocol for the next generation of on-chain finance.
                    </p>

                    <div className="flex gap-4 mt-8">
                        {[Facebook, Github, Instagram, Linkedin, Twitter].map((Icon, i) => (
                            <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-gray-400 transition-all">
                                <Icon className="w-5 h-5" />
                            </a>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6">Resources</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><Link href="#" className="hover:text-white">Blog</Link></li>
                        <li><Link href="#" className="hover:text-white">Brand</Link></li>
                        <li><Link href="#" className="hover:text-white">FAQ</Link></li>
                        <li><Link href="#" className="hover:text-white">Case Studies</Link></li>
                        <li><Link href="#" className="hover:text-white">Help & Support</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6">Developers</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><Link href="#" className="hover:text-white">Build</Link></li>
                        <li><Link href="#" className="hover:text-white">Documentation</Link></li>
                        <li><Link href="#" className="hover:text-white">Technical Paper</Link></li>
                        <li><Link href="#" className="hover:text-white">Case Security</Link></li>
                        <li><Link href="#" className="hover:text-white">Bug Bounty</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6">Company</h4>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                        <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
                        <li><Link href="#" className="hover:text-white">Contact</Link></li>
                        <li><Link href="#" className="hover:text-white">Manage Analytics</Link></li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
                <p>© 2026 uWu Protocol. All rights reserved.</p>
                <div className="flex gap-6 mt-4 md:mt-0">
                    <a href="#" className="hover:text-gray-400">English</a>
                    <a href="#" className="hover:text-gray-400">Sitemap</a>
                </div>
            </div>
        </footer>
    )
}
