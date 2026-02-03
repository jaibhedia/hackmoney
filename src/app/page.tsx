"use client"

import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { ScanPaySection } from "@/components/landing/scan-pay-section"
import { LPStakeSection } from "@/components/landing/lp-stake-section"
import { DAOSection } from "@/components/landing/dao-section"
import { FAQ } from "@/components/landing/faq"
import { Footer } from "@/components/landing/footer"
import { motion } from "framer-motion"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">
            <Navbar />

            <main>
                <Hero />

                {/* Scan & Pay Section */}
                <ScanPaySection />

                {/* Pay with USDC at any QR Section */}
                <section className="py-32 relative overflow-hidden">
                    {/* Globe Curve Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[50vh] bg-[radial-gradient(ellipse_at_center_bottom,_#1e3a8a_0%,_transparent_70%)] opacity-30 z-0 pointer-events-none" />

                    <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-7xl font-bold mb-8 tracking-tight"
                        >
                            Pay with USDC <br />
                            at any QR
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed"
                        >
                            Seamlessly buy or sell USDC across multiple chains using your local fiat currency. Whether you go from fiat to crypto or crypto to fiat, stay secure and truly peer to peer with uWu.
                        </motion.p>
                    </div>
                </section>

                {/* LP Stake Section */}
                <LPStakeSection />

                {/* DAO Section */}
                <DAOSection />

                {/* Big Logo Section */}
                <section className="py-20 flex justify-center items-center opacity-100">
                    <div className="relative">
                        <h1 className="text-[15vw] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-800 drop-shadow-2xl">
                            uWu
                        </h1>
                    </div>
                </section>

                <FAQ />
            </main>

            <Footer />
        </div>
    )
}
