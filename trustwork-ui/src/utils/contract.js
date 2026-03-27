// ===== contract.js =====
// Simulates Soroban smart contract interactions
// Replace these with actual Stellar/Soroban SDK calls

export const CONTRACT_STATES = {
  ACTIVE: 'ACTIVE',
  SUBMITTED: 'SUBMITTED',
  COMPLETED: 'COMPLETED',
  DISPUTED: 'DISPUTED',
  REFUNDED: 'REFUNDED',
}

export const MOCK_WALLET = 'GBXYZ...DEMO'

// Truncate a Stellar address for display
export function truncateAddr(addr = '') {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// Format XLM amount
export function formatXLM(amount) {
  return `${Number(amount).toLocaleString()} XLM`
}

// Format a date string
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// Days remaining until deadline
export function daysRemaining(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Generate a mock contract ID
export function generateId() {
  return 'TW-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

// ---- Simulated contract actions ----
// In production these call the Soroban contract via Stellar SDK

export async function createContract(data) {
  await delay(800)
  return { ...data, id: generateId(), status: CONTRACT_STATES.ACTIVE, createdAt: new Date().toISOString() }
}

export async function submitWork(contractId, submissionNote) {
  await delay(600)
  return { status: CONTRACT_STATES.SUBMITTED, submittedAt: new Date().toISOString(), submissionNote }
}

export async function approveWork(contractId) {
  await delay(600)
  return { status: CONTRACT_STATES.COMPLETED, completedAt: new Date().toISOString() }
}

export async function raiseDispute(contractId, reason) {
  await delay(600)
  return { status: CONTRACT_STATES.DISPUTED, disputeReason: reason, disputedAt: new Date().toISOString() }
}

export async function resolveDispute(contractId, resolution) {
  // resolution: 'freelancer' | 'client' | 'split'
  await delay(800)
  const status = resolution === 'client' ? CONTRACT_STATES.REFUNDED : CONTRACT_STATES.COMPLETED
  return { status, resolution, resolvedAt: new Date().toISOString() }
}

export async function claimPayment(contractId) {
  await delay(600)
  return { status: CONTRACT_STATES.COMPLETED, claimedAt: new Date().toISOString() }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Seed data for demo
export const SEED_CONTRACTS = [
  {
    id: 'TW-A1B2C3',
    title: 'DeFi Dashboard UI',
    freelancer: 'GDFX4...7KPQ',
    client: MOCK_WALLET,
    amount: '2500',
    desc: 'Build a responsive DeFi dashboard with wallet integration, token swaps, and portfolio tracking.',
    deadline: '2026-04-15',
    reviewPeriod: '7',
    status: CONTRACT_STATES.SUBMITTED,
    createdAt: '2026-03-01T10:00:00Z',
    submittedAt: '2026-03-20T14:30:00Z',
    submissionNote: 'All features implemented. Live demo: https://demo.example.com',
  },
  {
    id: 'TW-D4E5F6',
    title: 'Smart Contract Audit',
    freelancer: 'GCBA9...2MNR',
    client: MOCK_WALLET,
    amount: '1800',
    desc: 'Full security audit of Soroban escrow contract including vulnerability assessment and report.',
    deadline: '2026-04-30',
    reviewPeriod: '5',
    status: CONTRACT_STATES.ACTIVE,
    createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: 'TW-G7H8I9',
    title: 'NFT Marketplace Backend',
    freelancer: 'GHKL3...9XYZ',
    client: MOCK_WALLET,
    amount: '4200',
    desc: 'REST API for NFT marketplace with minting, listing, bidding, and transaction history.',
    deadline: '2026-03-10',
    reviewPeriod: '7',
    status: CONTRACT_STATES.DISPUTED,
    createdAt: '2026-02-01T08:00:00Z',
    submittedAt: '2026-03-08T11:00:00Z',
    disputeReason: 'Delivered work does not match agreed specifications.',
    disputedAt: '2026-03-12T16:00:00Z',
  },
  {
    id: 'TW-J1K2L3',
    title: 'Token Vesting Contract',
    freelancer: 'GMNP7...4QRS',
    client: MOCK_WALLET,
    amount: '3100',
    desc: 'Soroban smart contract for token vesting with cliff, linear release, and admin controls.',
    deadline: '2026-02-28',
    reviewPeriod: '5',
    status: CONTRACT_STATES.COMPLETED,
    createdAt: '2026-01-15T12:00:00Z',
    completedAt: '2026-02-25T10:00:00Z',
  },
]
