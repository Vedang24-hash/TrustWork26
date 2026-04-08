// =============================================================================
// contract.js — On-chain contract state management
//
// All simulated data and hardcoded contracts are removed.
// Contracts are stored in localStorage keyed by wallet address so each
// user sees only their own contracts across sessions.
//
// On-chain execution is handled by stellar.js.
// This file manages the local state layer that mirrors on-chain state.
// =============================================================================

// ── Contract lifecycle states (mirrors Rust EscrowState enum) ─────────────────
export const CONTRACT_STATES = {
  AWAITING_DEPOSIT: 'AWAITING_DEPOSIT',
  ACTIVE:     'ACTIVE',
  SUBMITTED:  'SUBMITTED',
  COMPLETED:  'COMPLETED',
  DISPUTED:   'DISPUTED',
  REFUNDED:   'REFUNDED',
}

// ── Formatting helpers ────────────────────────────────────────────────────────
export function truncateAddr(addr = '') {
  if (!addr || addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatXLM(amount) {
  const n = Number(amount)
  if (isNaN(n)) return '0 XLM'
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function daysRemaining(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ── localStorage persistence ──────────────────────────────────────────────────
// Contracts are stored per wallet address so each user has their own list.
// Key: tw_contracts_<walletAddress>

const CONTRACTS_KEY = (wallet) => `tw_contracts_${wallet}`

export function loadContracts(wallet) {
  if (!wallet) return []
  try {
    const raw = localStorage.getItem(CONTRACTS_KEY(wallet))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveContracts(wallet, contracts) {
  if (!wallet) return
  try {
    localStorage.setItem(CONTRACTS_KEY(wallet), JSON.stringify(contracts))
  } catch { /* storage full */ }
}

export function addContract(wallet, contract) {
  const existing = loadContracts(wallet)
  // Also index by freelancer so freelancer can find their contracts
  const updated = [contract, ...existing.filter(c => c.id !== contract.id)]
  saveContracts(wallet, updated)
  // If freelancer is different, also save under freelancer's key
  if (contract.freelancer && contract.freelancer !== wallet) {
    const freelancerContracts = loadContracts(contract.freelancer)
    const updatedFreelancer = [contract, ...freelancerContracts.filter(c => c.id !== contract.id)]
    saveContracts(contract.freelancer, updatedFreelancer)
  }
}

export function updateContract(wallet, updated) {
  const existing = loadContracts(wallet)
  const contracts = existing.map(c => c.id === updated.id ? updated : c)
  saveContracts(wallet, contracts)
  // Sync to freelancer's storage too
  if (updated.freelancer && updated.freelancer !== wallet) {
    const fl = loadContracts(updated.freelancer)
    saveContracts(updated.freelancer, fl.map(c => c.id === updated.id ? updated : c))
  }
}

// ── Contract ID generation ────────────────────────────────────────────────────
// In production this comes from the Soroban contract's escrow_id (u64).
// We store it as "TW-<escrowId>" for display.
export function formatContractId(escrowId) {
  return `TW-${String(escrowId).padStart(6, '0')}`
}

// ── State transition helpers ──────────────────────────────────────────────────
// These update local state after a confirmed on-chain transaction.
// The txHash is stored for public verification.

export function applyDeposit(contract, txHash) {
  return {
    ...contract,
    status: CONTRACT_STATES.ACTIVE,
    depositTxHash: txHash,
    fundedAt: new Date().toISOString(),
  }
}

export function applySubmitWork(contract, txHash, note, deliverables, uploadedFiles) {
  return {
    ...contract,
    status: CONTRACT_STATES.SUBMITTED,
    submittedAt: new Date().toISOString(),
    submissionNote: note,
    deliverables,
    uploadedFiles,
    submitTxHash: txHash,
  }
}

export function applyApprove(contract, txHash) {
  return {
    ...contract,
    status: CONTRACT_STATES.COMPLETED,
    completedAt: new Date().toISOString(),
    approveTxHash: txHash,
  }
}

export function applyDispute(contract, txHash, reason) {
  return {
    ...contract,
    status: CONTRACT_STATES.DISPUTED,
    disputeReason: reason,
    disputedAt: new Date().toISOString(),
    disputeTxHash: txHash,
  }
}

export function applyResolve(contract, txHash, resolution) {
  const status = resolution === 'client' ? CONTRACT_STATES.REFUNDED : CONTRACT_STATES.COMPLETED
  return {
    ...contract,
    status,
    resolution,
    resolvedAt: new Date().toISOString(),
    resolveTxHash: txHash,
  }
}

export function applyClaim(contract, txHash) {
  return {
    ...contract,
    status: CONTRACT_STATES.COMPLETED,
    claimedAt: new Date().toISOString(),
    claimTxHash: txHash,
  }
}

export function applyRefund(contract, txHash) {
  return {
    ...contract,
    status: CONTRACT_STATES.REFUNDED,
    refundedAt: new Date().toISOString(),
    refundTxHash: txHash,
  }
}
