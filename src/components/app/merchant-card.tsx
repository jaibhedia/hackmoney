"use client"

import { Shield, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { useReputation } from "@/hooks/useReputation"

interface MerchantCardProps {
    address: string
    name: string
    paymentDetails: string
    onSelect?: () => void
}

/**
 * Enhanced Merchant Card with Live Reputation Display
 * Shows trust score, statistics, and verification badges
 */
export function MerchantCard({ address, name, paymentDetails, onSelect }: MerchantCardProps) {
    const { reputation, isLoading, getTrustScoreColor, getTrustScoreLabel, formatCompletionTime } = useReputation(address)

    if (isLoading || !reputation) {
        return (
            <div className="w-full bg-surface border border-border p-4 animate-pulse">
                <div className="h-6 bg-background rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-background rounded w-1/4"></div>
            </div>
        )
    }

    const trustColor = getTrustScoreColor(reputation.trustScore)
    const trustLabel = getTrustScoreLabel(reputation.trustScore)

    const colorClasses = {
        success: 'bg-success/20 text-success border-success/20',
        warning: 'bg-warning/20 text-warning border-warning/20',
        error: 'bg-error/20 text-error border-error/20',
    }

    return (
        <button
            onClick={onSelect}
            className="w-full bg-surface border border-border p-4 hover:border-brand transition-colors text-left group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-text-primary">{name}</p>
                        {reputation.trustScore >= 95 && (
                            <Shield className="w-4 h-4 text-brand" />
                        )}
                    </div>
                    <p className="text-xs text-text-secondary font-mono">
                        {address.slice(0, 10)}...{address.slice(-8)}
                    </p>
                </div>

                {/* Trust Score Badge */}
                <div className={`px-3 py-1 rounded border ${colorClasses[trustColor]}`}>
                    <p className="text-xs font-bold">{reputation.trustScore}%</p>
                    <p className="text-[10px] uppercase">{trustLabel}</p>
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-background border border-border p-2">
                    <div className="flex items-center gap-1 mb-1">
                        <CheckCircle className="w-3 h-3 text-success" />
                        <p className="text-[10px] text-text-secondary uppercase">Trades</p>
                    </div>
                    <p className="text-sm font-bold text-text-primary">{reputation.totalTrades}</p>
                </div>

                <div className="bg-background border border-border p-2">
                    <div className="flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-brand" />
                        <p className="text-[10px] text-text-secondary uppercase">Avg Time</p>
                    </div>
                    <p className="text-sm font-bold text-text-primary">
                        {formatCompletionTime(reputation.averageCompletionTime)}
                    </p>
                </div>

                <div className="bg-background border border-border p-2">
                    <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <p className="text-[10px] text-text-secondary uppercase">Success</p>
                    </div>
                    <p className="text-sm font-bold text-success">
                        {((reputation.successfulTrades / reputation.totalTrades) * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Payment Details */}
            <div className="bg-brand/10 border border-brand/20 p-2 mb-2">
                <p className="text-xs text-text-secondary">{paymentDetails}</p>
            </div>

            {/* Dispute Info (if any) */}
            {reputation.disputedTrades > 0 && (
                <div className="text-xs text-warning">
                    ⚠️ {reputation.disputedTrades} disputed trade{reputation.disputedTrades > 1 ? 's' : ''}
                </div>
            )}

            {/* Hover indication */}
            <div className="mt-2 text-xs text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                → Select this merchant
            </div>
        </button>
    )
}
