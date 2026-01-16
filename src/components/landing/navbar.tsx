"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
        >
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">uWu</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-10">
                        <Link href="#about" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                            About
                        </Link>
                        <Link href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                            Features
                        </Link>
                        <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                            How It Works
                        </Link>
                    </div>

                    {/* CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                        >
                            Open App
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 text-gray-600"
                    >
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile Nav */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="md:hidden py-4 border-t border-gray-100"
                    >
                        <div className="flex flex-col gap-4">
                            <Link href="#about" className="text-gray-600 hover:text-gray-900 text-sm font-medium" onClick={() => setIsOpen(false)}>
                                About
                            </Link>
                            <Link href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium" onClick={() => setIsOpen(false)}>
                                Features
                            </Link>
                            <Link
                                href="/dashboard"
                                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full text-center"
                                onClick={() => setIsOpen(false)}
                            >
                                Open App
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.nav>
    )
}
