// =============================================================================
// stellar.js — Soroban SDK integration (@stellar/stellar-sdk v14)
// =============================================================================

import {
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Contract,
  nativeToScVal,
  scValToNative,
  Address,
  xdr,
} from '@stellar/stellar-sdk'
import { signTransaction } from '@stellar/freighter-api'

// ── Config ────────────────────────────────────────────────────────────────────
export const NETWORK        = import.meta.env.VITE_STELLAR_NETWORK     || 'testnet'
export const RPC_URL        = import.meta.env.VITE_RPC_URL             || 'https://soroban-testnet.stellar.org'
export const CONTRACT_ID    = import.meta.env.VITE_CONTRACT_ID         || ''
export const NET_PASSPHRASE = import.meta.env.VITE_NETWORK_PASSPHRASE  || Networks.TESTNET

export const EXPLORER_BASE = NETWORK === 'mainnet'
  ? 'https://stellar.expert/explorer/public'
  : 'https://stellar.expert/explorer/testnet'

export function getServer() {
  return new rpc.Server(RPC_URL, { allowHttp: false })
}

// ── Conversions ───────────────────────────────────────────────────────────────
export function xlmToStroops(xlm) { return BigInt(Math.round(Number(xlm) * 10_000_000)) }
export function stroopsToXlm(s)   { return (Number(s) / 10_000_000).toFixed(7).replace(/\.?0+$/, '') }

function addressVal(addr) {
  return new Address(addr).toScVal()
}

// ── Core invoke ───────────────────────────────────────────────────────────────
export async function invokeContract(sourceAddress, method, args = []) {
  if (!CONTRACT_ID) throw new Error('VITE_CONTRACT_ID not set in .env')

  const server   = getServer()
  const account  = await server.getAccount(sourceAddress)
  const contract = new Contract(CONTRACT_ID)

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NET_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  // Simulate
  const simResult = await server.simulateTransaction(tx)

  // Check for simulation error (v14 style — no isSimulationError helper)
  if (simResult.error) {
    throw new Error(`Simulation failed: ${simResult.error}`)
  }
  if (!simResult.result && simResult.results?.length === 0) {
    throw new Error('Simulation returned no result')
  }

  // Assemble with footprint + resource fee
  const preparedTx = rpc.assembleTransaction(tx, simResult).build()

  // Sign via Freighter — opens the extension popup
  const signResult = await signTransaction(preparedTx.toXDR(), {
    networkPassphrase: NET_PASSPHRASE,
  })

  // Freighter v6 returns the signed XDR string directly
  const signedXdr = typeof signResult === 'string' ? signResult : signResult?.signedTxXdr
  if (!signedXdr) throw new Error('Transaction signing was cancelled or failed')

  // Submit
  const signedTx   = TransactionBuilder.fromXDR(signedXdr, NET_PASSPHRASE)
  const sendResult = await server.sendTransaction(signedTx)

  if (sendResult.status === 'ERROR') {
    throw new Error(`Submission failed: ${JSON.stringify(sendResult.errorResult)}`)
  }

  // Poll for confirmation
  const txHash = sendResult.hash
  let getResult
  let attempts = 0

  do {
    await new Promise(r => setTimeout(r, 1500))
    getResult = await server.getTransaction(txHash)
    attempts++
  } while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 20)

  if (getResult.status === rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error('Transaction was rejected by the network')
  }

  const returnVal = getResult.returnValue ? scValToNative(getResult.returnValue) : null
  return { result: returnVal, txHash }
}

// ── Read-only query (uses caller's account for simulation) ────────────────────
export async function queryContract(method, args = [], callerAddress = null) {
  if (!CONTRACT_ID) return null
  try {
    const server   = getServer()
    const contract = new Contract(CONTRACT_ID)

    // Use caller's address if provided, otherwise fall back to a known testnet account
    const sourceAddr = callerAddress || 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN'
    const account    = await server.getAccount(sourceAddr)

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NET_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build()

    const simResult = await server.simulateTransaction(tx)

    if (simResult.error) {
      console.warn(`queryContract(${method}) simulation error:`, simResult.error)
      return null
    }

    // result.retval holds the return value for read-only calls
    if (simResult.result?.retval) {
      return scValToNative(simResult.result.retval)
    }

    // Some SDK versions put it under results[0]
    if (simResult.results?.[0]?.xdr) {
      return scValToNative(xdr.ScVal.fromXDR(simResult.results[0].xdr, 'base64'))
    }

    return null
  } catch (err) {
    console.warn(`queryContract(${method}) error:`, err?.message)
    return null
  }
}

// =============================================================================
// Contract function wrappers
// =============================================================================

export async function sorobanCreateEscrow(sourceAddress, {
  buyer, seller, arbitrator, amountXlm, tokenAddress, deadlineUnix, description,
}) {
  const args = [
    addressVal(buyer),
    addressVal(seller),
    arbitrator
      ? nativeToScVal({ tag: 'Some', values: [new Address(arbitrator).toScVal()] }, { type: 'option' })
      : nativeToScVal(null, { type: 'option' }),
    nativeToScVal(xlmToStroops(amountXlm), { type: 'i128' }),
    addressVal(tokenAddress),
    nativeToScVal(BigInt(deadlineUnix), { type: 'u64' }),
    nativeToScVal(description.slice(0, 32).replace(/\s+/g, '_'), { type: 'symbol' }),
  ]
  return invokeContract(sourceAddress, 'create_escrow', args)
}

export async function sorobanDeposit(sourceAddress, escrowId) {
  return invokeContract(sourceAddress, 'deposit', [
    nativeToScVal(BigInt(escrowId), { type: 'u64' }),
  ])
}

export async function sorobanSubmitWork(sourceAddress, escrowId) {
  return invokeContract(sourceAddress, 'submit_work', [
    nativeToScVal(BigInt(escrowId), { type: 'u64' }),
  ])
}

export async function sorobanApprove(sourceAddress, escrowId) {
  return invokeContract(sourceAddress, 'approve_and_release', [
    nativeToScVal(BigInt(escrowId), { type: 'u64' }),
  ])
}

export async function sorobanRefund(sourceAddress, escrowId) {
  return invokeContract(sourceAddress, 'refund', [
    nativeToScVal(BigInt(escrowId), { type: 'u64' }),
  ])
}

export async function sorobanRaiseDispute(sourceAddress, escrowId) {
  return invokeContract(sourceAddress, 'raise_dispute', [
    nativeToScVal(BigInt(escrowId), { type: 'u64' }),
  ])
}

export async function sorobanResolveDispute(sourceAddress, escrowId, resolution) {
  let resVal
  if (resolution === 'freelancer') {
    resVal = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('ReleaseToSeller')])
  } else if (resolution === 'client') {
    resVal = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('RefundToBuyer')])
  } else {
    const pct = parseInt(resolution.split(':')[1] || '50', 10)
    resVal = xdr.ScVal.scvVec([
      xdr.ScVal.scvSymbol('Split'),
      nativeToScVal(pct, { type: 'u32' }),
    ])
  }
  return invokeContract(sourceAddress, 'resolve_dispute', [
    nativeToScVal(BigInt(escrowId), { type: 'u64' }),
    resVal,
  ])
}

export async function sorobanClaimAfterDeadline(sourceAddress, escrowId) {
  return invokeContract(sourceAddress, 'claim_after_deadline', [
    nativeToScVal(BigInt(escrowId), { type: 'u64' }),
  ])
}

export async function sorobanGetEscrow(escrowId, callerAddress = null) {
  const result = await queryContract('get_escrow', [
    nativeToScVal(BigInt(escrowId), { type: 'u64' }),
  ], callerAddress)
  return result
}

export async function sorobanEscrowCount() {
  return queryContract('escrow_count', [])
}

// XLM SAC addresses
export const XLM_SAC_TESTNET = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
export const XLM_SAC_MAINNET = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA'
export function getXlmSac() {
  return NETWORK === 'mainnet' ? XLM_SAC_MAINNET : XLM_SAC_TESTNET
}

export async function getXlmBalance(address) {
  try {
    const server  = getServer()
    const account = await server.getAccount(address)
    const bal     = account.balances?.find(b => b.asset_type === 'native')
    return bal ? parseFloat(bal.balance) : 0
  } catch { return 0 }
}
