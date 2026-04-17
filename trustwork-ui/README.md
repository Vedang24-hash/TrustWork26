# TrustWork — Decentralized Escrow for Freelance Contracts

> Trustless, transparent, and tamper-proof freelance agreements built on the **Stellar blockchain** using **Soroban smart contracts**.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://trust-work26.vercel.app)
[![CI/CD](https://github.com/Vedang24-hash/TrustWork26/actions/workflows/deploy.yml/badge.svg)](https://github.com/Vedang24-hash/TrustWork26/actions/workflows/deploy.yml)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-purple)](https://soroban.stellar.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

1. [Overview](#overview)
2. [Live Demo](#live-demo)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Smart Contract Framework](#smart-contract-framework)
6. [Key Features](#key-features)
7. [Getting Started](#getting-started)
8. [Deploying the Smart Contract](#deploying-the-smart-contract)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [User Flow](#user-flow)
11. [Tech Stack](#tech-stack)
12. [User Feedback — Phase 1](#user-feedback--phase-1)
13. [Phase 2 Roadmap](#phase-2-roadmap)
14. [Contributing](#contributing)

---

## Overview

TrustWork is a **decentralized escrow-based payment platform** for freelance contracts. Funds are locked in a Soroban smart contract before work begins — neither party can access them unilaterally.

**The problem:**
- Clients fear paying upfront and receiving no work
- Freelancers fear completing work and not getting paid
- Traditional escrow services are slow, expensive, and centralized

**The solution:**
- Funds locked in a **Soroban smart contract** on Stellar
- Work submission, approval, and payment release are **on-chain transactions** signed via Freighter
- Disputes resolved by a **human arbitrator** whose address is locked in the contract at creation
- Every action is **publicly verifiable** on Stellar Explorer

---

## Live Demo

🌐 **[https://trust-work26.vercel.app](https://trust-work26.vercel.app)** — Stellar Testnet

**Setup:**
1. Install [Freighter wallet](https://www.freighter.app) browser extension
2. Switch Freighter to **Testnet**
3. Fund your wallet via [Stellar Friendbot](https://friendbot.stellar.org)
4. Connect and explore

---

## Architecture

### System Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      USER BROWSER                        │
│                                                          │
│   React 19 + Vite 8 (SPA)                               │
│   Pages · Components · Hooks · Utils                     │
│                                                          │
│   Freighter Wallet Extension                             │
│   (Transaction signing · Identity · Auth)                │
└─────────────────────────┬────────────────────────────────┘
                          │ Signed XDR Transactions
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   STELLAR NETWORK                        │
│                                                          │
│   Soroban RPC → simulate → assemble → sign → send        │
│                                                          │
│   TrustWork Escrow Contract (Rust/Soroban)               │
│   factory · escrow · storage · types                     │
│                                                          │
│   Stellar Asset Contract (XLM / USDC transfers)          │
└─────────────────────────┬────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│              SUPABASE (Optional)                         │
│   Real-time chat · PostgreSQL · Falls back to            │
│   localStorage when not configured                       │
└──────────────────────────────────────────────────────────┘
```

### Frontend Components

```
App.jsx                    Root — routing, wallet state, contract CRUD
├── Navbar                 Navigation + wallet badge + disconnect
├── WalletModal            Freighter connect flow
├── TxModal                Non-blocking transaction signing toast
├── pages/Home             Landing page
├── pages/Dashboard        Contract list + pending review banner
├── pages/CreateContract   4-step contract builder wizard
├── pages/ContractDetail   Overview | Deliverables | Chat | Verify tabs
├── pages/Arbitration      Dispute queue + resolve modal
├── components/ActionPanel Role-aware action buttons
├── components/ContractChat Private chat room with submission cards
├── components/FileUploader Drag-drop IPFS file upload
└── hooks/useWallet        Freighter wallet state
    hooks/useChat          Supabase / localStorage chat
```

### Smart Contract State Machine

```
AwaitingDeposit
      │ deposit()
      ▼
   Funded ──── refund() ──────────────────► Refunded
      │
      │ submit_work()
      ▼
 WorkSubmitted
      │
      ├── approve_and_release() ──────────► Completed
      ├── claim_after_deadline() ─────────► Completed
      └── raise_dispute()
               │
               ├── resolve_dispute(seller) ► Completed
               ├── resolve_dispute(buyer)  ► Refunded
               └── resolve_dispute(split)  ► Completed
```

### Data Layers

| Layer | Storage | Purpose |
|-------|---------|---------|
| On-chain | Soroban persistent storage | `EscrowConfig` per ID, global counter, ~1yr TTL |
| Off-chain | localStorage | Contracts per wallet key, chat fallback |
| Real-time | Supabase PostgreSQL + Realtime | Cross-device chat sync |

### Wallet Integration

```
Connect:  isConnected() → requestAccess() → getAddress() → getNetwork()
Sign:     simulateTransaction() → assembleTransaction() →
          signTransaction(xdr, { networkPassphrase, address }) →
          sendTransaction() → poll getTransaction()
```

---

## Project Structure

```
trustwork/
├── trustwork-ui/               React frontend
│   ├── src/
│   │   ├── App.jsx             Root component + routing
│   │   ├── index.css           Design system (CSS variables + mobile breakpoints)
│   │   ├── components/         UI components
│   │   ├── hooks/              useWallet, useChat
│   │   ├── lib/                Supabase client
│   │   ├── pages/              Home, Dashboard, Create, Detail, Arbitration
│   │   └── utils/              contract.js, stellar.js, contractTemplates.js
│   ├── vercel.json             Vercel deployment config
│   ├── .env.example            Environment variable template
│   └── package.json
│
└── democontract/               Soroban smart contract (Rust)
    ├── lib.rs                  Contract entry point
    ├── types.rs                EscrowState, Resolution, EscrowConfig, EscrowError
    ├── storage.rs              Soroban persistent storage abstraction
    ├── escrow.rs               All state transitions with auth + validation
    ├── factory.rs              Factory pattern — creates escrow instances
    ├── demo.rs                 Unit tests + deployment guide
    └── Cargo.toml
```

---

## Smart Contract Framework

The `/democontract` directory is a **modular, reusable escrow framework** designed to be adapted across blockchain ecosystems.

### Public Functions

| Function | Caller | Description |
|----------|--------|-------------|
| `create_escrow(...)` | Client | Deploy new escrow instance via factory |
| `deposit(id)` | Client | Lock funds into escrow |
| `submit_work(id)` | Freelancer | Mark work as complete |
| `approve_and_release(id)` | Client | Release funds to freelancer |
| `refund(id)` | Client | Return funds before submission |
| `raise_dispute(id)` | Either | Flag for arbitration |
| `resolve_dispute(id, resolution)` | Arbitrator | Release / refund / split |
| `claim_after_deadline(id)` | Freelancer | Auto-claim after review period expires |
| `get_escrow(id)` | Anyone | Read contract state |
| `escrow_count()` | Anyone | Total instances created |

### Multi-Chain Adaptation

| Chain | What to change |
|-------|---------------|
| Soroban | This codebase as-is |
| CosmWasm | Replace `soroban-sdk` → `cosmwasm_std`, use CW20 for tokens |
| NEAR | Replace with `near-sdk-rs`, use `ft_transfer` |
| EVM (Stylus) | Replace with `alloy-primitives`, use ERC-20 `transferFrom` |

---

## Key Features

| Feature | Description |
|---------|-------------|
| Escrow-protected payments | Funds locked in Soroban contract before work begins |
| 4-step contract builder | Template picker → parties → terms → live preview |
| Milestone contracts | Split payment into N independent escrow instances |
| Private chat room | Client + freelancer workspace with invite link |
| Work submission in chat | Freelancer submits files, links, and notes directly in chat |
| Inline approve / dispute | Client action buttons appear in chat after submission |
| IPFS file delivery | Deliverables pinned to IPFS with verifiable CIDs |
| Arbitration system | Arbitrator address locked on-chain, resolves with release/refund/split |
| Auto-claim | Freelancer claims payment if client is inactive past review period |
| Contract verification | Verify tab shows on-chain proof, state history, CLI commands |
| Mobile responsive | Full mobile support — no horizontal scroll, touch-friendly |
| Real-time chat | Supabase Realtime sync, falls back to localStorage |

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Freighter wallet](https://www.freighter.app) browser extension
- Stellar testnet account funded via [Friendbot](https://friendbot.stellar.org)

### Installation

```bash
git clone https://github.com/Vedang24-hash/TrustWork26.git
cd TrustWork26/trustwork-ui
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Environment Variables

Copy `.env.example` to `.env`:

```env
VITE_CONTRACT_ID=C...                          # Deployed Soroban contract address
VITE_STELLAR_NETWORK=testnet
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Optional — real-time cross-device chat
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> Leave `VITE_CONTRACT_ID` empty to run in **simulation mode** — all actions apply locally without hitting the blockchain.

---

## Deploying the Smart Contract

```bash
# 1. Install toolchain
rustup target add wasm32-unknown-unknown
cargo install --locked soroban-cli

# 2. Fund deployer
soroban keys generate deployer --network testnet
# Fund at: https://friendbot.stellar.org/?addr=<ADDRESS>

# 3. Build + optimize
cd democontract
cargo build --target wasm32-unknown-unknown --release
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/trustwork_escrow.wasm

# 4. Deploy
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/trustwork_escrow.optimized.wasm \
  --source deployer \
  --network testnet
# → Copy the returned CONTRACT_ID into your .env
```

---

## CI/CD Pipeline

Every push to `master` triggers an automated lint → build → deploy cycle via **GitHub Actions**.

```
Push to master
      │
      ▼
Job 1: Build
  checkout → Node 20 → npm ci → lint → build (with VITE_* secrets) → upload artifact
      │
      ▼ (master only)
Job 2: Deploy
  Vercel CLI → pull env → build → deploy → post URL on PR
```

Pipeline file: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

**Required GitHub Secrets** (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VITE_CONTRACT_ID` | Your deployed contract address |
| `VITE_STELLAR_NETWORK` | `testnet` |
| `VITE_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `VITE_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` |
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

---

## User Flow

```
CLIENT                        FREELANCER                  ARBITRATOR
  │                               │                           │
  │  1. Connect wallet             │                           │
  │  2. Create contract            │                           │
  │  3. Deposit funds (locked)     │                           │
  │  4. Share chat invite ─────────►                           │
  │                               │  5. Connect wallet         │
  │                               │  6. Join chat              │
  │                               │  7. Submit work + files    │
  │◄──── 8. Notification ──────────│                           │
  │  9. Review deliverables        │                           │
  │                               │                           │
  ├── APPROVE → funds released ────►                           │
  └── DISPUTE ──────────────────────────────────────────────── ►
                                                  10. Resolve  │
                                                  (release /   │
                                                   refund /    │
                                                   split)      │
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
| File Storage | IPFS / web3.storage | — |
| Styling | Plain CSS | — |
| Deployment | Vercel | — |
| CI/CD | GitHub Actions | — |

---

## User Feedback — Phase 1

Collected via the TrustWork Feedback Form during Phase 1 testing (April 2026).

| # | Tester | Rating | Feedback |
|---|--------|--------|----------|
| 1 | Sarthak Dhere | ⭐⭐⭐⭐⭐ | Useful application |
| 2 | Nisha Bahirat | ⭐⭐⭐⭐⭐ | Idea is good and needs to be scaled for production |
| 3 | Pramod Bahirat | ⭐⭐⭐⭐⭐ | Practically structured idea |
| 4 | Manisha Bahirat | ⭐⭐⭐⭐⭐ | Great Work!! |
| 5 | Vineet Kadam | ⭐⭐⭐⭐⭐ | Nice Work |

**Average Rating: 5.0 / 5.0** · 5 respondents

**Key takeaways:**
- Production scalability flagged → addressed in Phase 2 roadmap (IPFS, multi-token, TypeScript)
- Concept and structure validated by all testers
- UX resonates with target users

---

## Phase 2 Roadmap

Planned improvements based on Phase 1 testing and user feedback.

### Already Fixed (Phase 1)

| Issue | Fix | Commit |
|-------|-----|--------|
| Freighter popup blocked by TxModal overlay | Replaced full-screen overlay with non-blocking bottom toast | [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb) |
| Approve/dispute buttons missing in client chat | Buttons now trigger on submission message presence, not `liveStatus` | [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb) |
| Wallet address comparison failing | Role passed as explicit prop from `ContractDetail`, no string comparison | [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb) |
| Supabase realtime subscription crash | Rewrote subscription lifecycle — `.on()` always before `.subscribe()` | [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb) |
| Horizontal scroll on mobile | `overflow-x: clip` on html/body, `min()` on all grid minimums | [`c6e56b2`](https://github.com/Vedang24-hash/TrustWork26/commit/c6e56b2) |

### Planned (Phase 2)

| # | Improvement | Description |
|---|-------------|-------------|
| 1 | Real IPFS Storage | Integrate web3.storage / Pinata — real CIDs, verifiable file integrity |
| 2 | Multi-Token Support | USDC + custom SAC tokens, balance display, XLM→USD rate |
| 3 | Notification System | Email via Supabase Edge Functions, browser push, in-app bell |
| 4 | Arbitrator Marketplace | On-chain registry, reputation scores, stake-based selection |
| 5 | Native Milestones | Single contract with per-milestone states instead of N instances |
| 6 | TypeScript Migration | Full type safety — contract.ts, typed props, Zod validation |
| 7 | Template Marketplace | Community-shared contract templates via IPFS |

### Commit History

| Commit | Description |
|--------|-------------|
| [`88b3314`](https://github.com/Vedang24-hash/TrustWork26/commit/88b3314) | Initial TrustWork UI — escrow contracts on Stellar/Soroban |
| [`22b6f63`](https://github.com/Vedang24-hash/TrustWork26/commit/22b6f63) | Full working project — UI, smart contract, wallet, chat |
| [`02d44fb`](https://github.com/Vedang24-hash/TrustWork26/commit/02d44fb) | Production cleanup + all Phase 1 critical bug fixes |
| [`c6e56b2`](https://github.com/Vedang24-hash/TrustWork26/commit/c6e56b2) | Mobile responsive design, Vercel deployment, CI/CD, README |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'feat: description'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

---

## License

MIT © 2026 TrustWork

---

<div align="center">
  <p>Built on <a href="https://stellar.org">Stellar</a> · Powered by <a href="https://soroban.stellar.org">Soroban</a></p>
  <p>
    <a href="https://trust-work26.vercel.app">Live Demo</a> ·
    <a href="https://github.com/Vedang24-hash/TrustWork26">GitHub</a> ·
    <a href="https://stellar.expert/explorer/testnet">Stellar Explorer</a> ·
    <a href="https://www.freighter.app">Freighter Wallet</a>
  </p>
</div>
