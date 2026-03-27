import ActionPanel from '../components/ActionPanel'
import {
  truncateAddr, formatXLM, formatDate, daysRemaining,
  submitWork, approveWork, raiseDispute, claimPayment,
  CONTRACT_STATES,
} from '../utils/contract'

const STATUS_STEPS = [CONTRACT_STATES.ACTIVE, CONTRACT_STATES.SUBMITTED, CONTRACT_STATES.COMPLETED]

export default function ContractDetail({ contract, wallet, onUpdate, setPage }) {
  if (!contract) return null

  const days = daysRemaining(contract.deadline)
  const isOverdue = days !== null && days < 0

  const stepIndex = STATUS_STEPS.indexOf(contract.status)

  async function handleAction(action, payload) {
    let update = {}
    if (action === 'submit') update = await submitWork(contract.id, payload.note)
    else if (action === 'approve') update = await approveWork(contract.id)
    else if (action === 'dispute') update = await raiseDispute(contract.id, payload.reason)
    else if (action === 'claim') update = await claimPayment(contract.id)
    onUpdate({ ...contract, ...update })
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="detail-header">
        <div>
          <button className="btn btn-secondary btn-sm mb-16" onClick={() => setPage('dashboard')}>
            ← Back
          </button>
          <h2 className="page-title">{contract.title || 'Contract Detail'}</h2>
          <p className="text-muted">{contract.id}</p>
        </div>
        <span className={`badge badge-${contract.status.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
          {contract.status}
        </span>
      </div>

      {/* Progress Steps */}
      {contract.status !== CONTRACT_STATES.DISPUTED && contract.status !== CONTRACT_STATES.REFUNDED && (
        <div className="steps mb-32">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className={`step ${i < stepIndex ? 'done' : i === stepIndex ? 'current' : ''}`}>
              <div className="step-circle">{i < stepIndex ? '✓' : i + 1}</div>
              <div className="step-label">{s.charAt(0) + s.slice(1).toLowerCase()}</div>
            </div>
          ))}
        </div>
      )}

      {contract.status === CONTRACT_STATES.DISPUTED && (
        <div className="alert alert-danger mb-24">
          ⚖️ Dispute raised on {formatDate(contract.disputedAt)} — "{contract.disputeReason}"
        </div>
      )}

      <div className="detail-grid">
        {/* Left: Info */}
        <div>
          {/* Escrow Amount */}
          <div className="escrow-visual mb-24">
            <div className="escrow-amount">{formatXLM(contract.amount)}</div>
            <div className="escrow-label">Locked in Escrow</div>
            <div className="escrow-locked">🔒 Soroban Smart Contract · Stellar Network</div>
          </div>

          {/* Contract Info */}
          <div className="card mb-24">
            <div className="detail-section-title">Contract Details</div>
            <div className="detail-row">
              <span className="detail-row-label">Client</span>
              <span className="detail-row-value mono">{truncateAddr(contract.client)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Freelancer</span>
              <span className="detail-row-value mono">{truncateAddr(contract.freelancer)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Deadline</span>
              <span className="detail-row-value" style={{ color: isOverdue ? 'var(--red)' : 'inherit' }}>
                {formatDate(contract.deadline)}
                {days !== null && (
                  <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ({isOverdue ? `${Math.abs(days)}d overdue` : `${days}d left`})
                  </span>
                )}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Review Period</span>
              <span className="detail-row-value">{contract.reviewPeriod || 7} days</span>
            </div>
            <div className="detail-row">
              <span className="detail-row-label">Created</span>
              <span className="detail-row-value">{formatDate(contract.createdAt)}</span>
            </div>
            {contract.submittedAt && (
              <div className="detail-row">
                <span className="detail-row-label">Submitted</span>
                <span className="detail-row-value">{formatDate(contract.submittedAt)}</span>
              </div>
            )}
            {contract.completedAt && (
              <div className="detail-row">
                <span className="detail-row-label">Completed</span>
                <span className="detail-row-value" style={{ color: 'var(--green)' }}>{formatDate(contract.completedAt)}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card mb-24">
            <div className="detail-section-title">Project Description</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text)' }}>{contract.desc}</p>
          </div>

          {/* Submission Note */}
          {contract.submissionNote && (
            <div className="card">
              <div className="detail-section-title">Freelancer Submission Note</div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text)' }}>{contract.submissionNote}</p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div>
          <div className="detail-section-title mb-16">Actions</div>
          <ActionPanel
            contract={contract}
            wallet={wallet}
            onAction={handleAction}
          />
        </div>
      </div>
    </div>
  )
}
