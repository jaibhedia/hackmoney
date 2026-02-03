"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { QrCode, Wallet, Users, User, Home, Scale, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStaking } from "@/hooks/useStaking"
import { useWallet } from "@/hooks/useWallet"

/**
 * Role-based bottom navigation
 * - Regular users: Home, Wallet, Scan, Orders, Profile
 * - LPs: Home, Wallet, Scan, LP, Profile
 * - DAO/Arbitrators: Home, Wallet, Scan, DAO, Profile
 */
export function BottomNav() {
    const pathname = usePathname()
    const { stakeProfile, fetchStakeProfile } = useStaking()
    const { address } = useWallet()
    const [isArbitrator, setIsArbitrator] = useState(false)

    // Fetch stake profile on mount
    useEffect(() => {
        if (address) {
            fetchStakeProfile()
            // Check if user is an arbitrator (Gold+ tier qualifies)
            // In production, this would check on-chain DAO membership
        }
    }, [address, fetchStakeProfile])

    // Determine if user qualifies as arbitrator (Gold tier or above)
    useEffect(() => {
        if (stakeProfile) {
            const arbitratorTiers = ['Gold', 'Diamond']
            setIsArbitrator(arbitratorTiers.includes(stakeProfile.tier))
        }
    }, [stakeProfile])

    const isLP = stakeProfile?.isLP ?? false

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f0f13] border-t border-[#2a2a32] safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
                {/* Home/Dashboard */}
                <Link
                    href="/dashboard"
                    className={cn(
                        "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        pathname === "/dashboard"
                            ? "text-[#3b82f6]"
                            : "text-[#8b8b9e] hover:text-white"
                    )}
                >
                    <Home className="w-5 h-5 mb-1" />
                    Home
                </Link>

                {/* Wallet */}
                <Link
                    href="/wallet"
                    className={cn(
                        "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        pathname === "/wallet"
                            ? "text-[#3b82f6]"
                            : "text-[#8b8b9e] hover:text-white"
                    )}
                >
                    <Wallet className="w-5 h-5 mb-1" />
                    Wallet
                </Link>

                {/* Scan & Pay - Always visible, center button */}
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

                {/* Role-based 4th tab: LP for LPs, DAO for arbitrators, Orders for regular users */}
                {isLP ? (
                    <Link
                        href="/solver"
                        className={cn(
                            "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                            pathname === "/solver" || pathname === "/lp/register"
                                ? "text-[#f59e0b]"
                                : "text-[#8b8b9e] hover:text-white"
                        )}
                    >
                        <Users className="w-5 h-5 mb-1" />
                        LP
                    </Link>
                ) : isArbitrator ? (
                    <Link
                        href="/arbitrator"
                        className={cn(
                            "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                            pathname === "/arbitrator"
                                ? "text-[#a855f7]"
                                : "text-[#8b8b9e] hover:text-white"
                        )}
                    >
                        <Scale className="w-5 h-5 mb-1" />
                        DAO
                    </Link>
                ) : (
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
                )}

                {/* Profile */}
                <Link
                    href="/profile"
                    className={cn(
                        "flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                        pathname === "/profile"
                            ? "text-[#3b82f6]"
                            : "text-[#8b8b9e] hover:text-white"
                    )}
                >
                    <User className="w-5 h-5 mb-1" />
                    Profile
                </Link>
            </div>
        </div>
    )
}
