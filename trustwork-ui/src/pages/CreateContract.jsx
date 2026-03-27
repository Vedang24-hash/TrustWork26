import { useState } from 'react'
import ContractForm from '../components/ContractForm'
import { createContract } from '../utils/contract'

export default function CreateContract({ onCreate, wallet, setPage }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(null)

  async function handleCreate(formData) {
    if (!wallet) return
    setLoading(true)
    const contract = await createContract({ ...formData, client: wallet })
    setLoading(false)
    setDone(contract)
    onCreate(contract)
  }

  if (done) {
    return (
      <div className="page-narrow">
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ marginBottom: 8 }}>Contract Created</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            Your escrow contract is live on Stellar. Funds are locked and waiting.
          </p>
          <div className="card" style={{ textAlign: 'left', marginBottom: 24 }}>
            <div className="detail-row">
              <span className="detail-row-label">Contract ID</span>
              <span className="detail-row-value mono">{done.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Amount Locked</span>
              <span className="detail-row-value" style={{ color: 'var(--accent)' }}>{done.amount} XLM</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Status</span>
              <span className={`badge badge-active`}>ACTIVE</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => setPage('dashboard')}>
              Go to Dashboard
            </button>
            <button className="btn btn-secondary" onClick={() => { setDone(null) }}>
              Create Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-narrow">
      <div className="mb-32">
        <button className="btn btn-secondary btn-sm mb-16" onClick={() => setPage('dashboard')}>
          ← Back
        </button>
        <h2 className="page-title">Create Escrow Contract</h2>
        <p className="page-subtitle">Define the terms and lock funds before work begins</p>
      </div>

      {!wallet && (
        <div className="alert alert-warning mb-24">
          ⚠️ Connect your wallet to create a contract.
        </div>
      )}

      <div className="card">
        <ContractForm onSubmit={handleCreate} loading={loading} />
      </div>
    </div>
  )
}
