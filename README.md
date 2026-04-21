# TrustWork

**Decentralized Escrow Infrastructure for Freelance Contracts on Stellar**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://trust-work26.vercel.app)
[![CI/CD](https://github.com/Vedang24-hash/TrustWork26/actions/workflows/deploy.yml/badge.svg)](https://github.com/Vedang24-hash/TrustWork26/actions/workflows/deploy.yml)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)](https://stellar.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Project Description

TrustWork is a decentralized escrow-based payment platform for freelance contracts built on the Stellar blockchain using Soroban smart contracts. It eliminates the trust gap between clients and freelancers by locking project funds in a smart contract before work begins.

Neither party can access the funds unilaterally. Payment is released only when the client approves the delivered work, or resolved by a human arbitrator in case of a dispute. Every transaction is signed via Freighter wallet and publicly verifiable on Stellar Explorer.

---

## Project Vision

The freelance economy suffers from a fundamental trust problem — clients risk paying for work that never arrives, and freelancers risk completing work that never gets paid. Centralized escrow services exist but are slow, expensive, and require trusting a third party.

TrustWork's vision is to make trustless freelance collaboration accessible to anyone with a Stellar wallet. By encoding contract terms, deadlines, and dispute resolution directly into a Soroban smart contract, TrustWork removes the middleman entirely. The goal is a world where a client in one country and a freelancer in another can collaborate with the same confidence as a signed legal contract — but faster, cheaper, and fully on-chain.

---

## Deployed Smart Contract

| Network | Contract ID |
|---------|-------------|
| Stellar Testnet | `CBEUUVKJD2FM5CL57COXJV55HXYSEDW7VXRBJFWKDNZZRSHBMWQZUNQS` |

Verify on Stellar Explorer:
[stellar.expert/explorer/testnet/contract/CBEUUVKJD2FM5CL57COXJV55HXYSEDW7VXRBJFWKDNZZRSHBMWQZUNQS](https://stellar.expert/explorer/testnet/contract/CBEUUVKJD2FM5CL57COXJV55HXYSEDW7VXRBJFWKDNZZRSHBMWQZUNQS)

---

## Key Features

- **Escrow-protected payments** — funds locked in a Soroban smart contract before work begins; neither party can withdraw unilaterally
- **Private chat workspace** — client and freelancer communicate in a contract-scoped chat room accessible only via wallet identity
- **Work submission with deliverables** — freelancer submits files, links, and notes directly in chat; client receives inline approve/dispute buttons
- **Human arbitration** — arbitrator address locked on-chain at contract creation; resolves disputes with release, refund, or split
- **Auto-claim protection** — freelancer can claim payment automatically if client is inactive past the review period
- **On-chain verification** — every state change is a signed Stellar transaction; full history viewable on Stellar Explorer
- **Milestone contracts** — split a project into independent escrow instances, each with its own deadline and approval
- **Mobile responsive** — fully functional on all screen sizes with no horizontal scroll

---

## Future Vision

**Phase 2 — Production Readiness**

| Improvement | Description |
|-------------|-------------|
| Real IPFS Storage | Replace simulated CIDs with web3.storage / Pinata for permanent, verifiable file delivery |
| Multi-Token Support | Accept USDC and any Stellar Asset Contract token alongside XLM |
| Notification System | Email and push notifications when the other party takes action |
| Arbitrator Marketplace | On-chain registry of arbitrators with reputation scores and dispute history |
| Native Milestones | Single contract with per-milestone states instead of N separate instances |
| TypeScript Migration | Full type safety across the frontend codebase |
| Mobile App | React Native wrapper for iOS and Android |

**Long-term**

TrustWork aims to become the standard escrow layer for the Stellar ecosystem — a composable primitive that any freelance platform, DAO, or protocol can integrate to add trustless payment guarantees to their workflows.

---

## Repository Structure

```
TrustWork26/
├── trustwork-ui/        React frontend (Vite + plain CSS)
├── democontract/        Soroban smart contract (Rust)
└── .github/workflows/   CI/CD pipeline (GitHub Actions → Vercel)
```

For full documentation including architecture, setup guide, and deployment instructions, see [`trustwork-ui/README.md`](trustwork-ui/README.md).

---

## Quick Start

```bash
git clone https://github.com/Vedang24-hash/TrustWork26.git
cd TrustWork26/trustwork-ui
npm install
npm run dev
```

Requires [Freighter wallet](https://www.freighter.app) on Stellar Testnet.

---

## License

MIT © 2026 TrustWork
