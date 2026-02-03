"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, Power, Check, Upload, Clock, AlertTriangle, Loader2, X, DollarSign, History, Gift, Camera } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/app/bottom-nav"
import { QRScanner } from "@/components/app/qr-scanner"
import { WalletConnect } from "@/components/app/wallet-connect"
import { useWallet } from "@/hooks/useWallet"
import { formatCurrency } from "@/lib/currency-converter"
import { Order } from "@/app/api/orders/sse/route"

/**
 * LP (Solver) Dashboard
 * 
 * Flow:
 * 1. LP goes "active" to receive orders
 * 2. See live order feed with user QR codes
 * 3. Accept order -> View user's QR
 * 4. Pay the QR -> Upload payment screenshot
 * 5. Wait 24hr dispute period -> Receive USDC + 2% reward
 */

export default function SolverPage() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { isConnected, address, balance, displayName, isLoading: walletLoading } = useWallet()
    const [mounted, setMounted] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [orders, setOrders] = useState<Order[]>([])
    const [acceptedOrder, setAcceptedOrder] = useState<Order | null>(null)
    const [paymentProof, setPaymentProof] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    // Added "waiting_qr" step for amount-first flow
    const [step, setStep] = useState<"browse" | "waiting_qr" | "pay" | "proof" | "pending" | "settled">("browse")
    const [countdown, setCountdown] = useState<string>("--:--:--")
    const [myOrders, setMyOrders] = useState<Order[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [upiId, setUpiId] = useState("") // LP can enter UPI ID manually
    const [showScanner, setShowScanner] = useState(false) // For live camera QR scanning
    const [scannedQrData, setScannedQrData] = useState<string | null>(null) // Scanned UPI data

    useEffect(() => {
        setMounted(true)
    }, [])

    // Fetch active orders when LP is active
    useEffect(() => {
        if (!isActive || !address) return

        const fetchOrders = async () => {
            try {
                const res = await fetch("/api/orders?status=created")
                const data = await res.json()
                if (data.success) {
                    setOrders(data.orders || [])
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error)
            }
        }

        fetchOrders()
        const interval = setInterval(fetchOrders, 5000) // Poll every 5s
        return () => clearInterval(interval)
    }, [isActive, address])

    // Fetch LP's pending orders and detect status changes
    useEffect(() => {
        if (!address) return

        let isMounted = true

        const fetchMyOrders = async () => {
            if (!isMounted) return

            try {
                const res = await fetch(`/api/orders?solverId=${address}`)
                const data = await res.json()

                if (!isMounted) return

                if (data.success && data.orders?.length > 0) {
                    setMyOrders(data.orders)
                    const pending = data.orders.find((o: Order) =>
                        o.status === "matched" || o.status === "payment_pending" || o.status === "payment_sent"
                    )
                    const settled = data.orders.find((o: Order) => o.status === "settled")

                    if (pending && isMounted) {
                        setAcceptedOrder(pending)

                        // Only auto-update step if we are NOT in the middle of uploading proof
                        if (step !== "proof") {
                            // Determine step based on order status and QR presence
                            if (pending.status === "matched" && !pending.qrImage) {
                                setStep("waiting_qr")
                            } else if (pending.status === "payment_pending" || (pending.status === "matched" && pending.qrImage)) {
                                setStep("pay")
                            } else if (pending.status === "payment_sent") {
                                setStep("pending")
                            }
                        }
                    } else if (settled && step === "pending" && isMounted) {
                        setAcceptedOrder(settled)
                        setStep("settled")
                    }
                }
            } catch (error) {
                console.error("Failed to fetch my orders:", error)
            }
        }

        fetchMyOrders()
        const interval = setInterval(fetchMyOrders, 5000) // Slow down to 5s to reduce load

        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [address, step])

    // Live countdown timer
    useEffect(() => {
        if (step !== "pending" || !acceptedOrder?.disputePeriodEndsAt) return

        const updateCountdown = () => {
            const remaining = (acceptedOrder.disputePeriodEndsAt || 0) - Date.now()
            if (remaining <= 0) {
                setCountdown("Ready to claim!")
                return
            }

            const hours = Math.floor(remaining / (1000 * 60 * 60))
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
            setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
        }

        updateCountdown()
        const interval = setInterval(updateCountdown, 1000)
        return () => clearInterval(interval)
    }, [step, acceptedOrder?.disputePeriodEndsAt])

    // Test settlement (for demo - skips 24hr wait)
    const handleTestSettle = async () => {
        if (!acceptedOrder) return

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/settlement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: acceptedOrder.id,
                    skipDispute: true, // Skip 24hr for testing
                }),
            })

            const data = await res.json()
            if (data.success) {
                // USDC is transferred on-chain by the escrow contract
                // Balance will auto-update via useWalletBalance
                console.log(`[Solver] Settlement complete, received ${acceptedOrder.amountUsdc} USDC`)
                setAcceptedOrder(data.order)
                setStep("settled")
            } else {
                console.error("Settlement failed:", data.error)
                alert("Settlement failed: " + (data.error || "Unknown error"))
            }
        } catch (error) {
            console.error("Settlement failed:", error)
            alert("Settlement failed - please try again")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAcceptOrder = async (order: Order) => {
        if (!address) return

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order.id,
                    action: "match",
                    solverId: address,
                    solverAddress: address,
                }),
            })

            const data = await res.json()
            if (data.success) {
                setAcceptedOrder(data.order)
                // Amount-first flow: if no QR yet, go to waiting_qr step
                if (data.order.qrImage) {
                    setStep("pay")
                } else {
                    setStep("waiting_qr")
                }
                setOrders(prev => prev.filter(o => o.id !== order.id))
            }
        } catch (error) {
            console.error("Failed to accept order:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            setPaymentProof(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmitProof = async () => {
        if (!acceptedOrder || !paymentProof) return

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: acceptedOrder.id,
                    action: "payment_sent",
                    lpPaymentProof: paymentProof,
                }),
            })

            const data = await res.json()
            if (data.success) {
                setAcceptedOrder(data.order)
                setStep("pending")
            }
        } catch (error) {
            console.error("Failed to submit proof:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!mounted) {
        return (
            <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-surface/50 border border-border rounded w-32 mb-6"></div>
                    <div className="h-40 bg-surface/20 border border-border border-dashed rounded"></div>
                </div>
            </div>
        )
    }

    // Show loading while wallet is initializing
    if (walletLoading) {
        return (
            <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                    <p className="text-xs text-text-secondary uppercase">INITIALIZING_WALLET...</p>
                </div>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
                <div className="flex items-center justify-between mb-8 border-b border-border pb-4 border-dashed">
                    <Link href="/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-brand uppercase text-xs tracking-wider">
                        <ChevronLeft className="w-4 h-4" />
                        [BACK]
                    </Link>
                </div>
                <div className="bg-black border-2 border-brand/50 p-8 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-30 text-[10px] uppercase text-brand">ACCESS_REQUIRED</div>

                    <DollarSign className="w-16 h-16 text-brand mx-auto mb-6 opacity-80" />
                    <h2 className="text-xl font-bold mb-2 uppercase text-white tracking-widest">LP_TERMINAL</h2>
                    <p className="text-sm text-text-secondary font-mono mb-6 max-w-xs mx-auto">
                        {">"} AUTHENTICATION_REQUIRED<br />
                        {">"} CONNECT_WALLET_TO_ACCESS_LP_TOOLS
                    </p>
                    <WalletConnect />
                </div>
                <BottomNav />
            </div>
        )
    }

    return (
        <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-border pb-4 border-dashed">
                <Link href="/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-brand transition-colors uppercase text-xs tracking-wider">
                    <ChevronLeft className="w-4 h-4" />
                    [BACK_TO_ROOT]
                </Link>
                <div className="text-center">
                    <h1 className="text-lg font-bold uppercase text-brand">LP_TERMINAL</h1>
                    <p className="text-[10px] text-text-secondary uppercase">MODE: LIQUIDITY_SOLVER</p>
                </div>
                <div className="w-8"></div>
            </div>

            {/* Balance & Earnings (Data Grid) */}
            <div className="grid grid-cols-2 gap-px bg-border border border-border mb-6">
                <div className="bg-black p-4">
                    <p className="text-[10px] text-text-secondary uppercase mb-1">AVAILABLE_LIQUIDITY</p>
                    <p className="text-xl font-bold font-mono text-white">${balance.toFixed(2)}</p>
                </div>
                <div className="bg-black p-4">
                    <p className="text-[10px] text-text-secondary uppercase mb-1">YIELD_RATE</p>
                    <p className="text-xl font-bold font-mono text-success">+2.0%</p>
                </div>
            </div>

            {/* Step: Browse Orders */}
            {step === "browse" && (
                <>
                    {/* Active Toggle (System Status) */}
                    <div className={`p-4 mb-6 border ${isActive ? "border-success bg-success/5" : "border-border bg-card"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider">
                                SYSTEM_STATUS: {isActive ? <span className="text-success">ONLINE</span> : <span className="text-text-secondary">STANDBY</span>}
                            </span>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className={`w-10 h-5 rounded-none border relative transition-colors ${isActive ? "border-success bg-success/20" : "border-border bg-surface"}`}
                            >
                                <div className={`absolute top-0.5 bottom-0.5 w-4 bg-current transition-all ${isActive ? "right-0.5 bg-success" : "left-0.5 bg-text-secondary"}`} />
                            </button>
                        </div>
                        <p className="text-[10px] text-text-secondary font-mono">
                            {isActive ? "> RECEIVING_LIVE_ORDERS..." : "> SYSTEM_OFFLINE. ENABLE_TO_START_EARNING."}
                        </p>
                    </div>

                    {isActive && (
                        <>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h2 className="text-xs font-bold uppercase text-text-secondary">INCOMING_FEED ({orders.length})</h2>
                                <span className="text-[10px] text-brand animate-pulse">● LIVE</span>
                            </div>

                            {orders.length === 0 ? (
                                <div className="border border-border border-dashed p-8 text-center bg-surface/20">
                                    <div className="inline-block p-3 rounded-full bg-surface mb-2">
                                        <Clock className="w-6 h-6 text-text-secondary animate-spin-slow" />
                                    </div>
                                    <p className="text-xs text-text-secondary font-mono uppercase">{">"} WAITING_FOR_ORDERS...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {orders.map(order => (
                                        <div key={order.id} className="border border-border bg-card hover:border-brand transition-colors p-4 group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] uppercase text-brand border border-brand px-1">NEW_REQ</span>
                                            </div>

                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-lg font-bold font-mono text-white">{formatCurrency(order.amountFiat, order.fiatCurrency)}</p>
                                                    <p className="text-[10px] text-text-secondary uppercase">VIA {order.paymentMethod}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-brand font-mono text-sm font-bold">
                                                        +{order.amountUsdc?.toFixed(2)} USDC
                                                    </p>
                                                    <p className="text-[10px] text-text-secondary uppercase">EST_RETURN</p>
                                                </div>
                                            </div>

                                            {/* QR Preview (Mini) */}
                                            {order.qrImage && (
                                                <div className="bg-white p-1 w-fit mb-3 border border-border">
                                                    <img src={order.qrImage} alt="QR" className="h-12 w-12 object-contain" />
                                                </div>
                                            )}

                                            <button
                                                onClick={() => handleAcceptOrder(order)}
                                                disabled={isSubmitting}
                                                className="w-full py-2 bg-brand/10 border border-brand/50 text-brand font-bold text-xs uppercase hover:bg-brand hover:text-black transition-all"
                                            >
                                                {isSubmitting ? "PROCESSING..." : "[ ACCEPT_CONTRACT ]"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Step: Waiting for QR */}
            {step === "waiting_qr" && acceptedOrder && (
                <div className="font-mono">
                    <div className="border border-warning bg-warning/5 p-6 mb-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-warning/20">
                            <div className="h-full bg-warning animate-loading-bar"></div>
                        </div>
                        <h2 className="text-lg font-bold text-warning mb-2 uppercase">AWAITING_USER_INPUT</h2>
                        <p className="text-xs text-text-secondary uppercase mb-4">
                            {">"} TARGET_USER_UPLOADING_QR...<br />
                            {">"} STANDBY_FOR_IMAGE_DATA
                        </p>
                        <Clock className="w-8 h-8 text-warning mx-auto animate-pulse" />
                    </div>

                    <div className="border border-border bg-card p-4 mb-6">
                        <div className="flex justify-between border-b border-border border-dashed pb-2 mb-2">
                            <span className="text-xs text-text-secondary">CONTRACT_VAL</span>
                            <span className="font-bold">{formatCurrency(acceptedOrder.amountFiat, acceptedOrder.fiatCurrency)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-text-secondary">PAYOUT</span>
                            <span className="font-bold text-brand">{acceptedOrder.amountUsdc?.toFixed(2)} USDC</span>
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            try {
                                await fetch('/api/orders', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        orderId: acceptedOrder.id,
                                        action: 'cancel',
                                    }),
                                })
                            } catch (e) {
                                console.error('Failed to cancel order:', e)
                            }
                            setAcceptedOrder(null)
                            setStep("browse")
                        }}
                        className="w-full py-3 border border-error/50 text-error font-bold uppercase text-xs hover:bg-error/10"
                    >
                        ABORT_CONTRACT
                    </button>
                </div>
            )}

            {/* Step: Pay QR */}
            {step === "pay" && acceptedOrder && (
                <div className="font-mono">
                    <div className="border-l-2 border-brand pl-4 py-2 mb-6 bg-brand/5">
                        <h2 className="text-lg font-bold text-brand uppercase">CONTRACT_ACTIVE</h2>
                        <p className="text-[10px] text-text-secondary uppercase">
                            {">"} EXECUTE_PAYMENT_TO_PROCEED<br />
                            {">"} UPLOAD_PROOF_FOR_VERIFICATION
                        </p>
                    </div>

                    {/* QR Display Area */}
                    <div className="border border-border bg-black p-4 mb-4 text-center">
                        <p className="text-[10px] text-text-secondary uppercase mb-2 border-b border-border border-dashed pb-2">TARGET_PAYMENT_GATEWAY</p>

                        {acceptedOrder.qrImage ? (
                            <div className="bg-white p-4 inline-block mx-auto mb-4 border-2 border-brand">
                                <img src={acceptedOrder.qrImage} alt="Payment QR" className="max-h-64 object-contain" />
                            </div>
                        ) : scannedQrData ? (
                            <div className="bg-surface p-4 border border-brand/50 mb-4 text-left">
                                <p className="text-[10px] text-brand mb-1">DECODED_UPI_STRING:</p>
                                <code className="text-xs break-all text-white">{scannedQrData}</code>
                            </div>
                        ) : (
                            <div className="py-8 text-center border border-border border-dashed mb-4">
                                <p className="text-xs text-text-secondary mb-2">{">"} NO_IMG_DATA_FOUND</p>
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="px-4 py-2 bg-surface border border-brand text-brand text-xs font-bold uppercase hover:bg-brand hover:text-black"
                                >
                                    [ ACTIVATE_CAMERA_SCAN ]
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-xs border-t border-border border-dashed pt-2">
                            <span className="text-text-secondary">AMOUNT_DUE:</span>
                            <span className="font-bold text-xl">{formatCurrency(acceptedOrder.amountFiat, acceptedOrder.fiatCurrency)}</span>
                        </div>
                    </div>

                    {/* Mobile Camera Button (if needed again) */}
                    {acceptedOrder.qrImage && (
                        <button
                            onClick={() => setShowScanner(true)}
                            className="w-full py-3 mb-4 border border-border bg-surface text-text-secondary text-xs uppercase hover:text-brand hover:border-brand"
                        >
                            [ RE-SCAN_USER_QR ]
                        </button>
                    )}

                    <button
                        onClick={() => setStep("proof")}
                        className="w-full py-4 bg-brand text-black font-bold uppercase tracking-wider hover:bg-brand-hover relative overflow-hidden group"
                    >
                        <span className="relative z-10">CONFIRM_PAYMENT_SENT {">>"}</span>
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                    </button>
                </div>
            )}

            {/* Step: Upload Proof */}
            {step === "proof" && acceptedOrder && (
                <div className="font-mono">
                    <h2 className="text-lg font-bold mb-4 uppercase text-brand">VERIFICATION_PHASE</h2>

                    <div className="border border-border bg-card p-1 mb-6">
                        {!paymentProof ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-video w-full bg-surface/50 border-2 border-dashed border-border hover:border-brand flex flex-col items-center justify-center cursor-pointer group transition-colors"
                            >
                                <Upload className="w-8 h-8 text-text-secondary mb-2 group-hover:text-brand transition-colors" />
                                <p className="text-xs text-text-secondary uppercase group-hover:text-brand">CLICK_TO_UPLOAD_EVIDENCE</p>
                            </div>
                        ) : (
                            <div className="relative">
                                <img
                                    src={paymentProof}
                                    alt="Payment proof"
                                    className="w-full max-h-[300px] object-contain bg-black"
                                />
                                <button
                                    onClick={() => setPaymentProof(null)}
                                    className="absolute top-2 right-2 p-2 bg-black/80 text-error hover:bg-error hover:text-white border border-error transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-warning/10 border border-warning text-warning p-4 mb-6 text-xs">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5" />
                            <div>
                                <p className="font-bold uppercase">DISPUTE_PROTOCOL_ACTIVE</p>
                                <p className="opacity-80 mt-1">
                                    {">"} 24HR_SETTLEMENT_PERIOD_INITIATED<br />
                                    {">"} FUNDS_LOCKED_UNTIL_VERIFIED
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setStep("pay")}
                            className="py-3 border border-border text-text-secondary uppercase text-xs hover:bg-surface"
                        >
                            {"<< BACK"}
                        </button>
                        <button
                            onClick={handleSubmitProof}
                            disabled={!paymentProof || isSubmitting}
                            className="py-3 bg-brand text-black font-bold uppercase text-xs hover:bg-brand-hover disabled:opacity-50"
                        >
                            {isSubmitting ? "UPLOADING..." : "SUBMIT_EVIDENCE"}
                        </button>
                    </div>
                </div>
            )}

            {/* Step: Pending Settlement */}
            {step === "pending" && acceptedOrder && (
                <div className="font-mono text-center pt-8">
                    <div className="w-24 h-24 border-2 border-brand rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 border-2 border-brand rounded-full animate-ping opacity-20"></div>
                        <Clock className="w-10 h-10 text-brand" />
                    </div>

                    <h2 className="text-xl font-bold uppercase text-white mb-2">SETTLEMENT_PENDING</h2>
                    <p className="text-xs text-text-secondary uppercase mb-6">EST_COMPLETION: {countdown}</p>

                    <div className="border border-border bg-surface p-4 text-left max-w-sm mx-auto mb-8">
                        <div className="flex justify-between mb-2 pb-2 border-b border-border border-dashed">
                            <span className="text-xs text-text-secondary">ORDER_ID</span>
                            <span className="text-xs font-mono">{acceptedOrder.id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span className="text-xs text-text-secondary">PAID</span>
                            <span className="font-bold">{formatCurrency(acceptedOrder.amountFiat, acceptedOrder.fiatCurrency)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-text-secondary">PENDING_CREDIT</span>
                            <span className="font-bold text-brand">{acceptedOrder.amountUsdc.toFixed(2)} USDC</span>
                        </div>
                    </div>

                    {/* Test Settlement Button (for demo) */}
                    <button
                        onClick={handleTestSettle}
                        disabled={isSubmitting}
                        className="w-full py-3 border border-dashed border-success/50 text-success font-bold uppercase text-xs hover:bg-success/10 mb-4"
                    >
                        {isSubmitting ? "EXECUTING..." : "[ DEV_MODE: FORCE_SETTLE ]"}
                    </button>

                    <p className="text-[10px] text-text-secondary opacity-50">
                        {">"} AUTOMATED_SCRIPT_RUNNING...<br />
                        {">"} DO_NOT_CLOSE_BROWSER
                    </p>
                </div>
            )}

            {/* Step: Settled - Success! */}
            {step === "settled" && acceptedOrder && (
                <div className="font-mono text-center pt-8">
                    <div className="w-24 h-24 border-2 border-success bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                        <Gift className="w-10 h-10 text-success" />
                    </div>

                    <h2 className="text-2xl font-bold uppercase text-success mb-2">PAYOUT_COMPLETE</h2>
                    <p className="text-xs text-text-secondary uppercase mb-8">FUNDS_SECURED_IN_WALLET</p>

                    <div className="grid grid-cols-2 gap-px bg-border border border-border mb-8 text-left">
                        <div className="bg-black p-4">
                            <p className="text-[10px] text-text-secondary uppercase mb-1">INPUT (FIAT)</p>
                            <p className="text-lg font-bold">{formatCurrency(acceptedOrder.amountFiat, acceptedOrder.fiatCurrency)}</p>
                        </div>
                        <div className="bg-black p-4">
                            <p className="text-[10px] text-text-secondary uppercase mb-1">OUTPUT (USDC)</p>
                            <p className="text-lg font-bold text-success">+{acceptedOrder.amountUsdc.toFixed(2)}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setAcceptedOrder(null)
                            setStep("browse")
                            setPaymentProof(null)
                        }}
                        className="w-full py-4 bg-brand text-black font-bold uppercase hover:bg-brand-hover"
                    >
                        [ CONTINUE_OPERATIONS ]
                    </button>
                </div>
            )}

            <BottomNav />

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScanner
                    onScan={async (data) => {
                        console.log("[Solver] Scanned:", data)
                        setScannedQrData(data)
                        setShowScanner(false)

                        // If we scanned a UPI string, generate a QR for display
                        if (data.startsWith("upi://") || data.includes("@")) {
                            try {
                                const QRCode = (await import('qrcode')).default
                                const qrDataUrl = await QRCode.toDataURL(data, {
                                    width: 256,
                                    margin: 2
                                })
                                // Update local state for display so LP can scan it with another phone if needed
                                // We don't save this to the order yet, just local display helper
                                if (acceptedOrder) {
                                    setAcceptedOrder({
                                        ...acceptedOrder,
                                        qrImage: qrDataUrl
                                    })
                                }
                            } catch (e) {
                                console.error("Failed to generate QR from scan", e)
                            }
                        }
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    )
}
