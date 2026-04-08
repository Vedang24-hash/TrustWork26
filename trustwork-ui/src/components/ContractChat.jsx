// =============================================================================
// ContractChat.jsx — Per-contract private chat room
//
// Features:
//  - Private to client + freelancer (identified by wallet address)
//  - Invite link generation (share with freelancer to join)
//  - Text messages with timestamps
//  - File/image attachments (drag-drop or click)
//  - System event messages (contract state changes)
//  - Work submission directly from chat
//  - Unread badge
//  - Messages persist in localStorage
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat, seedChatIfEmpty } from '../hooks/useChat'
import { truncateAddr, formatDate, CONTRACT_STATES } from '../utils/contract'

const ACCEPTED_ATTACH = '.pdf,.zip,.png,.jpg,.jpeg,.gif,.mp4,.txt,.md,.json,.docx,.svg'

function formatTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getInitial(addr = '') {
  return addr.slice(0, 1).toUpperCase() || '?'
}

function avatarColor(addr = '') {
  const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4']
  let hash = 0
  for (let i = 0; i < addr.length; i++) hash = addr.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ContractChat({ contract, wallet, onSubmitWork }) {
  const { messages, sendMessage, postSystemEvent } = useChat(contract.id)
  const [text, setText]           = useState('')
  const [attachments, setAttachments] = useState([])
  const [dragging, setDragging]   = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const bottomRef  = useRef(null)
  const fileRef    = useRef(null)
  const inputRef   = useRef(null)

  const isClient     = contract.client === wallet
  const isFreelancer = contract.freelancer === wallet
  const isMember     = isClient || isFreelancer

  // Determine sender role
  const senderRole = isClient ? 'client' : isFreelancer ? 'freelancer' : 'observer'

  // Seed demo messages for existing seed contracts
  useEffect(() => {
    if (contract.client && contract.freelancer) {
      seedChatIfEmpty(contract.id, contract.client, contract.freelancer)
    }
  }, [contract.id])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Invite link — encodes contract ID in URL hash, opens directly to chat
  const inviteLink = `${window.location.origin}${window.location.pathname}#chat/${contract.id}`

  function copyInvite() {
    navigator.clipboard?.writeText(inviteLink)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2500)
  }

  // ── Send message ───────────────────────────────────────────────────────────
  function handleSend() {
    if (!text.trim() && attachments.length === 0) return
    sendMessage(wallet, senderRole, text, attachments)
    setText('')
    setAttachments([])
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── File attachment ────────────────────────────────────────────────────────
  function processFiles(files) {
    const newAttachments = Array.from(files).map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }))
    setAttachments(a => [...a, ...newAttachments])
  }

  function handleFileDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFiles(e.dataTransfer.files)
  }

  // ── Submit work from chat ──────────────────────────────────────────────────
  function handleSubmitFromChat() {
    postSystemEvent('📤 Work submitted via chat. Awaiting client review.')
    onSubmitWork?.({ note: text || 'Work submitted via chat.', deliverables: [], uploadedFiles: [] })
    setText('')
  }

  // ── Group messages by date ─────────────────────────────────────────────────
  const grouped = messages.reduce((acc, msg) => {
    const day = new Date(msg.ts).toDateString()
    if (!acc[day]) acc[day] = []
    acc[day].push(msg)
    return acc
  }, {})

  // ── Not a member view ──────────────────────────────────────────────────────
  if (!isMember) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔒</div>
          <h3 style={{ color: 'var(--text-heading)', marginBottom: 8 }}>Private Chat Room</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24, lineHeight: 1.7 }}>
            This chat is private to the client and freelancer of contract <strong>{contract.id}</strong>.
            Connect the correct wallet to join.
          </p>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Client: {truncateAddr(contract.client)}<br />
            Freelancer: {truncateAddr(contract.freelancer)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>

      {/* ── Chat header ─────────────────────────────────────────────────────── */}
      <div className="card mb-16" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--bg-card)', boxShadow: '0 0 6px var(--green)' }} />
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                💬
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.9rem' }}>
                {contract.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Private · {truncateAddr(contract.client)} & {truncateAddr(contract.freelancer)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Invite button — client shares link with freelancer */}
            {isClient && (
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowInvite(s => !s)}
                >
                  🔗 Invite Freelancer
                </button>
                {showInvite && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: 16, width: 320,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 50,
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '0.875rem', marginBottom: 6 }}>
                      Share with Freelancer
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                      Send this link to your freelancer. They'll join this private chat room when they open it with their wallet connected.
                    </p>
                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text)', wordBreak: 'break-all', marginBottom: 10 }}>
                      {inviteLink}
                    </div>
                    <button className="btn btn-primary btn-full btn-sm" onClick={copyInvite}>
                      {inviteCopied ? '✅ Copied!' : '📋 Copy Link'}
                    </button>
                  </div>
                )}
              </div>
            )}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 10, border: '1px solid var(--border)' }}>
              {isClient ? '👤 Client' : '💼 Freelancer'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Message list ────────────────────────────────────────────────────── */}
      <div
        style={{
          height: 460, overflowY: 'auto',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: 0,
          marginBottom: 12,
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleFileDrop}
      >
        {dragging && (
          <div style={{
            position: 'absolute', inset: 0, background: 'var(--accent-glow)',
            border: '2px dashed var(--accent)', borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: 'var(--accent)', fontWeight: 600, zIndex: 10,
          }}>
            Drop files to attach
          </div>
        )}

        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>Start the conversation</div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
              This is your private workspace for <strong>{contract.title}</strong>.<br />
              Discuss requirements, share updates, and submit work here.
            </div>
          </div>
        )}

        {Object.entries(grouped).map(([day, dayMsgs]) => (
          <div key={day}>
            {/* Date separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(day).toDateString() === new Date().toDateString() ? 'Today' : day}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {dayMsgs.map((msg, i) => {
              const isMe = msg.sender === wallet
              const isSystem = msg.type === 'system' || msg.senderRole === 'system'
              const prevMsg = dayMsgs[i - 1]
              const showAvatar = !prevMsg || prevMsg.sender !== msg.sender

              if (isSystem) {
                return (
                  <div key={msg.id} style={{ textAlign: 'center', margin: '8px 0' }}>
                    <span style={{
                      display: 'inline-block', fontSize: '0.75rem', color: 'var(--text-muted)',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 20, padding: '4px 12px',
                    }}>
                      {msg.text}
                    </span>
                  </div>
                )
              }

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                    marginBottom: 4,
                    marginTop: showAvatar ? 10 : 2,
                  }}
                >
                  {/* Avatar */}
                  {showAvatar ? (
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: avatarColor(msg.sender),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                    }}>
                      {getInitial(msg.sender)}
                    </div>
                  ) : (
                    <div style={{ width: 30, flexShrink: 0 }} />
                  )}

                  {/* Bubble */}
                  <div style={{ maxWidth: '70%' }}>
                    {showAvatar && (
                      <div style={{
                        fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3,
                        textAlign: isMe ? 'right' : 'left',
                      }}>
                        {isMe ? 'You' : truncateAddr(msg.sender)}
                        <span style={{ marginLeft: 6, opacity: 0.6 }}>
                          {msg.senderRole === 'client' ? '(Client)' : '(Freelancer)'}
                        </span>
                      </div>
                    )}
                    <div style={{
                      background: isMe ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: isMe ? '#fff' : 'var(--text-heading)',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      border: isMe ? 'none' : '1px solid var(--border)',
                      wordBreak: 'break-word',
                    }}>
                      {msg.text && <div>{msg.text}</div>}

                      {/* Attachments */}
                      {msg.attachments?.map((a, ai) => (
                        <a
                          key={ai}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
                            background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--bg-card)',
                            borderRadius: 8, padding: '6px 10px', textDecoration: 'none',
                            color: isMe ? '#fff' : 'var(--text-heading)',
                          }}
                        >
                          <span>📎</span>
                          <span style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.name}
                          </span>
                        </a>
                      ))}
                    </div>
                    <div style={{
                      fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 3,
                      textAlign: isMe ? 'right' : 'left',
                    }}>
                      {formatTime(msg.ts)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Attachment preview ───────────────────────────────────────────────── */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {attachments.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '5px 10px', fontSize: '0.78rem',
            }}>
              <span>📎</span>
              <span style={{ color: 'var(--text-heading)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
              <button
                onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', padding: 0 }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Input bar ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '10px 12px',
      }}>
        {/* Attach file */}
        <button
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px 10px', flexShrink: 0 }}
          onClick={() => fileRef.current?.click()}
          title="Attach file"
        >
          📎
        </button>
        <input ref={fileRef} type="file" multiple accept={ACCEPTED_ATTACH} style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />

        {/* Text input */}
        <textarea
          ref={inputRef}
          className="form-textarea"
          placeholder={`Message ${isClient ? 'freelancer' : 'client'}... (Enter to send, Shift+Enter for new line)`}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            flex: 1, resize: 'none', minHeight: 38, maxHeight: 120,
            border: 'none', background: 'transparent', padding: '6px 4px',
            fontSize: '0.875rem',
          }}
        />

        {/* Submit work button — only for freelancer when contract is ACTIVE */}
        {isFreelancer && contract.status === CONTRACT_STATES.ACTIVE && (
          <button
            className="btn btn-warning btn-sm"
            style={{ flexShrink: 0, padding: '8px 12px' }}
            onClick={handleSubmitFromChat}
            title="Submit work"
          >
            📤 Submit
          </button>
        )}

        {/* Send */}
        <button
          className="btn btn-primary btn-sm"
          style={{ flexShrink: 0, padding: '8px 14px' }}
          onClick={handleSend}
          disabled={!text.trim() && attachments.length === 0}
        >
          Send ↑
        </button>
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
        🔒 Private to {truncateAddr(contract.client)} & {truncateAddr(contract.freelancer)} · Messages stored locally
      </div>
    </div>
  )
}
