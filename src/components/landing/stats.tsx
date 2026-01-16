"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"

interface StatItemProps {
    value: number
    suffix: string
    label: string
    delay: number
}

function StatItem({ value, suffix, label, delay }: StatItemProps) {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (!isInView) return

        const duration = 2000
        const steps = 60
        const increment = value / steps
        let current = 0

        const timer = setTimeout(() => {
            const interval = setInterval(() => {
                current += increment
                if (current >= value) {
                    setCount(value)
                    clearInterval(interval)
                } else {
                    setCount(Math.floor(current))
                }
            }, duration / steps)

            return () => clearInterval(interval)
        }, delay)

        return () => clearTimeout(timer)
    }, [isInView, value, delay])

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay / 1000, duration: 0.5 }}
            viewport={{ once: true }}
            className="relative group"
        >
            {/* Circular background */}
            <div className="relative w-40 h-40 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-500" />
                <div className="absolute inset-2 rounded-full bg-terminal-bg flex items-center justify-center">
                    <div className="text-center">
                        <span className="text-3xl font-bold text-white">
                            {count.toLocaleString()}
                        </span>
                        <span className="text-xl text-primary-light">{suffix}</span>
                    </div>
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full border border-primary/30 group-hover:border-primary/50 transition-all duration-500" />
            </div>
            <p className="text-zinc-400 text-sm">{label}</p>
        </motion.div>
    )
}

export function Stats() {
    const stats = [
        { value: 2.5, suffix: "B+", label: "Total Volume Traded", delay: 0 },
        { value: 150, suffix: "K+", label: "Active Users", delay: 200 },
        { value: 99.9, suffix: "%", label: "Uptime", delay: 400 },
        { value: 50, suffix: "+", label: "Supported Tokens", delay: 600 },
    ]

    return (
        <section id="stats" className="py-24 bg-terminal-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Trusted by{" "}
                        <span className="bg-gradient-to-r from-primary-light to-secondary bg-clip-text text-transparent">
                            Thousands
                        </span>
                    </h2>
                    <p className="text-zinc-400 max-w-xl mx-auto">
                        Join the growing community of traders who trust uWu for their P2P transactions
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((stat, index) => (
                        <StatItem key={index} {...stat} />
                    ))}
                </div>
            </div>
        </section>
    )
}
