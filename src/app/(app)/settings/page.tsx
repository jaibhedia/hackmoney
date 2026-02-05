"use client"

import { ArrowLeft, ChevronRight, Bell, Shield, Moon, Globe, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useWallet } from "@/hooks/useWallet"

export default function SettingsPage() {
    const router = useRouter()
    const { isConnected, address, disconnect, displayName } = useWallet()

    const handleDisconnect = async () => {
        await disconnect()
        router.push('/')
    }

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
                <Link href="/profile" className="bg-[#171717] rounded-xl p-4 flex items-center gap-4 mb-4 block">
                    <div className="w-12 h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                        <span className="text-white font-bold">uW</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-white">{displayName || 'Anonymous'}</p>
                        <p className="text-xs text-[#8b8b9e] font-mono">
                            {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : 'Not connected'}
                        </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8b8b9e]" />
                </Link>

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
                {isConnected && (
                    <button 
                        onClick={handleDisconnect}
                        className="w-full mt-6 py-3 text-sm text-red-400 bg-red-500/10 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Disconnect Wallet
                    </button>
                )}
            </div>
        </div>
    )
}
