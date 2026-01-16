import { NextResponse } from "next/server"

// Mock reputation data
const reputationData = {
    score: 85,
    level: "Good",
    tradingCap: 10000,
    totalTrades: 127,
    successRate: 98.4,
    history: [
        { action: "Completed trade", points: 5, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { action: "Fast payment", points: 3, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
        { action: "Completed trade", points: 5, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        { action: "Delayed response", points: -2, timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
        { action: "Completed trade", points: 5, timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
    ],
    rewards: {
        total: 478.50,
        thisMonth: 45.20,
        pending: 12.00,
    },
    milestones: [
        { title: "First Trade", achieved: true, reward: 5 },
        { title: "10 Trades", achieved: true, reward: 25 },
        { title: "50 Trades", achieved: true, reward: 100 },
        { title: "100 Trades", achieved: false, reward: 250, progress: 85 },
        { title: "Whale Status", achieved: false, reward: 500, progress: 42 },
    ],
}

export async function GET() {
    return NextResponse.json(reputationData)
}
