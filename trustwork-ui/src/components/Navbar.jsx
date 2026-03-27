import { truncateAddr } from '../utils/contract'

export default function Navbar({ page, setPage, wallet, onConnect }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'create', label: 'New Contract' },
    { id: 'arbitration', label: 'Arbitration' },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => setPage('home')}>
        <div className="navbar-logo">⚡</div>
        <span className="navbar-title">Trust<span>Work</span></span>
      </div>

      <div className="navbar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="navbar-right">
        {wallet ? (
          <div className="wallet-badge">
            <span className="wallet-dot" />
            {truncateAddr(wallet)}
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onConnect}>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  )
}
