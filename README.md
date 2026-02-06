# uWu — Trustless P2P Crypto-to-Fiat Protocol

> Convert USDC to INR by scanning a QR code. Non-custodial escrow, stake-based trust, economic fraud prevention.

![Arc Blockchain](https://img.shields.io/badge/Arc-Testnet-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

---

## The Problem

**Crypto-to-fiat is still broken in emerging markets.**

If someone in India wants to convert USDC to INR (or vice versa), they have three options — all terrible:

| Option | Problem |
|--------|---------|
| **Centralized Exchanges** (WazirX, CoinDCX) | KYC delays, withdrawal limits, regulatory risk, high fees (2-5%), custodial risk (WazirX was hacked for $230M in 2024) |
| **P2P on Binance/Paxful** | Counterparty fraud, fake payment proofs, no on-chain escrow, centralized dispute resolution, platform can freeze funds |
| **OTC/Telegram Dealers** | Zero accountability, scam-prone, no recourse, illegal in many jurisdictions |

**The core issue:** There's no trustless, non-custodial way to bridge crypto ↔ fiat with real economic guarantees against fraud.

---

## The Solution

**uWu is a non-custodial P2P payment protocol that makes crypto-to-fiat as simple as scanning a QR code — with on-chain escrow, stake-based trust, and economic fraud prevention.**

### 30-Second Version

```
User scans QR → USDC locked in escrow → LP sends INR via UPI → User confirms → USDC released to LP
```

If anything goes wrong, the LP's stake gets slashed. Fraud is **economically irrational**.

### Detailed Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   USER      │     │  SMART       │     │  LIQUIDITY  │
│  (has USDC) │────▶│  CONTRACT    │────▶│  PROVIDER   │
│             │     │  (Escrow)    │     │  (has INR)  │
└─────────────┘     └──────────────┘     └─────────────┘
      │                    │                     │
      │  1. Scan QR        │                     │
      │  2. Enter amount   │                     │
      │  3. USDC locked ──▶│                     │
      │                    │  4. LP matched       │
      │                    │  (round-robin)       │
      │                    │────────────────────▶│
      │                    │                     │  5. LP sends INR
      │                    │                     │     via UPI
      │  6. User confirms  │                     │
      │     INR received ─▶│                     │
      │                    │  7. USDC released ──▶│
      │                    │                     │
      │         DISPUTE?   │                     │
      │  ──────────────────▶  Evidence + DAO ────▶│
      │                    │  Loser gets slashed  │
      └────────────────────┴─────────────────────┘
```

---

## Smart Contracts (Solidity — Arc Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **P2PEscrowV3** | `0x9Cd646Cc524A4067CDf3f236dBf81023861E8F0C` | Core escrow with LP rotation, cooldowns, velocity limits, daily volume caps |
| **TrustScore** | `0x25cC4Da421FA5A8dcEa7CEC64eA9Bab0f1f8F08a` | On-chain reputation scoring (trade history, disputes, account age) |
| **DisputeDAO** | `0x7F8a05cE96A86F2Bd6Fb91a8D08Bccd7F5a9a441` | Dispute resolution with stake slashing |
| **USDC** | `0x3600000000000000000000000000000000000000` | Arc native USDC precompile |

### Key Contract Features

```solidity
// Stake = Max Order (LP can't process orders larger than their stake)
require(orderAmount <= lpStake, "Order exceeds stake tier");

// Progressive slashing for bad actors
// 1st offense: 20% stake slashed
// 2nd offense: 50% stake slashed
// 3rd offense: 100% stake slashed + BANNED

// LP Rotation (round-robin, skip unresponsive)
function _getNextEligibleLP() → selects from active LP pool

// Velocity limits (anti-abuse)
// Max 5 orders/hour per user, 30-min cooldown if exceeded

// Rate locking — exchange rate frozen at order creation time
```

---

## Economic Model: Why Fraud Doesn't Pay

This is the core innovation. We make fraud **economically irrational** through stake-based security.

### LP Tier System

| Tier | Stake Required | Max Order | Daily Limit |
|------|---------------|-----------|-------------|
| Bronze | $50 USDC | $50 | $50/day |
| Silver | $200 USDC | $200 | $200/day |
| Gold | $500 USDC | $500 | $500/day |
| Diamond | $2,000 USDC | $2,000 | $2,000/day |

### Why Fraud is Irrational

**Scenario: LP tries to steal $50 from a user**

```
LP's stake:           $50 USDC (minimum for Bronze)
Potential gain:       $50 (the stolen amount)
Slashing penalty:     20% first offense = $10 slashed
                      50% second offense = $25 slashed
                      100% third offense = $50 slashed + PERMANENT BAN

Expected Value of fraud:
  EV = P(success) × $50 - P(caught) × $50
  EV = 0.1 × $50 - 0.9 × $50 = -$40

Result: FRAUD LOSES MONEY
```

**Key insight:** The LP's stake is always ≥ the order amount. They can never process an order larger than what they've put at risk. This is enforced at the smart contract level.

### Progressive Slashing

| Offense | Slash % | Cooldown | Additional |
|---------|---------|----------|------------|
| 1st | 20% | 24 hours | Warning |
| 2nd | 50% | 48 hours | Trust score tanked |
| 3rd | 100% | **Permanent** | **Banned forever** |

### User Protection

| Behavior | Consequence |
|----------|-------------|
| Completes orders | +2 trust per order |
| Raises valid dispute | Protected, LP slashed |
| Raises false dispute | -5 trust per dispute |
| Loses dispute | Banned + all stake lost |
| Abandons order | 12-hour cooldown |
| 5 orders in 1 hour | 30-min velocity cooldown |

### User Daily Limits

| Trust Level | Requirement | Daily Limit |
|-------------|-------------|-------------|
| New | < 50 trades | $150/day |
| Established | 50+ trades | $300/day |
| High Trust | 100+ trades, 0 disputes | $750/day |

See [ECONOMICS.md](./ECONOMICS.md) for the full economic model.

---

## Security

### Anti-Abuse Mechanisms

| Attack Vector | Protection |
|---------------|------------|
| Sybil (fake accounts) | 10-min new account cooldown, $150/day limit for new users |
| Velocity abuse | Max 5 orders/hour, 30-min cooldown if exceeded |
| LP front-running | Rate locked at order creation time (CoinGecko snapshot) |
| LP ghosting | Auto-escalate to dispute after 15 min offline |
| Fake payment proof | UTR required, 3 strikes = ban |
| Stake withdrawal during dispute | 24-hour unstaking notice period, auto-deactivation |
| Order > stake | Contract-level rejection: `require(amount <= stake)` |

### Dispute Resolution (4-Hour SLA)

```
User raises dispute
    → Order frozen (funds locked in escrow)
    → Both parties submit evidence (screenshots, UTR, text)
    → Evidence uploaded to IPFS (Pinata)
    → Admin reviews within 4 hours (MVP)
    → Decision: Buyer wins or Seller wins
    → Loser's stake slashed, winner made whole
    → Future: DAO voting by qualified arbitrators
```

---

## Why This Matters

### For Users
- **No KYC** — Connect wallet and go
- **No custodial risk** — Funds in smart contract, not a company's wallet
- **Sub-1% fees** — LP competition drives fees down
- **Real-time** — UPI settlement in seconds, not 24-48 hours

### For Liquidity Providers
- **Earn 2-3.5% on every trade** — Better than most DeFi yields
- **Set your own hours** — Go online/offline anytime
- **Transparent rules** — Everything on-chain, no platform arbitrariness
- **Tier progression** — Stake more, earn more, unlock higher limits

### For the Ecosystem
- **True decentralization** — No single point of failure
- **Regulatory resilience** — P2P, non-custodial, no money transmission
- **Composable** — Any dApp can integrate uWu's escrow
- **Multi-chain ready** — Deployed on Arc, contracts portable to any EVM chain

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (Turbopack), TypeScript, Tailwind CSS, Framer Motion |
| **Wallet** | Thirdweb SDK v5 (MetaMask, WalletConnect, Social Login via Google/Apple) |
| **Smart Contracts** | Solidity 0.8.20, Hardhat, OpenZeppelin |
| **Chain** | Arc Testnet (Chain ID: 5042002) |
| **Storage** | IPFS via Pinata (dispute evidence) |
| **Pricing** | CoinGecko API (live USDC/INR rates, 1-min cache) |
| **Design** | Aave-inspired minimalist dark theme |

---

## Project Structure

```
uwu/
├── src/
│   ├── app/                        # Next.js app router
│   │   ├── page.tsx                # Landing page
│   │   └── (app)/                  # Authenticated routes
│   │       ├── scan/               # QR Scan & Pay (core user flow)
│   │       ├── buy/                # Buy USDC with INR
│   │       ├── solver/             # LP Dashboard (accept/manage orders)
│   │       ├── lp/register/        # LP Registration (4-step onboarding)
│   │       ├── stake/              # Stake management
│   │       ├── arbitrator/         # Dispute resolution (admin + DAO)
│   │       └── orders/             # Order history & tracking
│   ├── components/
│   │   ├── app/                    # App-specific components
│   │   ├── landing/                # Marketing page sections
│   │   └── ui/                     # Primitives (shadcn/ui)
│   ├── hooks/
│   │   ├── useStaking.ts           # Stake management
│   │   ├── useLPRotation.ts        # LP selection algorithm
│   │   ├── useCooldown.ts          # Cooldown tracking
│   │   ├── useUserLimits.ts        # Daily limits by trust level
│   │   └── useTrustScore.ts        # Reputation display
│   └── lib/
│       ├── reputation-scoring.ts   # LP & User score formulas
│       ├── rate-lock.ts            # Exchange rate freezing
│       └── currency-converter.ts   # Live CoinGecko rates
├── contracts/
│   ├── solidity/
│   │   └── contracts/
│   │       ├── P2PEscrowV2.sol     # Core escrow contract
│   │       ├── TrustScore.sol      # Reputation system
│   │       └── DisputeDAO.sol      # Governance
│   └── sui/
│       └── sources/                # Move modules (logging)
└── public/                         # Static assets
```

---

## Features Implemented

| # | Feature | Status |
|---|---------|--------|
| 1 | QR Scan & Pay flow | ✅ |
| 2 | LP Registration (4-step onboarding) | ✅ |
| 3 | Stake-based tier system | ✅ |
| 4 | On-chain escrow with rate locking | ✅ |
| 5 | LP rotation (round-robin) | ✅ |
| 6 | Trust score system (LP + User) | ✅ |
| 7 | Dispute resolution with evidence upload | ✅ |
| 8 | Progressive stake slashing | ✅ |
| 9 | Velocity limits & cooldowns | ✅ |
| 10 | User daily limits by trust level | ✅ |
| 11 | Admin arbitrator dashboard (4hr SLA) | ✅ |

---

## Quick Start

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
npx hardhat run scripts/deploy_v3.js --network arcTestnet
```

---

## Try It

1. Visit the landing page
2. Click **Launch App** → Connect wallet (MetaMask on Arc Testnet or Social Login)
3. **As a User:** Scan & Pay → Enter amount → Get matched with LP → Confirm payment
4. **As an LP:** Become LP → Stake 50+ USDC → Configure offer → Start accepting orders

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*"We didn't build another DEX. We built the bridge between crypto and the real world — where your USDC becomes rupees in someone's UPI wallet in under 60 seconds, trustlessly."*

**Built for HackMoney 2026**

