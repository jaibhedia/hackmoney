"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Twitter, Github } from "lucide-react"

export function CTA() {
    return (
        <section className="py-24 bg-gray-900">
            <div className="max-w-3xl mx-auto px-6 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-white mb-6"
                >
                    Ready to start?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    viewport={{ once: true }}
                    className="text-gray-400 mb-10"
                >
                    Join thousands trading P2P with uWu.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex px-8 py-3.5 bg-white text-gray-900 font-medium rounded-full hover:bg-gray-100 transition-colors"
                    >
                        Open App
                    </Link>
                </motion.div>
            </div>
        </section>
    )
}

export function Footer() {
    return (
        <footer className="py-12 bg-gray-50 border-t border-gray-100">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">uWu</span>
                        <span className="text-gray-400 text-sm">© 2025</span>
                    </div>

                    <div className="flex items-center gap-8">
                        <Link href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                            Terms
                        </Link>
                        <Link href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                            Privacy
                        </Link>
                        <Link href="#" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                            Docs
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
