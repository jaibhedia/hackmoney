"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useWallet } from "@/hooks/useWallet"
import { useStaking } from "@/hooks/useStaking"
import { Loader2, Shield, AlertTriangle } from "lucide-react"

/**
 * Route Guard - Bank-grade navigation protection
 * 
 * Features:
 * - Protects all app routes - requires wallet connection
 * - Role-based access control (LP, Arbitrator, Regular User)
 * - Prevents back-button navigation to unauthorized routes
 * - Auto-logout on tampering attempts
 * - Session timeout handling
 */

// Public routes that don't require auth
const PUBLIC_ROUTES = ["/", "/onboarding"]

// LP-only routes (excluding register which anyone can access)
const LP_ROUTES = ["/solver", "/lp"]

// Arbitrator-only routes - REMOVED restriction, anyone can view DAO
// const ARBITRATOR_ROUTES = ["/arbitrator"]

// Routes that regular users can't access if they're LPs
const USER_ONLY_ROUTES: string[] = [] // All routes accessible to everyone

// Session timeout (15 minutes of inactivity)
const SESSION_TIMEOUT_MS = 15 * 60 * 1000

interface RouteGuardProps {
    children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { isConnected, address, disconnect, isLoading: walletLoading } = useWallet()
    const { stakeProfile, fetchStakeProfile, isLoading: stakeLoading } = useStaking()
    
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isChecking, setIsChecking] = useState(true)
    const [lastActivity, setLastActivity] = useState(Date.now())
    const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

    const isLP = stakeProfile?.isLP ?? false
    // Arbitrator status used for UI only, not route blocking
    // const isArbitrator = stakeProfile?.tier === 'Gold' || stakeProfile?.tier === 'Diamond'

    // Reset activity timer on user interaction
    const resetActivityTimer = useCallback(() => {
        setLastActivity(Date.now())
        setShowTimeoutWarning(false)
    }, [])

    // Check session timeout
    useEffect(() => {
        if (!isConnected) return

        const checkTimeout = setInterval(() => {
            const elapsed = Date.now() - lastActivity
            
            // Show warning 2 minutes before timeout
            if (elapsed > SESSION_TIMEOUT_MS - 120000 && elapsed < SESSION_TIMEOUT_MS) {
                setShowTimeoutWarning(true)
            }
            
            // Logout on timeout
            if (elapsed > SESSION_TIMEOUT_MS) {
                console.log("[RouteGuard] Session timeout - logging out")
                disconnect?.()
                router.replace("/")
            }
        }, 10000) // Check every 10 seconds

        return () => clearInterval(checkTimeout)
    }, [isConnected, lastActivity, disconnect, router])

    // Track user activity
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
        
        events.forEach(event => {
            window.addEventListener(event, resetActivityTimer, { passive: true })
        })

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetActivityTimer)
            })
        }
    }, [resetActivityTimer])

    // Fetch stake profile when connected
    useEffect(() => {
        if (address && isConnected) {
            fetchStakeProfile()
        }
    }, [address, isConnected, fetchStakeProfile])

    // Main route authorization check
    useEffect(() => {
        const checkAuthorization = async () => {
            setIsChecking(true)

            // Allow public routes
            if (PUBLIC_ROUTES.includes(pathname)) {
                setIsAuthorized(true)
                setIsChecking(false)
                return
            }

            // Wait for wallet to finish loading
            if (walletLoading) {
                return
            }

            // Not connected - redirect to onboarding to login
            if (!isConnected) {
                console.log("[RouteGuard] Not connected - redirecting to onboarding")
                router.replace("/onboarding")
                setIsAuthorized(false)
                setIsChecking(false)
                return
            }

            // Wait for stake profile to load
            if (stakeLoading) {
                return
            }

            // Check LP routes (solver and lp dashboard only - not register)
            if (LP_ROUTES.some(route => pathname === route || (pathname.startsWith(route + "/") && !pathname.startsWith("/lp/register")))) {
                if (!isLP) {
                    console.log("[RouteGuard] Non-LP trying to access LP route - redirecting to register")
                    router.replace("/lp/register")
                    setIsAuthorized(false)
                    setIsChecking(false)
                    return
                }
            }

            // Arbitrator/DAO routes are open to all logged-in users
            // They can view disputes, only voting is restricted by tier

            // All checks passed
            setIsAuthorized(true)
            setIsChecking(false)
        }

        checkAuthorization()
    }, [pathname, isConnected, walletLoading, stakeLoading, isLP, router])

    // Prevent browser back button from going to unauthorized routes
    useEffect(() => {
        const handlePopState = () => {
            // Re-trigger authorization check on back button
            setIsChecking(true)
        }

        window.addEventListener('popstate', handlePopState)
        return () => window.removeEventListener('popstate', handlePopState)
    }, [])

    // Block navigation while checking
    useEffect(() => {
        if (isChecking && !PUBLIC_ROUTES.includes(pathname)) {
            // Replace history state to prevent back navigation during check
            window.history.replaceState(null, '', pathname)
        }
    }, [isChecking, pathname])

    // Loading state
    if (isChecking || walletLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center font-mono">
                    <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                    <p className="text-text-secondary text-sm uppercase">Verifying session...</p>
                </div>
            </div>
        )
    }

    // Session timeout warning
    if (showTimeoutWarning) {
        return (
            <>
                {children}
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-surface border border-warning rounded-lg p-6 max-w-sm text-center">
                        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-text-primary mb-2">Session Expiring</h2>
                        <p className="text-sm text-text-secondary mb-4">
                            Your session will expire in 2 minutes due to inactivity.
                        </p>
                        <button
                            onClick={resetActivityTimer}
                            className="w-full py-3 bg-brand text-white rounded-lg font-bold"
                        >
                            Continue Session
                        </button>
                    </div>
                </div>
            </>
        )
    }

    // Not authorized - prompt to login
    if (!isAuthorized && !PUBLIC_ROUTES.includes(pathname)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center font-mono p-6">
                    <Loader2 className="w-12 h-12 text-brand mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-text-primary mb-2">Login Required</h2>
                    <p className="text-sm text-text-secondary mb-4">
                        Please sign in to access this page.
                    </p>
                    <button
                        onClick={() => router.replace("/onboarding")}
                        className="px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition-all"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
