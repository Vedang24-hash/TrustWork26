import { useState } from 'react'
import ContractCard from '../components/ContractCard'
import { CONTRACT_STATES } from '../utils/contract'

const TABS = ['All', 'Active', 'Submitted', 'Completed', 'Disputed']

export default function Dashboard({ contracts, onView, setPage }) {
  const [tab, setTab] = useState('All')

  const filtered = tab === 'All'
    ? contracts
    : contracts.filter(c => c.status === tab.toUpperCase())

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === CONTRACT_STATES.ACTIVE).length,
    completed: contracts.filter(c => c.status === CONTRACT_STATES.COMPLETED).length,
    volume: contracts.reduce((sum, c) => sum + Number(c.amount || 0), 0),
  }

  return (
    <div className="page">
      <div className="flex-between mb-32">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Manage your escrow contracts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setPage('create')}>
          + New Contract
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Contracts</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Volume</div>
          <div className="stat-value">{stats.volume.toLocaleString()}</div>
          <div className="stat-sub">XLM in escrow</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t !== 'All' && (
              <span style={{ marginLeft: 6, opacity: 0.6, fontSize: '0.75rem' }}>
                {contracts.filter(c => c.status === t.toUpperCase()).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contract Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No contracts yet</div>
          <div className="empty-desc">
            {tab === 'All'
              ? 'Create your first escrow contract to get started.'
              : `No ${tab.toLowerCase()} contracts found.`}
          </div>
          {tab === 'All' && (
            <button className="btn btn-primary" onClick={() => setPage('create')}>
              Create Contract
            </button>
          )}
        </div>
      ) : (
        <div className="contract-grid">
          {filtered.map(c => (
            <ContractCard key={c.id} contract={c} onClick={onView} />
          ))}
        </div>
      )}
    </div>
  )
}
