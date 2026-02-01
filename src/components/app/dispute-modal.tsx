"use client"

import { useState } from "react"
import { X, AlertTriangle, FileText, Upload } from "lucide-react"

export interface DisputeData {
    orderId: string
    reason: string
    description: string
    evidence: File[]
}

interface DisputeModalProps {
    orderId: string
    orderAmount: number
    merchantName: string
    onSubmit: (dispute: DisputeData) => Promise<void>
    onClose: () => void
}

/**
 * Dispute Resolution Modal
 * Allows users to raise disputes with evidence upload
 */
export function DisputeModal({ orderId, orderAmount, merchantName, onSubmit, onClose }: DisputeModalProps) {
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [evidence, setEvidence] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const disputeReasons = [
        'Payment not received',
        'Incorrect amount received',
        'Payment method issues',
        'Other (explain below)',
    ]

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setEvidence([...evidence, ...Array.from(e.target.files)])
        }
    }

    const removeFile = (index: number) => {
        setEvidence(evidence.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!reason || !description) return

        setIsSubmitting(true)
        try {
            await onSubmit({
                orderId,
                reason,
                description,
                evidence,
            })
            onClose()
        } catch (error) {
            console.error('Failed to submit dispute:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-error" />
                        <h3 className="font-bold text-text-primary">Raise Dispute</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-background rounded"
                    >
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Warning */}
                    <div className="bg-warning/10 border border-warning/20 p-3">
                        <p className="text-xs text-warning font-bold mb-1">⚠️ Important</p>
                        <p className="text-xs text-text-secondary">
                            Only raise a dispute if there's a genuine issue. False disputes may affect your reputation.
                        </p>
                    </div>

                    {/* Order Info */}
                    <div className="bg-background border border-border p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Order ID:</span>
                            <span className="font-mono text-xs text-text-primary">{orderId.slice(0, 16)}...</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Merchant:</span>
                            <span className="text-text-primary">{merchantName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Amount:</span>
                            <span className="font-bold text-brand">{orderAmount.toFixed(2)} USDC</span>
                        </div>
                    </div>

                    {/* Reason Selection */}
                    <div>
                        <label className="text-xs text-text-secondary uppercase mb-2 block">
                            Dispute Reason *
                        </label>
                        <div className="space-y-2">
                            {disputeReasons.map((reasonOption) => (
                                <button
                                    key={reasonOption}
                                    onClick={() => setReason(reasonOption)}
                                    className={`w-full p-3 border text-left text-sm transition-colors ${reason === reasonOption
                                            ? 'border-brand bg-brand/10 text-text-primary'
                                            : 'border-border bg-background text-text-secondary hover:border-text-secondary'
                                        }`}
                                >
                                    {reasonOption}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs text-text-secondary uppercase mb-2 block">
                            Detailed Description *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Explain the issue in detail..."
                            className="w-full p-3 bg-background border border-border text-text-primary text-sm min-h-[120px] focus:border-brand outline-none resize-none"
                            maxLength={500}
                        />
                        <p className="text-xs text-text-secondary mt-1">
                            {description.length}/500 characters
                        </p>
                    </div>

                    {/* Evidence Upload */}
                    <div>
                        <label className="text-xs text-text-secondary uppercase mb-2 block">
                            Evidence (Screenshots, Receipts)
                        </label>

                        <label className="w-full p-4 border-2 border-dashed border-border bg-background hover:border-brand transition-colors cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="w-6 h-6 text-text-secondary" />
                            <span className="text-xs text-text-secondary">Click to upload files</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>

                        {/* Uploaded Files */}
                        {evidence.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {evidence.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-background border border-border"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-brand" />
                                            <span className="text-xs text-text-primary truncate max-w-[200px]">
                                                {file.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="p-1 hover:bg-surface rounded"
                                        >
                                            <X className="w-4 h-4 text-text-secondary" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 space-y-3">
                        <button
                            onClick={handleSubmit}
                            disabled={!reason || !description || isSubmitting}
                            className="w-full bg-error text-white font-bold py-3 uppercase hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-surface border border-border text-text-primary font-bold py-3 uppercase hover:border-brand transition-colors"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Info */}
                    <div className="bg-brand/10 border border-brand/20 p-3">
                        <p className="text-xs font-bold text-brand mb-1">What happens next?</p>
                        <ol className="text-xs text-text-secondary space-y-1 list-decimal list-inside">
                            <li>Your dispute is reviewed within 24 hours</li>
                            <li>Evidence is verified</li>
                            <li>Decision is made based on smart contract rules</li>
                            <li>Funds are released to the appropriate party</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    )
}
