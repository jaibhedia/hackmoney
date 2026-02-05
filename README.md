# UwU - Trustless P2P Crypto Ramp

> Convert crypto to INR instantly. No banks. No KYC. Just vibes. ✨

![Arc Blockchain](https://img.shields.io/badge/Arc-Testnet-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636)

## 🎯 The Problem

**India has 450M+ smartphone users but crypto offramps are broken:**

- 🏦 Banks freeze accounts for crypto transactions
- ⏰ CEX withdrawals take 24-72 hours
- 📋 KYC requirements exclude millions
- 💸 High fees (2-5%) eat into small trades
- ❌ No recourse when P2P goes wrong

## 💡 The Solution

**UwU is a trustless P2P ramp with built-in protection:**

```
User wants INR → Scans UPI QR → USDC escrowed → LP pays INR → User confirms → LP gets USDC
```

### Key Innovation: **Stake = Trust**
- LPs stake USDC as collateral
- Stake amount = Maximum order they can process
- Fraud = Lose stake (progressive slashing)
- No central authority needed

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  Next.js 15 + Thirdweb + TailwindCSS                        │
├─────────────────────────────────────────────────────────────┤
│                        Smart Contracts                       │
│  P2PEscrowV3.sol (Arc Testnet)                              │
│  - LP Staking & Tiers ($50-$1000)                           │
│  - Escrow Management                                         │
│  - Dispute Resolution (4hr timeout)                          │
│  - Progressive Slashing (20%→50%→100%)                       │
├─────────────────────────────────────────────────────────────┤
│                         Backend                              │
│  Sui Move Modules (logging) + API Routes                    │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

### For Users
- 📱 Scan any UPI QR to sell crypto
- ⚡ ~3 minute settlement time
- 🔒 Funds escrowed until confirmed
- 🛡️ Dispute protection with arbitration

### For Liquidity Providers
- 💰 Earn spread on trades
- 📊 5-tier system based on stake
- 📈 Build reputation over time
- 🏆 Trust score visibility

### Security
- ✅ Non-custodial escrow
- ✅ Stake-at-risk for LPs
- ✅ Progressive slashing for fraud
- ✅ 4-hour dispute resolution
- ✅ Cooldown periods (anti-sybil)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/uwu.git
cd uwu

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your NEXT_PUBLIC_THIRDWEB_CLIENT_ID

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Smart Contracts

```bash
cd contracts/solidity

# Install
pnpm install

# Compile
npx hardhat compile

# Deploy to Arc Testnet
npx hardhat run scripts/deploy_v2.js --network arc
```

## 📊 Economic Model

| Tier | Stake | Max Order | Use Case |
|------|-------|-----------|----------|
| 1 | $50 | $50 | New LPs |
| 2 | $100 | $100 | Small trades |
| 3 | $250 | $250 | Regular |
| 4 | $500 | $500 | Power users |
| 5 | $1,000 | $1,000 | High volume |

**Fees:**
- Platform: 0.5%
- Small orders (<$10): +₹10 flat fee

**Slashing:**
- 1st dispute lost: 20% stake
- 2nd dispute lost: 50% stake
- 3rd dispute lost: 100% stake + BAN

See [ECONOMICS.md](./ECONOMICS.md) for full details.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS |
| Wallet | Thirdweb SDK, WalletConnect |
| Blockchain | Arc Testnet (EVM), Sui (logging) |
| Contracts | Solidity 0.8.20, Hardhat |
| Storage | IPFS (dispute evidence) |
| Rates | CoinGecko API (live USDC/INR) |

## 📁 Project Structure

```
uwu/
├── src/
│   ├── app/           # Next.js app router
│   │   ├── (app)/     # Authenticated routes
│   │   └── api/       # API routes
│   ├── components/    # React components
│   │   ├── app/       # App-specific
│   │   ├── landing/   # Marketing pages
│   │   └── ui/        # Primitives
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utilities
├── contracts/
│   ├── solidity/      # EVM contracts
│   └── sui/           # Move modules
└── public/            # Static assets
```

## 🔑 Key Files

- `contracts/solidity/contracts/P2PEscrowV3.sol` - Main escrow contract
- `src/hooks/useEscrow.ts` - Contract interactions
- `src/components/app/merchant-card.tsx` - LP display with trust signals
- `src/components/app/order-status-tracker.tsx` - Order progress UI

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- Arc team for the testnet
- Thirdweb for wallet infrastructure
- OpenZeppelin for secure contracts

---

**Built with 💜 for the Arc Hackathon**

*Disclaimer: This is a hackathon project. Use at your own risk. Not financial advice.*

