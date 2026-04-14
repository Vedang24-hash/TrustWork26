# TrustWork — Decentralized Escrow for Freelance Contracts

> Trustless, transparent, and tamper-proof freelance agreements built on the **Stellar blockchain** using **Soroban smart contracts**.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-purple)](https://soroban.stellar.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

1. [Overview](#overview)
2. [Live Demo](#live-demo)
3. [Architecture](#architecture)
   - [System Architecture Diagram](#system-architecture-diagram)
   - [Frontend Layer](#frontend-layer)
   - [Smart Contract Layer](#smart-contract-layer)
   - [Data Layer](#data-layer)
   - [Wallet Integration](#wallet-integration)
4. [Project Structure](#project-structure)
5. [Smart Contract Framework](#smart-contract-framework)
6. [Key Features](#key-features)
7. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
   - [Running Locally](#running-locally)
8. [Deploying the Smart Contract](#deploying-the-smart-contract)
9. [User Flow](#user-flow)
10. [Tech Stack](#tech-stack)
11. [Phase 2 Roadmap — Improvements Based on User Feedback](#phase-2-roadmap--improvements-based-on-user-feedback)
12. [Contributing](#contributing)

---

## Overview

TrustWork is a **decentralized escrow-based payment infrastructure** for freelance contracts. It eliminates the need for trust between clients and freelancers by locking project funds in a Soroban smart contract before work begins.

**The problem it solves:**
- Clients fear paying upfront and receiving no work
- Freelancers fear completing work and not getting paid
- Traditional escrow services are slow, expensive, and centralized

**How TrustWork solves it:**
- Funds are locked in a **Soroban smart contract** — neither party can access them unilaterally
- Work submission, approval, and payment release are all **on-chain transactions** signed by Freighter
- Disputes are resolved by a **human arbitrator** whose address is locked in the contract at creation
- Every action is **publicly verifiable** on Stellar Explorer

---

## Live Demo

> **Testnet deployment** — use Freighter wallet on Stellar Testnet

```
https://github.com/Vedang24-hash/TrustWork26
```

Fund your testnet wallet: [Stellar Friendbot](https://friendbot.stellar.org)

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (Vite)                     │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │  Pages   │  │Components│  │  Hooks   │  │   Utils    │  │   │
│  │  │          │  │          │  │          │  │            │  │   │
│  │  │ Home     │  │ Navbar   │  │useWallet │  │contract.js │  │   │
│  │  │ Dashboard│  │ ChatBox  │  │useChat   │  │stellar.js  │  │   │
│  │  │ Create   │  │ ActionPnl│  │          │  │templates.js│  │   │
│  │  │ Detail   │  │ TxModal  │  │          │  │            │  │   │
│  │  │Arbitration│  │WalletMdl│  │          │  │            │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │              Freighter Wallet Extension                      │   │
│  │         (Transaction signing · Identity · Auth)              │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ Signed XDR Transactions
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                      STELLAR NETWORK                                │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Soroban RPC (soroban-testnet.stellar.org)       │   │
│  │                                                              │   │
│  │  simulate_transaction → assemble → sign → send → poll       │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │              TrustWork Escrow Smart Contract                 │   │
│  │                   (Soroban / Rust)                           │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │ factory  │  │  escrow  │  │ storage  │  │   types    │  │   │
│  │  │          │  │          │  │          │  │            │  │   │
│  │  │create()  │  │deposit() │  │load/save │  │EscrowState │  │   │
│  │  │count()   │  │submit()  │  │per escrow│  │Resolution  │  │   │
│  │  │          │  │approve() │  │          │  │EscrowConfig│  │   │
│  │  │          │  │dispute() │  │          │  │EscrowError │  │   │
│  │  │          │  │resolve() │  │          │  │            │  │   │
│  │  │          │  │claim()   │  │          │  │            │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Stellar Asset Contract (SAC)                    │   │
│  │              XLM / USDC token transfers                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                      SUPABASE (Optional)                            │
│                                                                     │
│   Real-time chat messages · Cross-device sync · PostgreSQL          │
│   Falls back to localStorage when not configured                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Frontend Layer

Built with **React 19 + Vite 8**, plain CSS (no UI framework). Single-page application with client-side routing via state.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | React 19 | Component rendering |
| Build Tool | Vite 8 | Dev server, bundling |
| Styling | Plain CSS variables | Dark Web3 design system |
| State | React useState/useEffect | Local + contract state |
| Persistence | localStorage | Contract data per wallet |
| Real-time | Supabase Realtime | Chat sync across devices |

**Component responsibilities:**

```
App.jsx                 → Root: routing, wallet state, contract CRUD
├── Navbar              → Navigation, wallet badge, disconnect dropdown
├── WalletModal         → Freighter connect flow (install → approve → connected)
├── TxModal             → Non-blocking transaction signing indicator
│
├── pages/Home          → Landing page, features, how-it-works
├── pages/Dashboard     → Contract list, stats, pending review banner
├── pages/CreateContract → 4-step contract builder wizard
├── pages/ContractDetail → Tabs: Overview | Deliverables | Chat | Verify
├── pages/Arbitration   → Dispute queue, resolve modal
│
├── components/ActionPanel    → Role-aware action buttons (submit/approve/dispute/claim)
├── components/ContractChat   → Private chat room with submission cards
├── components/ContractCard   → Dashboard card with escrow amount + status
├── components/ContractForm   → Multi-step form with template picker
├── components/FileUploader   → Drag-drop IPFS file upload
└── components/WalletModal    → Wallet connection states
```

---

### Smart Contract Layer

Written in **Rust** targeting **Soroban** (Stellar's smart contract platform). Located in `/democontract`.

**Contract state machine:**

```
AwaitingDeposit
      │
      ▼ deposit()
   Funded
      │
      ├──── submit_work() ──► WorkSubmitted
      │                            │
      │                 ┌──────────┴──────────┐
      │          approve_and_release()    raise_dispute()
      │                 │                      │
      │             Completed              Disputed
      │                                        │
      │                              resolve_dispute()
      │                              ┌──────────┴──────────┐
      │                         Completed             Refunded
      │
      └──── refund() ──► Refunded
      └──── claim_after_deadline() ──► Completed (after deadline)
```

**Module breakdown:**

| Module | File | Responsibility |
|--------|------|---------------|
| Entry point | `lib.rs` | Public contract interface, all callable functions |
| Types | `types.rs` | `EscrowState`, `Resolution`, `EscrowConfig`, `EscrowError` |
| Storage | `storage.rs` | Soroban persistent storage abstraction |
| Core logic | `escrow.rs` | All state transitions with auth + validation |
| Factory | `factory.rs` | Creates and tracks escrow instances |
| Demo | `demo.rs` | Unit tests + deployment guide |

---

### Data Layer

**On-chain (Soroban persistent storage):**
- `EscrowConfig` per escrow ID — parties, amount, token, deadline, state
- Global counter for escrow IDs (factory)
- TTL extended to ~1 year of ledgers

**Off-chain (localStorage):**
- Contracts mirrored locally per wallet address key: `tw_contracts_<address>`
- Chat messages: `tw_chat_<contractId>` (fallback when Supabase not configured)
- Synced to freelancer's storage key on every update

**Real-time (Supabase PostgreSQL + Realtime):**
- `messages` table: `contract_id`, `sender`, `sender_role`, `text`, `attachments`, `type`, `ts`
- Subscription per contract channel with INSERT listener
- Graceful fallback to localStorage when `VITE_SUPABASE_URL` not set

---

### Wallet Integration

Uses `@stellar/freighter-api` v6.

```
Connect flow:
  isConnected() → check extension present
  requestAccess() → open Freighter approval popup
  getAddress() → fetch public key
  getNetwork() → verify testnet/mainnet

Sign flow:
  simulateTransaction() → get footprint + resource fee
  assembleTransaction() → attach simulation result
  signTransaction(xdr, { networkPassphrase, address }) → Freighter popup
  sendTransaction() → broadcast to Stellar network
  getTransaction() → poll for confirmation (up to 30s)
```

---

## Project Structure

```
trustwork/
├── trustwork-ui/                   # React frontend
│   ├── src/
│   │   ├── App.jsx                 # Root component + routing
│   │   ├── index.css               # Full design system (CSS variables)
│   │   ├── main.jsx                # React entry point
│   │   │
│   │   ├── components/
│   │   │   ├── ActionPanel.jsx     # Role-aware contract actions
│   │   │   ├── ContractCard.jsx    # Dashboard contract card
│   │   │   ├── ContractChat.jsx    # Private chat room
│   │   │   ├── ContractForm.jsx    # 4-step contract builder
│   │   │   ├── FileUploader.jsx    # IPFS file upload
│   │   │   ├── Navbar.jsx          # Navigation + wallet badge
│   │   │   ├── TxModal.jsx         # Transaction signing indicator
│   │   │   └── WalletModal.jsx     # Wallet connection flow
│   │   │
│   │   ├── hooks/
│   │   │   ├── useWallet.js        # Freighter wallet state
│   │   │   └── useChat.js          # Supabase/localStorage chat
│   │   │
│   │   ├── lib/
│   │   │   └── supabase.js         # Supabase client (lazy init)
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Dashboard.jsx       # Contract list + pending review
│   │   │   ├── CreateContract.jsx  # Contract creation wizard
│   │   │   ├── ContractDetail.jsx  # Contract detail + tabs
│   │   │   └── Arbitration.jsx     # Dispute resolution
│   │   │
│   │   └── utils/
│   │       ├── contract.js         # State helpers + localStorage
│   │       ├── contractTemplates.js # Contract presets
│   │       └── stellar.js          # Soroban SDK integration
│   │
│   ├── .env                        # Environment variables (not committed)
│   ├── .env.example                # Template for env vars
│   ├── package.json
│   └── vite.config.js
│
└── democontract/                   # Soroban smart contract (Rust)
    ├── lib.rs                      # Contract entry point
    ├── types.rs                    # Types and enums
    ├── storage.rs                  # Storage abstraction
    ├── escrow.rs                   # Core escrow logic
    ├── factory.rs                  # Factory pattern
    ├── demo.rs                     # Tests + deployment guide
    └── Cargo.toml                  # Rust dependencies
```

---

## Smart Contract Framework

The `/democontract` directory contains a **modular, reusable escrow framework** — not just a single contract. It is designed to be adapted to other blockchain ecosystems.

**Public functions:**

| Function | Caller | Description |
|----------|--------|-------------|
| `create_escrow(...)` | Client | Deploy new escrow instance via factory |
| `deposit(escrow_id)` | Client | Lock funds into escrow |
| `submit_work(escrow_id)` | Freelancer | Mark work as complete |
| `approve_and_release(escrow_id)` | Client | Release funds to freelancer |
| `refund(escrow_id)` | Client | Return funds before submission |
| `raise_dispute(escrow_id)` | Either | Flag for arbitration |
| `resolve_dispute(escrow_id, resolution)` | Arbitrator | Release / refund / split |
| `claim_after_deadline(escrow_id)` | Freelancer | Auto-claim after review period |
| `get_escrow(escrow_id)` | Anyone | Read contract state |
| `escrow_count()` | Anyone | Total instances created |

**Multi-chain adaptation:**

| Chain | What to change |
|-------|---------------|
| Soroban | This codebase as-is |
| CosmWasm | Replace `soroban-sdk` with `cosmwasm_std`, use CW20 for tokens |
| NEAR | Replace with `near-sdk-rs`, use `ft_transfer` |
| EVM (Stylus) | Replace with `alloy-primitives`, use ERC-20 `transferFrom` |

---

## Key Features

- **Escrow-protected payments** — funds locked in Soroban smart contract before work begins
- **4-step contract builder** — template picker → parties → terms → live preview
- **Milestone contracts** — split payment into N independent escrow instances
- **Private chat room** — client + freelancer workspace with invite link
- **Work submission in chat** — freelancer submits with files, links, and notes
- **Inline approve/dispute** — client sees action buttons directly in chat after submission
- **IPFS file delivery** — deliverables pinned to IPFS with verifiable CIDs
- **Arbitration system** — arbitrator address locked on-chain, resolves with release/refund/split
- **Auto-claim** — freelancer claims payment if client is inactive past review period
- **Contract verification** — Verify tab shows on-chain proof, state history, CLI commands
- **Freighter wallet** — full signing flow with non-blocking transaction modal
- **Real-time chat** — Supabase Realtime sync, falls back to localStorage

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Freighter wallet](https://www.freighter.app) browser extension
- A Stellar testnet account (funded via [Friendbot](https://friendbot.stellar.org))

### Installation

```bash
git clone https://github.com/Vedang24-hash/TrustWork26.git
cd TrustWork26/trustwork-ui
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Deployed Soroban contract address
VITE_CONTRACT_ID=C...

# Stellar network config
VITE_STELLAR_NETWORK=testnet
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Optional: Supabase for real-time cross-device chat
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> Without `VITE_CONTRACT_ID`, the app runs in **simulation mode** — all contract actions apply locally without hitting the blockchain. Useful for UI development.

> Without Supabase keys, chat messages persist in **localStorage** only (single device).

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploying the Smart Contract

### 1. Install Rust + Soroban CLI

```bash
rustup target add wasm32-unknown-unknown
cargo install --locked soroban-cli
```

### 2. Generate a deployer keypair

```bash
soroban keys generate deployer --network testnet
soroban keys address deployer
# Fund: https://friendbot.stellar.org/?addr=<YOUR_ADDRESS>
```

### 3. Build and optimize

```bash
cd democontract
cargo build --target wasm32-unknown-unknown --release
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/trustwork_escrow.wasm
```

### 4. Deploy

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/trustwork_escrow.optimized.wasm \
  --source deployer \
  --network testnet
# Copy the returned CONTRACT_ID into your .env
```

### 5. Create your first escrow

```bash
soroban contract invoke \
  --id <CONTRACT_ID> \
  --source <BUYER_KEY> \
  --network testnet \
  -- create_escrow \
    --buyer <BUYER_ADDRESS> \
    --seller <SELLER_ADDRESS> \
    --arbitrator <ARBITRATOR_ADDRESS> \
    --amount 25000000000 \
    --token <XLM_SAC_ADDRESS> \
    --deadline 1780000000 \
    --description "PROJECT_NAME"
```

---

## User Flow

```
CLIENT                          FREELANCER                    ARBITRATOR
  │                                  │                             │
  │ 1. Connect Freighter wallet       │                             │
  │ 2. Create contract                │                             │
  │    (freelancer addr, amount,      │                             │
  │     deadline, arbitrator)         │                             │
  │ 3. Sign deposit tx → funds locked │                             │
  │ 4. Share chat invite link ────────►                             │
  │                                  │ 5. Connect wallet            │
  │                                  │ 6. Join private chat         │
  │                                  │ 7. Submit work + files       │
  │                                  │ 8. Sign submit_work tx       │
  │◄──────── 9. Notification ─────────│                             │
  │                                  │                             │
  │ 10. Review deliverables           │                             │
  │                                  │                             │
  ├── APPROVE ──────────────────────────────────────────────────────►
  │   Sign approve_and_release tx     │                             │
  │   Funds → freelancer wallet ──────►                             │
  │                                  │                             │
  └── DISPUTE ──────────────────────────────────────────────────────►
      Sign raise_dispute tx           │                             │
                                      │          11. Review case    │
                                      │          12. Sign resolve   │
                                      │              (release/      │
                                      │               refund/split) │
                                      │◄── Funds distributed ───────│
```

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Frontend | React | 19.2 |
| Build | Vite | 8.0 |
| Blockchain | Stellar / Soroban | Testnet |
| Smart Contract | Rust + soroban-sdk | 21.0 |
| Wallet | Freighter API | 6.0 |
| Stellar SDK | @stellar/stellar-sdk | 14.6 |
| Real-time Chat | Supabase | 2.103 |
| File Storage | IPFS (simulated / web3.storage) | — |
| Styling | Plain CSS | — |

---

## Phase 2 Roadmap — Improvements Based on User Feedback

The following improvements are planned for Phase 2, informed by real user testing and feedback collected during Phase 1.

---

### Feedback Summary

| # | Feedback | Priority |
|---|----------|----------|
| 1 | Freighter popup doesn't open when TxModal overlay is active | Critical |
| 2 | Approve/dispute buttons not visible in client chat after submission | Critical |
| 3 | Wallet address comparison fails — buttons hidden for real wallets | High |
| 4 | Supabase realtime subscription crashes with "cannot add callbacks after subscribe()" | High |
| 5 | No way to upload actual files — only URL links | Medium |
| 6 | Contract builder needs more customization options | Medium |
| 7 | No mobile-responsive layout | Medium |
| 8 | Arbitration page needs better UX for arbitrators | Low |

---

### Planned Improvements

#### 🔴 Critical — Already Fixed in Current Commit

**Fix: Freighter popup blocked by TxModal overlay**
> The full-screen modal overlay was intercepting pointer events, preventing the Freighter browser extension popup from receiving focus.

- **Fix:** Replaced the blocking overlay during `signing` state with a non-blocking bottom toast. The page stays fully interactive while Freighter opens.
- **Commit:** [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb)

**Fix: Approve/dispute buttons missing in client chat**
> Buttons were gated on `liveStatus === SUBMITTED` which wasn't updating reliably after submission.

- **Fix:** Buttons now appear whenever a `submission` type message exists in chat, regardless of `liveStatus`. Removed all role-based gating from the action bar.
- **Commit:** [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb)

**Fix: Wallet address comparison failing for real Freighter wallets**
> `contract.client === wallet` was `false` because demo contracts used a hardcoded mock address.

- **Fix:** Role is now passed as an explicit prop (`role='client'|'freelancer'`) from `ContractDetail` — no address string comparison needed. Demo contracts are seeded with the real connected wallet address.
- **Commit:** [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb)

**Fix: Supabase realtime subscription crash**
> `useChat.js` was calling `.on()` after `.subscribe()` due to a React effect re-run race condition.

- **Fix:** Rewrote subscription lifecycle — Supabase client resolved once into a ref, channel built fresh with unique name per mount, `.on()` always called before `.subscribe()`.
- **Commit:** [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb)

---

#### 🟡 Phase 2 — Planned Next

**1. Real IPFS File Storage**

Currently files are uploaded to a simulated IPFS (fake CIDs). Phase 2 will integrate real IPFS pinning.

```
Plan:
  - Integrate web3.storage or Pinata SDK
  - Store real CIDs in contract submission metadata
  - Client can verify file integrity via CID hash
  - Add VITE_WEB3_STORAGE_TOKEN to .env
```

**2. Mobile-Responsive Layout**

The current layout is desktop-first. Phase 2 will add full mobile support.

```
Plan:
  - Responsive grid breakpoints for all pages
  - Mobile-optimized chat interface
  - Touch-friendly action buttons
  - PWA manifest for add-to-homescreen
```

**3. Multi-Token Support**

Currently only XLM is fully supported. Phase 2 will add USDC and custom SAC tokens.

```
Plan:
  - Token selector in contract builder (XLM / USDC / custom)
  - SAC address validation
  - Token balance display in wallet badge
  - Exchange rate display (XLM → USD)
```

**4. Notification System**

Users currently have no way to know when the other party takes action unless they're in the app.

```
Plan:
  - Email notifications via Supabase Edge Functions
  - Browser push notifications (Web Push API)
  - In-app notification bell with unread count
  - Notification preferences per contract
```

**5. Arbitrator Marketplace**

Currently arbitrators are manually specified by address. Phase 2 will add a discoverable arbitrator registry.

```
Plan:
  - On-chain arbitrator registry contract
  - Arbitrator profiles with reputation scores
  - Stake-based arbitrator selection
  - Dispute history and resolution track record
```

**6. Contract Templates Marketplace**

Allow users to publish and reuse contract templates.

```
Plan:
  - Template sharing via IPFS
  - Community-rated templates
  - Industry-specific templates (design, dev, writing, etc.)
  - Template versioning
```

**7. Milestone Payment Improvements**

Milestone contracts currently create N independent escrow instances. Phase 2 will add native milestone support in the smart contract.

```
Plan:
  - Single contract with multiple milestone states
  - Per-milestone submission and approval
  - Partial dispute resolution per milestone
  - Progress visualization in UI
```

**8. TypeScript Migration**

The frontend is currently plain JavaScript. Phase 2 will migrate to TypeScript for better type safety.

```
Plan:
  - Migrate utils/contract.js → contract.ts with full types
  - Type all component props
  - Strict mode enabled
  - Zod validation for form inputs
```

---

### Commit History

| Commit | Description |
|--------|-------------|
| [`88b3314`](https://github.com/Vedang24-hash/TrustWork26/commit/88b3314) | `feat: initial TrustWork UI — escrow contracts on Stellar/Soroban` |
| [`22b6f63`](https://github.com/Vedang24-hash/TrustWork26/commit/22b6f63) | `full working project` — complete UI, smart contract framework, wallet integration, chat system |
| [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb) | `chore: add .gitignore, remove build artifacts and .env from tracking` — production cleanup + all Phase 1 bug fixes |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT © 2026 TrustWork

---

<div align="center">
  <p>Built on <a href="https://stellar.org">Stellar</a> · Powered by <a href="https://soroban.stellar.org">Soroban</a></p>
  <p>
    <a href="https://github.com/Vedang24-hash/TrustWork26">GitHub</a> ·
    <a href="https://stellar.expert/explorer/testnet">Stellar Explorer</a> ·
    <a href="https://www.freighter.app">Freighter Wallet</a>
  </p>
</div>
