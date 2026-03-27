import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CreateContract from './pages/CreateContract'
import ContractDetail from './pages/ContractDetail'
import Arbitration from './pages/Arbitration'
import { SEED_CONTRACTS, MOCK_WALLET } from './utils/contract'

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.icon} {t.message}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('home')
  const [contracts, setContracts] = useState(SEED_CONTRACTS)
  const [selected, setSelected] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [toasts, setToasts] = useState([])

  function addToast(message, type = 'info', icon = '⚡') {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type, icon }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  function connectWallet() {
    // Simulate Freighter/Albedo wallet connection
    setWallet(MOCK_WALLET)
    addToast('Wallet connected successfully', 'success', '🔗')
  }

  function handleCreate(contract) {
    setContracts(prev => [contract, ...prev])
    addToast(`Contract ${contract.id} created & funded`, 'success', '🔒')
  }

  function handleView(contract) {
    setSelected(contract)
    setPage('detail')
  }

  function handleUpdate(updated) {
    setContracts(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelected(updated)

    const msgs = {
      SUBMITTED: ['Work submitted successfully', 'info', '📤'],
      COMPLETED: ['Payment released to freelancer', 'success', '✅'],
      DISPUTED: ['Dispute raised — arbitration pending', 'error', '⚠️'],
      REFUNDED: ['Funds refunded to client', 'info', '↩️'],
    }
    const m = msgs[updated.status]
    if (m) addToast(...m)
  }

  // Keep selected in sync when contracts update
  useEffect(() => {
    if (selected) {
      const fresh = contracts.find(c => c.id === selected.id)
      if (fresh) setSelected(fresh)
    }
  }, [contracts])

  return (
    <>
      <Navbar
        page={page}
        setPage={setPage}
        wallet={wallet}
        onConnect={connectWallet}
      />

      {page === 'home' && (
        <Home onConnect={connectWallet} wallet={wallet} setPage={setPage} />
      )}

      {page === 'dashboard' && (
        <Dashboard contracts={contracts} onView={handleView} setPage={setPage} />
      )}

      {page === 'create' && (
        <CreateContract onCreate={handleCreate} wallet={wallet} setPage={setPage} />
      )}

      {page === 'detail' && selected && (
        <ContractDetail
          contract={selected}
          wallet={wallet}
          onUpdate={handleUpdate}
          setPage={setPage}
        />
      )}

      {page === 'arbitration' && (
        <Arbitration contracts={contracts} onUpdate={handleUpdate} />
      )}

      <Toast toasts={toasts} />
    </>
  )
}
