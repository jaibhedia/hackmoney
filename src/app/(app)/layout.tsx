import { BottomNav } from "@/components/app/bottom-nav"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#0f0f13] pb-20">
            {children}
            <BottomNav />
        </div>
    )
}
