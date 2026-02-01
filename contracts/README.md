# uWu Smart Contracts

This directory contains smart contracts for the uWu P2P platform.

## Structure

```
contracts/
├── solidity/           # EVM contracts for Arc Testnet
│   ├── P2PEscrow.sol   # USDC escrow for P2P trades
│   ├── TrustScore.sol  # On-chain reputation system
│   ├── hardhat.config.ts
│   ├── package.json
│   └── scripts/
│       └── deploy.ts
│
└── sui/                # Move contracts for Sui Testnet
    ├── Move.toml
    └── sources/
        ├── orders.move  # Order storage
        └── names.move   # .uwu naming system
```

## Solidity Contracts (Arc Testnet)

### Setup

```bash
cd contracts/solidity
npm install
```

### Compile

```bash
npm run compile
```

### Deploy to Arc Testnet

1. Set environment variables:
```bash
export DEPLOYER_PRIVATE_KEY=0x...
export USDC_ADDRESS=0x...
```

2. Deploy:
```bash
npm run deploy:arc
```

### Contract Overview

#### P2PEscrow.sol
- **Purpose**: Manages USDC escrow for P2P fiat-crypto trades
- **Key Functions**:
  - `createEscrow(orderId, amount, recipient, expiresAt)` - Lock USDC
  - `releaseEscrow(orderId)` - Release to recipient (seller confirms fiat received)
  - `refundEscrow(orderId)` - Refund to sender (order cancelled/expired)
  - `raiseDispute(orderId, reason)` - Initiate dispute
  - `resolveDispute(orderId, releaseToRecipient)` - Arbitrator decision

#### TrustScore.sol
- **Purpose**: On-chain reputation tracking
- **Key Functions**:
  - `recordTrade(user, volume, asSeller)` - Record completed trade
  - `recordDispute(user, lost)` - Record dispute outcome
  - `getTrustScore(user)` - Calculate trust score (0-100)
  - `getReputation(user)` - Get detailed reputation data

---

## Sui Contracts

### Setup

Install Sui CLI:
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### Build

```bash
cd contracts/sui
sui move build
```

### Publish to Sui Testnet

```bash
sui client publish --gas-budget 100000000
```

### Contract Overview

#### orders.move
- **Purpose**: Persistent order storage on Sui
- **Key Functions**:
  - `create_order(...)` - Create new order object
  - `match_order(order, ...)` - Solver matches order
  - `update_status(order, new_status, ...)` - Update order status
  - `set_arc_tx_hash(order, tx_hash, ...)` - Link Arc transaction

#### names.move
- **Purpose**: ENS-style .uwu naming system
- **Key Functions**:
  - `register_name(registry, name, ...)` - Register username.uwu
  - `transfer_name(registry, uwu_name, to, ...)` - Transfer ownership
  - `resolve_name(registry, name)` - Get address for name
  - `get_primary_name(registry, addr)` - Get name for address

---

## Configuration After Deployment

Update the following files with deployed contract addresses:

### `.env.local`
```
NEXT_PUBLIC_P2P_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_TRUST_SCORE_ADDRESS=0x...
NEXT_PUBLIC_SUI_PACKAGE_ID=0x...
NEXT_PUBLIC_UWU_NAMES_PACKAGE_ID=0x...
```

### `src/lib/web3-config.ts`
```typescript
export const CONTRACT_ADDRESSES = {
    P2P_ESCROW: '0x...',
    TRUST_SCORE: '0x...',
    LIQUIDITY_POOL: '0x...',
}
```

---

## Security Notes

⚠️ **These contracts are for testnet use only and have not been audited.**

Before mainnet deployment:
1. Complete security audit
2. Add emergency pause functionality
3. Implement upgrade patterns (proxy)
4. Add rate limiting
5. Consider MEV protection
