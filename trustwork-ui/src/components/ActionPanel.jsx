import { useState } from 'react'
import { CONTRACT_STATES, daysRemaining, formatXLM } from '../utils/contract'
import FileUploader from './FileUploader'

// ── Deliverable types the freelancer can attach ───────────────────────────────
const DELIVERABLE_TYPES = [
  { value: 'link',   label: '🔗 Live URL',        placeholder: 'https://your-project.vercel.app' },
  { value: 'repo',   label: '📦 Repository',       placeholder: 'https://github.com/user/repo' },
  { value: 'doc',    label: '📄 Document / Drive', placeholder: 'https://docs.google.com/...' },
  { value: 'figma',  label: '🎨 Figma / Design',   placeholder: 'https://figma.com/file/...' },
  { value: 'video',  label: '🎥 Demo Video',        placeholder: 'https://loom.com/share/...' },
  { value: 'ipfs',   label: '🌐 IPFS / Arweave',   placeholder: 'ipfs://Qm... or ar://...' },
  { value: 'other',  label: '📎 Other',             placeholder: 'Any URL or reference' },
]

export default function ActionPanel({ contract, wallet, onAction }) {
  const [note, setNote]                   = useState('')
  const [deliverables, setDeliverables]   = useState([{ type: 'link', url: '', label: '' }])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [disputeReason, setDisputeReason] = useState('')
  const [loading, setLoading]             = useState(null)

  const isClient     = contract.client === wallet
  const isFreelancer = contract.freelancer === wallet
  const days         = daysRemaining(contract.deadline)
  const reviewExpired = days !== null && days < -(Number(contract.reviewPeriod) || 7)

  async function handle(action, payload) {
    setLoading(action)
    await onAction(action, payload)
    setLoading(null)
    setNote('')
    setDeliverables([{ type: 'link', url: '', label: '' }])
    setUploadedFiles([])
    setDisputeReason('')
  }

  // ── Deliverable helpers ────────────────────────────────────────────────────
  function addDeliverable() {
    setDeliverables(d => [...d, { type: 'link', url: '', label: '' }])
  }
  function removeDeliverable(i) {
    setDeliverables(d => d.filter((_, idx) => idx !== i))
  }
  function setDeliverable(i, field, value) {
    setDeliverables(d => d.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const validDeliverables = deliverables.filter(d => d.url.trim())

  // ── Terminal states ────────────────────────────────────────────────────────
  if (contract.status === CONTRACT_STATES.COMPLETED) {
    return (
      <div className="action-card">
        <div className="alert alert-success" style={{ marginBottom: 0 }}>
          ✅ Contract completed. {formatXLM(contract.amount)} released to the freelancer.
        </div>
      </div>
    )
  }

  if (contract.status === CONTRACT_STATES.REFUNDED) {
    return (
      <div className="action-card">
        <div className="alert alert-info" style={{ marginBottom: 0 }}>
          ↩️ Contract refunded. Funds returned to the client.
        </div>
      </div>
    )
  }

  return (
    <div className="action-panel">

      {/* ── FREELANCER: Submit Work ─────────────────────────────────────────── */}
      {isFreelancer && contract.status === CONTRACT_STATES.ACTIVE && (
        <div className="action-card">
          <div className="action-card-title">📤 Submit Work</div>
          <div className="action-card-desc">
            Attach your deliverables and a summary note. The client has{' '}
            <strong style={{ color: 'var(--text-heading)' }}>{contract.reviewPeriod || 7} days</strong> to review.
          </div>

          {/* ── File Upload ── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Upload Files
            </div>
            <FileUploader files={uploadedFiles} onChange={setUploadedFiles} />
          </div>

          {/* ── URL Deliverables ── */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Links & References
            </div>

            {deliverables.map((d, i) => {
              const typeMeta = DELIVERABLE_TYPES.find(t => t.value === d.type)
              return (
                <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12, marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select
                      className="form-select"
                      value={d.type}
                      onChange={e => setDeliverable(i, 'type', e.target.value)}
                      style={{ flex: '0 0 160px', fontSize: '0.8rem' }}
                    >
                      {DELIVERABLE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {deliverables.length > 1 && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeDeliverable(i)}>✕</button>
                    )}
                  </div>
                  <input
                    className="form-input"
                    placeholder={typeMeta?.placeholder || 'URL or reference'}
                    value={d.url}
                    onChange={e => setDeliverable(i, 'url', e.target.value)}
                    style={{ marginBottom: 6, fontSize: '0.82rem' }}
                  />
                  <input
                    className="form-input"
                    placeholder="Short label (optional) — e.g. 'Live Demo'"
                    value={d.label}
                    onChange={e => setDeliverable(i, 'label', e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              )
            })}

            <button className="btn btn-secondary btn-sm" onClick={addDeliverable} style={{ marginTop: 4 }}>
              + Add Link
            </button>
          </div>

          {/* Summary note */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Summary Note
          </div>
          <textarea
            className="form-textarea"
            placeholder="Describe what you built, setup instructions, or notes for the client..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            style={{ marginBottom: 14 }}
          />

          <button
            className="btn btn-primary btn-full"
            onClick={() => handle('submit', {
              note,
              deliverables: validDeliverables,
              uploadedFiles,
            })}
            disabled={loading === 'submit' || (!note.trim() && validDeliverables.length === 0 && uploadedFiles.length === 0)}
          >
            {loading === 'submit' ? '⏳ Submitting to Stellar...' : `📤 Submit Work${uploadedFiles.length > 0 ? ` (${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''})` : ''}`}
          </button>
        </div>
      )}

      {/* ── CLIENT: Review submitted work ──────────────────────────────────── */}
      {isClient && contract.status === CONTRACT_STATES.SUBMITTED && (
        <>
          <div className="action-card">
            <div className="action-card-title">✅ Approve & Release Payment</div>
            <div className="action-card-desc">
              Satisfied with the deliverables? Approving releases{' '}
              <strong style={{ color: 'var(--accent)' }}>{formatXLM(contract.amount)}</strong> to the freelancer instantly via the smart contract.
            </div>
            <button
              className="btn btn-success btn-full"
              onClick={() => handle('approve', {})}
              disabled={loading === 'approve'}
            >
              {loading === 'approve' ? '⏳ Processing on Stellar...' : '✅ Approve & Release Payment'}
            </button>
          </div>

          <div className="action-card">
            <div className="action-card-title">⚠️ Raise Dispute</div>
            <div className="action-card-desc">
              Work doesn't meet the agreed requirements? Raise a dispute — an arbitrator will review and decide.
            </div>
            <textarea
              className="form-textarea"
              placeholder="Be specific: what was agreed vs what was delivered..."
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

      {/* ── FREELANCER: Auto-claim after review period ─────────────────────── */}
      {isFreelancer && contract.status === CONTRACT_STATES.SUBMITTED && reviewExpired && (
        <div className="action-card">
          <div className="action-card-title">💰 Claim Payment</div>
          <div className="action-card-desc">
            The review period expired with no response from the client. You can now claim your payment directly from the smart contract.
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

      {/* ── Waiting states ─────────────────────────────────────────────────── */}
      {contract.status === CONTRACT_STATES.DISPUTED && (
        <div className="action-card">
          <div className="alert alert-warning" style={{ marginBottom: 0 }}>
            ⚖️ Under arbitration. An arbitrator will review and decide the outcome.
          </div>
        </div>
      )}
      {isFreelancer && contract.status === CONTRACT_STATES.SUBMITTED && !reviewExpired && (
        <div className="action-card">
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            ⏳ Work submitted. Awaiting client review. Auto-claim unlocks after the review period.
          </div>
        </div>
      )}
      {isClient && contract.status === CONTRACT_STATES.ACTIVE && (
        <div className="action-card">
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            ⏳ Waiting for the freelancer to submit their work.
          </div>
        </div>
      )}

      {/* ── Not a party ────────────────────────────────────────────────────── */}
      {!isClient && !isFreelancer && (
        <div className="action-card">
          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            👁️ You are viewing this contract as a third party. Connect the client or freelancer wallet to take actions.
          </div>
        </div>
      )}
    </div>
  )
}
