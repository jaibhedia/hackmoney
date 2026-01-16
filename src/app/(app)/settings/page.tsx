"use client"

import { ArrowLeft, ChevronRight, Bell, Shield, Moon, Globe } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a32]">
                <Link href="/dashboard" className="text-[#8b8b9e]">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="font-semibold text-white">Settings</h1>
                <div className="w-5" />
            </div>

            {/* Profile */}
            <div className="px-4 py-4">
                <div className="bg-[#171717] rounded-xl p-4 flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                        <span className="text-white font-bold">uW</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-white font-mono">0x1234...abcd</p>
                        <p className="text-xs text-[#8b8b9e]">Base Network</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8b8b9e]" />
                </div>

                {/* Settings List */}
                <div className="space-y-2">
                    {[
                        { icon: Bell, label: "Notifications", value: "On" },
                        { icon: Shield, label: "Security", value: "" },
                        { icon: Moon, label: "Appearance", value: "Dark" },
                        { icon: Globe, label: "Language", value: "English" },
                    ].map((item) => (
                        <button
                            key={item.label}
                            className="w-full bg-[#171717] rounded-xl p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 text-[#8b8b9e]" />
                                <span className="text-sm text-white">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.value && (
                                    <span className="text-xs text-[#8b8b9e]">{item.value}</span>
                                )}
                                <ChevronRight className="w-4 h-4 text-[#8b8b9e]" />
                            </div>
                        </button>
                    ))}
                </div>

                {/* Disconnect */}
                <button className="w-full mt-6 py-3 text-sm text-red-400 bg-red-500/10 rounded-xl">
                    Disconnect Wallet
                </button>
            </div>
        </div>
    )
}
