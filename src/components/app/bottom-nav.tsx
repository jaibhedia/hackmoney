"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { QrCode, Receipt, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f13] border-t border-[#2a2a32] safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
                {/* Buy */}
                <Link
                    href="/buy"
                    className={cn(
                        "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        pathname === "/buy"
                            ? "text-[#3b82f6]"
                            : "text-[#8b8b9e] hover:text-white"
                    )}
                >
                    <span className="text-lg mb-1">₿</span>
                    Buy
                </Link>

                {/* Solver */}
                <Link
                    href="/solver"
                    className={cn(
                        "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        pathname === "/solver"
                            ? "text-[#3b82f6]"
                            : "text-[#8b8b9e] hover:text-white"
                    )}
                >
                    <Users className="w-5 h-5 mb-1" />
                    Solver
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
                    <span className="text-[10px] text-[#8b8b9e] mt-1">Scan</span>
                </Link>

                {/* Orders */}
                <Link
                    href="/orders"
                    className={cn(
                        "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        pathname === "/orders"
                            ? "text-[#3b82f6]"
                            : "text-[#8b8b9e] hover:text-white"
                    )}
                >
                    <Receipt className="w-5 h-5 mb-1" />
                    Orders
                </Link>

                {/* Sell */}
                <Link
                    href="/sell"
                    className={cn(
                        "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        pathname === "/sell"
                            ? "text-[#3b82f6]"
                            : "text-[#8b8b9e] hover:text-white"
                    )}
                >
                    <span className="text-lg mb-1">$</span>
                    Sell
                </Link>
            </div>
        </div>
    )
}
