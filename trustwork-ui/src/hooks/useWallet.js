// =============================================================================
// useWallet.js — Freighter wallet integration (@stellar/freighter-api v6)
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  getNetwork,
} from '@stellar/freighter-api'

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015'
const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015'

function delay(ms) { return new Promise(r => setTimeout(r, ms)) }

// ---------------------------------------------------------------------------
// Demo shim — used when user explicitly picks "Demo Wallet"
// ---------------------------------------------------------------------------
const DEMO_ADDRESSES = [
  'GDEMO7KPQTRUSTWORK1234STELLAR56789ABCDEF',
  'GCLIENT9XYZFREELANCER456STELLAR789DEMO12',
]

async function connectDemo() {
  await delay(900)
  return {
    address: DEMO_ADDRESSES[Math.floor(Math.random() * DEMO_ADDRESSES.length)],
    network: 'TESTNET',
    networkPassphrase: TESTNET_PASSPHRASE,
  }
}

// ---------------------------------------------------------------------------
// useWallet hook
// ---------------------------------------------------------------------------
export function useWallet() {
  const [address, setAddress]       = useState(null)
  const [network, setNetwork]       = useState(null)
  const [networkOk, setNetworkOk]   = useState(true)
  const [installed, setInstalled]   = useState(null)  // null = checking
  const [connecting, setConnecting] = useState(false)
  const [error, setError]           = useState(null)

  function applyAccount(addr, net, passphrase) {
    setAddress(addr)
    setNetwork(net)
    setNetworkOk(
      passphrase === TESTNET_PASSPHRASE ||
      passphrase === MAINNET_PASSPHRASE
    )
  }

  // On mount: detect Freighter and restore session if already allowed
  useEffect(() => {
    async function init() {
      try {
        // isConnected() returns { isConnected: bool } in v6
        const connResult = await isConnected()
        const hasExtension = connResult?.isConnected === true

        if (!hasExtension) {
          setInstalled(false)
          return
        }

        setInstalled(true)

        // Check if user already approved this site
        const allowResult = await isAllowed()
        if (allowResult?.isAllowed) {
          const addrResult = await getAddress()
          const netResult  = await getNetwork()
          if (addrResult?.address) {
            applyAccount(
              addrResult.address,
              netResult?.network || 'TESTNET',
              netResult?.networkPassphrase || TESTNET_PASSPHRASE
            )
          }
        }
      } catch {
        setInstalled(false)
      }
    }
    init()
  }, [])

  // connect — called when user picks a wallet in the modal
  const connect = useCallback(async (walletType = 'freighter') => {
    setConnecting(true)
    setError(null)

    try {
      // ── Demo mode ──────────────────────────────────────────────────────────
      if (walletType === 'demo') {
        const { address: addr, network: net, networkPassphrase } = await connectDemo()
        applyAccount(addr, net, networkPassphrase)
        setInstalled(true)
        return addr
      }

      // ── Real Freighter ─────────────────────────────────────────────────────
      const connResult = await isConnected()
      if (!connResult?.isConnected) {
        setInstalled(false)
        setError('Freighter extension not detected. Please install it first.')
        return null
      }

      setInstalled(true)

      // requestAccess() opens the Freighter popup asking user to approve
      const accessResult = await requestAccess()
      if (accessResult?.error) {
        setError(accessResult.error)
        return null
      }

      const addrResult = await getAddress()
      const netResult  = await getNetwork()

      if (!addrResult?.address) {
        setError('Could not retrieve address from Freighter.')
        return null
      }

      applyAccount(
        addrResult.address,
        netResult?.network || 'TESTNET',
        netResult?.networkPassphrase || TESTNET_PASSPHRASE
      )

      return addrResult.address
    } catch (err) {
      setError(err?.message || 'Connection failed. Please try again.')
      return null
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setNetwork(null)
    setNetworkOk(true)
    setError(null)
  }, [])

  return {
    address,
    network,
    networkOk,
    installed,   // null=checking, true=found, false=not found
    connecting,
    error,
    connect,
    disconnect,
  }
}
