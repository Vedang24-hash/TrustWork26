import { useState } from 'react'
import ContractForm from '../components/ContractForm'
import {
  sorobanCreateEscrow, sorobanDeposit,
  getXlmSac, NETWORK, EXPLORER_BASE,
} from '../utils/stellar'
import {
  formatXLM, formatContractId, CONTRACT_STATES,
} from '../utils/contract'

export default function CreateContract({ onCreate, wallet, setPage, onConnect, openTx, txSubmitting, txSuccess, txError }) {
  const [loading, setLoading] = useState(false)
  const [deployed, setDeployed] = useState(null)

  async function handleCreate(formData) {
    if (!wallet) { onConnect(); return }
    setLoading(true)

    try {
      const deadlineUnix = Math.floor(new Date(formData.deadline).getTime() / 1000)
      const tokenAddress = formData.token === 'XLM' || formData.token === 'custom'
        ? (formData.customToken || getXlmSac())
        : getXlmSac()

      // Handle milestone mode — create N escrow instances
      const milestones = formData.enableMilestones && formData.milestones?.length > 1
        ? formData.milestones
        : [{ label: formData.title, pct: 100 }]

      const results = []

      for (const ms of milestones) {
        const msAmount = formData.enableMilestones
          ? String(Math.round((Number(formData.amount) * ms.pct) / 100))
          : formData.amount

        const msTitle = formData.enableMilestones
          ? `${formData.title} — ${ms.label}`
          : formData.title

        // Step 1: create_escrow — opens Freighter for signing
        openTx('Create Escrow', `Deploying "${msTitle}" on Stellar ${NETWORK.toUpperCase()}`)

        const { result: escrowId, txHash: createTxHash } = await sorobanCreateEscrow(wallet, {
          buyer:        wallet,
          seller:       formData.freelancer,
          arbitrator:   formData.enableArbitrator ? formData.arbitrator : null,
          amountXlm:    msAmount,
          tokenAddress,
          deadlineUnix,
          description:  msTitle.slice(0, 32).replace(/\s+/g, '_'),
        })

        txSubmitting()

        // Step 2: deposit — second Freighter popup to fund the escrow
        openTx('Fund Escrow', `Locking ${msAmount} XLM into the smart contract`)

        const { txHash: depositTxHash } = await sorobanDeposit(wallet, escrowId)

        txSuccess(depositTxHash)

        const contract = {
          id:           formatContractId(escrowId),
          escrowId:     Number(escrowId),
          title:        msTitle,
          client:       wallet,
          freelancer:   formData.freelancer,
          arbitrator:   formData.enableArbitrator ? formData.arbitrator : null,
          amount:       msAmount,
          token:        formData.token || 'XLM',
          tokenAddress,
          desc:         formData.desc,
          deadline:     formData.deadline,
          reviewPeriod: formData.reviewPeriod,
          refundPolicy: formData.refundPolicy,
          autoReleaseOnDeadline: formData.autoReleaseOnDeadline,
          splitOnDispute: formData.splitOnDispute,
          enableMilestones: formData.enableMilestones,
          milestoneLabel: ms.label,
          milestonePct:   ms.pct,
          isMilestone:    formData.enableMilestones,
          status:         CONTRACT_STATES.ACTIVE,
          createdAt:      new Date().toISOString(),
          fundedAt:       new Date().toISOString(),
          createTxHash,
          depositTxHash,
          network:        NETWORK,
        }

        results.push(contract)
        onCreate(contract)
      }

      setDeployed(results)
    } catch (err) {
      txError(err)
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (deployed) {
    const totalAmount = deployed.reduce((s, c) => s + Number(c.amount), 0)

    return (
      <div className="page-narrow">
        <div className="card" style={{ textAlign: 'center', padding: '40px 32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
          <h2 style={{ marginBottom: 8 }}>
            {deployed.length > 1 ? `${deployed.length} Contracts Deployed` : 'Contract Deployed'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
            Live on Stellar {NETWORK.toUpperCase()}. Funds are locked in the Soroban smart contract.
          </p>

          <div className="escrow-visual" style={{ marginBottom: 20 }}>
            <div className="escrow-amount">{formatXLM(totalAmount)}</div>
            <div className="escrow-label">Locked in Soroban Escrow</div>
            <div className="escrow-locked">🔒 {NETWORK.toUpperCase()} · Publicly Verifiable</div>
          </div>

          {deployed.map((c) => (
            <div key={c.id} className="card" style={{ marginBottom: 10, padding: 16, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem' }}>{c.title}</div>
                <span className="badge badge-active">ACTIVE</span>
              </div>
              <div className="detail-row" style={{ paddingTop: 0 }}>
                <span className="detail-row-label">Contract ID</span>
                <span className="detail-row-value mono">{c.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-row-label">Amount Locked</span>
                <span className="detail-row-value" style={{ color: 'var(--accent)' }}>{formatXLM(c.amount)}</span>
              </div>
              {c.depositTxHash && (
                <div className="detail-row">
                  <span className="detail-row-label">Tx Hash</span>
                  <a
                    href={`${EXPLORER_BASE}/tx/${c.depositTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'monospace' }}
                  >
                    {c.depositTxHash.slice(0, 16)}... ↗
                  </a>
                </div>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setPage('dashboard')}>Go to Dashboard</button>
            <button className="btn btn-secondary" onClick={() => setDeployed(null)}>Create Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-narrow">
      <div className="mb-32">
        <button className="btn btn-secondary btn-sm mb-16" onClick={() => setPage('dashboard')}>← Back</button>
        <h2 className="page-title">Contract Builder</h2>
        <p className="page-subtitle">Deploy a Soroban escrow contract on Stellar {NETWORK.toUpperCase()}</p>
      </div>

      {!wallet && (
        <div className="alert alert-warning mb-24" style={{ cursor: 'pointer' }} onClick={onConnect}>
          ⚠️ Connect your wallet to deploy. <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Click to connect →</span>
        </div>
      )}

      <div className="card">
        <ContractForm onSubmit={handleCreate} loading={loading} wallet={wallet} />
      </div>
    </div>
  )
}
