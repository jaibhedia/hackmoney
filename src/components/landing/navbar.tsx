"use client"

import Link from "next/link"
import { motion } from "framer-motion"

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto backdrop-blur-sm bg-black/50">
            <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#EC4899] flex items-center justify-center">
                    <span className="text-white font-bold text-sm tracking-tighter">uw</span>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">uWu</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-base font-medium text-white/90">
                <Link href="#products" className="hover:text-white transition-colors">Products <span className="text-blue-500 text-[10px] align-top">●</span></Link>
                <Link href="#resources" className="hover:text-white transition-colors">Resources</Link>
                <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
            </div>

            <Link
                href="/dashboard"
                className="px-6 py-3 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
            >
                Launch App
            </Link>
        </nav>
    )
}
