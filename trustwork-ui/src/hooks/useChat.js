// =============================================================================
// useChat.js — Per-contract chat state, persisted in localStorage
//
// Each contract gets its own isolated message store keyed by contract ID.
// Messages are stored as JSON in localStorage so they survive page refresh.
//
// Message shape:
//   { id, contractId, sender, senderRole, text, attachments, type, ts }
//
// Types:
//   'text'    — regular chat message
//   'system'  — contract state change event (auto-posted)
//   'submit'  — work submission notification
//
// Production upgrade path:
//   Replace localStorage read/write with a WebSocket or a service like
//   Supabase Realtime, Ably, or Pusher. The hook interface stays the same.
// =============================================================================

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = (contractId) => `tw_chat_${contractId}`

function loadMessages(contractId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(contractId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveMessages(contractId, messages) {
  try {
    localStorage.setItem(STORAGE_KEY(contractId), JSON.stringify(messages))
  } catch { /* storage full — silently ignore */ }
}

export function useChat(contractId) {
  const [messages, setMessages] = useState(() => loadMessages(contractId))

  // Sync to localStorage whenever messages change
  useEffect(() => {
    saveMessages(contractId, messages)
  }, [contractId, messages])

  // Reload if contractId changes (switching between contracts)
  useEffect(() => {
    setMessages(loadMessages(contractId))
  }, [contractId])

  const sendMessage = useCallback((sender, senderRole, text, attachments = []) => {
    if (!text.trim() && attachments.length === 0) return
    const msg = {
      id: Date.now() + Math.random(),
      contractId,
      sender,
      senderRole,   // 'client' | 'freelancer'
      text: text.trim(),
      attachments,  // [{ name, url, type }]
      type: 'text',
      ts: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
    return msg
  }, [contractId])

  // Post an automated system event (contract state change, submission, etc.)
  const postSystemEvent = useCallback((text, eventType = 'system') => {
    const msg = {
      id: Date.now() + Math.random(),
      contractId,
      sender: 'TrustWork',
      senderRole: 'system',
      text,
      attachments: [],
      type: eventType,
      ts: new Date().toISOString(),
    }
    setMessages(prev => [...prev, msg])
  }, [contractId])

  const clearChat = useCallback(() => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY(contractId))
  }, [contractId])

  return { messages, sendMessage, postSystemEvent, clearChat }
}

// Seed chat messages for demo contracts
export function seedChatIfEmpty(contractId, client, freelancer) {
  const key = STORAGE_KEY(contractId)
  if (localStorage.getItem(key)) return // already has messages

  const now = Date.now()
  const seed = [
    {
      id: now - 5000,
      contractId,
      sender: client,
      senderRole: 'client',
      text: 'Hey! I just deployed the escrow contract. Looking forward to working with you on this.',
      attachments: [],
      type: 'text',
      ts: new Date(now - 5000 * 60).toISOString(),
    },
    {
      id: now - 4000,
      contractId,
      sender: freelancer,
      senderRole: 'freelancer',
      text: 'Thanks! I reviewed the requirements. I\'ll start immediately and keep you updated here.',
      attachments: [],
      type: 'text',
      ts: new Date(now - 4000 * 60).toISOString(),
    },
    {
      id: now - 3000,
      contractId,
      sender: 'TrustWork',
      senderRole: 'system',
      text: '🔒 Contract funded. Escrow is active — funds are locked until work is approved.',
      attachments: [],
      type: 'system',
      ts: new Date(now - 3000 * 60).toISOString(),
    },
    {
      id: now - 2000,
      contractId,
      sender: freelancer,
      senderRole: 'freelancer',
      text: 'Quick question — should the dashboard support mobile view as well?',
      attachments: [],
      type: 'text',
      ts: new Date(now - 2000 * 60).toISOString(),
    },
    {
      id: now - 1000,
      contractId,
      sender: client,
      senderRole: 'client',
      text: 'Yes please, responsive design is important. Breakpoints at 768px and 1024px.',
      attachments: [],
      type: 'text',
      ts: new Date(now - 1000 * 60).toISOString(),
    },
  ]
  localStorage.setItem(key, JSON.stringify(seed))
}
