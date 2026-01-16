"use client"

import { ArrowLeft, Check, Clock, ChevronRight, Filter } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

const orders = [
    { id: "001", type: "Buy", amount: "50 USDC", status: "completed", time: "2h ago" },
    { id: "002", type: "Pay", amount: "25 USDC", status: "completed", time: "5h ago" },
    { id: "003", type: "Sell", amount: "100 USDC", status: "pending", time: "1d ago" },
]

export default function OrdersPage() {
    return (
        <div className="min-h-screen bg-background text-text-primary max-w-md mx-auto transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <Link href="/dashboard" className="p-2 -ml-2 hover:bg-surface rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-text-secondary" />
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="font-bold text-text-primary tracking-tight">LOGS</h1>
                    <span className="text-[10px] text-text-secondary font-mono">ORDER_HISTORY</span>
                </div>
                <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-surface transition-colors cursor-pointer">
                    <Filter className="w-4 h-4 text-text-secondary" />
                </div>
            </div>

            {/* Orders List */}
            <div className="px-4 py-4 space-y-3">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between hover:border-text-secondary transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-border ${order.status === "completed" ? "bg-success/10" : "bg-yellow-500/10"
                                }`}>
                                {order.status === "completed" ? (
                                    <Check className="w-4 h-4 text-success" />
                                ) : (
                                    <Clock className="w-4 h-4 text-yellow-500" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-primary font-mono">{order.type} {order.amount}</p>
                                <p className="text-xs text-text-secondary font-mono">ID: {order.id} • {order.time}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-text-primary" />
                    </div>
                ))}

                {orders.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                        <p className="text-text-secondary font-mono text-xs uppercase">No logs found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
