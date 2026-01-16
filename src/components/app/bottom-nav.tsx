"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { QrCode } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f13] border-t border-[#2a2a32] safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto">
                {/* Buy */}
                <Link
                    href="/buy"
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors",
                        pathname === "/buy"
                            ? "bg-[#3b82f6] text-white"
                            : "bg-transparent text-[#8b8b9e] hover:text-white"
                    )}
                >
                    <span className="text-base">₿</span>
                    Buy USDC
                </Link>

                {/* Scan & Pay */}
                <Link
                    href="/scan"
                    className="flex flex-col items-center -mt-6"
                >
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors",
                        pathname === "/scan"
                            ? "bg-[#3b82f6] border-[#3b82f6]"
                            : "bg-[#171717] border-[#3b82f6]"
                    )}>
                        <QrCode className="w-6 h-6 text-[#3b82f6]" style={{ color: pathname === "/scan" ? "#fff" : "#3b82f6" }} />
                    </div>
                    <span className="text-[10px] text-[#8b8b9e] mt-1">Scan & Pay</span>
                </Link>

                {/* Sell */}
                <Link
                    href="/sell"
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border",
                        pathname === "/sell"
                            ? "bg-[#171717] border-[#3b82f6] text-white"
                            : "bg-transparent border-[#3a3a42] text-[#8b8b9e] hover:text-white"
                    )}
                >
                    <span className="text-base">₿</span>
                    Sell USDC
                </Link>
            </div>
        </div>
    )
}
