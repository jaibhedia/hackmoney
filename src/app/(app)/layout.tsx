import { BottomNav } from "@/components/app/bottom-nav"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background bg-grid text-text-primary font-mono pb-20 relative overflow-hidden">
            {children}
            <BottomNav />
        </div>
    )
}
