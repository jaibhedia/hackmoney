import { NextRequest, NextResponse } from "next/server"

// Mock orders database
let orders = [
    {
        id: "ORD-001",
        type: "buy",
        token: "USDC",
        amount: 500,
        status: "pending_payment",
        lp: "0x1234...5678",
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        paymentUrl: "uwu://pay/ORD-001"
    },
    {
        id: "ORD-002",
        type: "sell",
        token: "ETH",
        amount: 0.5,
        status: "matched",
        lp: "0x2345...6789",
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        paymentUrl: "uwu://pay/ORD-002"
    },
    {
        id: "ORD-003",
        type: "buy",
        token: "USDT",
        amount: 1000,
        status: "completed",
        lp: "0x3456...7890",
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        paymentUrl: null
    },
]

export async function GET() {
    return NextResponse.json({ orders })
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { type, token, amount } = body

    const newOrder = {
        id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
        type,
        token,
        amount,
        status: "pending_payment",
        lp: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        paymentUrl: `uwu://pay/ORD-${String(orders.length + 1).padStart(3, "0")}`,
    }

    orders.unshift(newOrder)

    return NextResponse.json({
        success: true,
        order: newOrder
    })
}
