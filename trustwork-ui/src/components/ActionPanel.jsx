import { useState } from 'react'
import { CONTRACT_STATES, daysRemaining } from '../utils/contract'

export default function ActionPanel({ contract, wallet, onAction }) {
  const [note, setNote] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [loading, setLoading] = useState(null)

  const isClient = contract.client === wallet
  const isFreelancer = contract.freelancer === wallet
  const days = daysRemaining(contract.deadline)
  const reviewExpired = days !== null && days < -(contract.reviewPeriod || 7)

  async function handle(action, payload) {
    setLoading(action)
    await onAction(action, payload)
    setLoading(null)
    setNote('')
    setDisputeReason('')
  }

  if (contract.status === CONTRACT_STATES.COMPLETED) {
    return (
      <div className="action-card">
        <div className="alert alert-success">
          ✅ Contract completed. Payment of {contract.amount} XLM has been released to the freelancer.
        </div>
      </div>
    )
  }

  if (contract.status === CONTRACT_STATES.REFUNDED) {
    return (
      <div className="action-card">
        <div className="alert alert-info">
          ↩️ Contract refunded. Funds have been returned to the client.
        </div>
      </div>
    )
  }

  return (
    <div className="action-panel">
      {/* FREELANCER: Submit Work */}
      {isFreelancer && contract.status === CONTRACT_STATES.ACTIVE && (
        <div className="action-card">
          <div className="action-card-title">📤 Submit Work</div>
          <div className="action-card-desc">
            Once submitted, the client has {contract.reviewPeriod || 7} days to review and approve.
          </div>
          <textarea
            className="form-textarea"
            placeholder="Add a note or link to your deliverables..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            style={{ marginBottom: 12 }}
          />
          <button
            className="btn btn-primary btn-full"
            onClick={() => handle('submit', { note })}
            disabled={loading === 'submit'}
          >
            {loading === 'submit' ? '⏳ Submitting...' : '📤 Submit Work'}
          </button>
        </div>
      )}

      {/* CLIENT: Approve or Dispute */}
      {isClient && contract.status === CONTRACT_STATES.SUBMITTED && (
        <>
          <div className="action-card">
            <div className="action-card-title">✅ Approve & Release Payment</div>
            <div className="action-card-desc">
              Confirm the work meets requirements. This releases {contract.amount} XLM to the freelancer immediately.
            </div>
            <button
              className="btn btn-success btn-full"
              onClick={() => handle('approve', {})}
              disabled={loading === 'approve'}
            >
              {loading === 'approve' ? '⏳ Processing...' : '✅ Approve Work'}
            </button>
          </div>

          <div className="action-card">
            <div className="action-card-title">⚠️ Raise Dispute</div>
            <div className="action-card-desc">
              If the work doesn't meet the agreed requirements, raise a dispute for arbitration.
            </div>
            <textarea
              className="form-textarea"
              placeholder="Describe the issue clearly..."
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
              rows={3}
              style={{ marginBottom: 12 }}
            />
            <button
              className="btn btn-danger btn-full"
              onClick={() => handle('dispute', { reason: disputeReason })}
              disabled={loading === 'dispute' || !disputeReason.trim()}
            >
              {loading === 'dispute' ? '⏳ Raising...' : '⚠️ Raise Dispute'}
            </button>
          </div>
        </>
      )}

      {/* FREELANCER: Auto-claim after review period */}
      {isFreelancer && contract.status === CONTRACT_STATES.SUBMITTED && reviewExpired && (
        <div className="action-card">
          <div className="action-card-title">💰 Claim Payment</div>
          <div className="action-card-desc">
            The review period has expired with no response from the client. You can now claim your payment.
          </div>
          <button
            className="btn btn-primary btn-full"
            onClick={() => handle('claim', {})}
            disabled={loading === 'claim'}
          >
            {loading === 'claim' ? '⏳ Claiming...' : '💰 Claim Payment'}
          </button>
        </div>
      )}

      {/* DISPUTED */}
      {contract.status === CONTRACT_STATES.DISPUTED && (
        <div className="action-card">
          <div className="alert alert-warning" style={{ marginBottom: 0 }}>
            ⚖️ This contract is under arbitration. An arbitrator will review the dispute and decide the outcome.
          </div>
        </div>
      )}

      {/* Waiting state for freelancer when submitted */}
      {isFreelancer && contract.status === CONTRACT_STATES.SUBMITTED && !reviewExpired && (
        <div className="action-card">
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            ⏳ Work submitted. Waiting for client review. You can claim payment after the review period expires.
          </div>
        </div>
      )}

      {/* Waiting state for client when active */}
      {isClient && contract.status === CONTRACT_STATES.ACTIVE && (
        <div className="action-card">
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            ⏳ Waiting for the freelancer to submit their work.
          </div>
        </div>
      )}
    </div>
  )
}
