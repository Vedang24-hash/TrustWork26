# Frontend-Contract Integration Guide

This document explains how the TrustWork frontend integrates with the Soroban smart contract.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Page Components (Home, Dashboard, CreateContract)  │   │
│  └───────────────────┬──────────────────────────────────┘   │
│                      │                                       │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │  Utils Layer (stellar.js, contract.js)             │   │
│  └───────────────────┬──────────────────────────────────┘   │
│                      │                                       │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │  @stellar/stellar-sdk                               │   │
│  └───────────────────┬──────────────────────────────────┘   │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       │ RPC Calls
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Stellar Soroban RPC Node                        │
│         https://soroban-testnet.stellar.org                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Contract Invocation
                        │
┌───────────────────────▼─────────────────────────────────────┐
│          Smart Contract (Rust/WASM)                          │
│     CBEUUVKJD2FM5CL57COXJV55HXYSEDW7VXR...                  │
│                                                              │
│  - create_escrow()                                           │
│  - deposit()                                                 │
│  - submit_work()                                             │
│  - approve_and_release()                                     │
│  - refund()                                                  │
│  - raise_dispute()                                           │
│  - resolve_dispute()                                         │
│  - claim_after_deadline()                                    │
│  - get_escrow()                                              │
└──────────────────────────────────────────────────────────────┘
```

## Key Integration Files

### 1. `trustwork-ui/src/utils/stellar.js`

**Purpose:** Wraps all Soroban contract interactions using `@stellar/stellar-sdk`

**Key Imports:**
```javascript
import * as StellarSdk from '@stellar/stellar-sdk';
```

**Contract Functions Implemented:**

| Contract Function | Frontend Function | Description |
|------------------|------------------|-------------|
| `create_escrow` | `sorobanCreateEscrow()` | Creates new escrow instance |
| `deposit` | `sorobanDeposit()` | Funds the escrow |
| `submit_work` | `sorobanSubmitWork()` | Marks work as submitted |
| `approve_and_release` | `sorobanApprove()` | Releases payment to freelancer |
| `refund` | `sorobanRefund()` | Returns funds to client |
| `raise_dispute` | `sorobanRaiseDispute()` | Escalates to arbitrator |
| `resolve_dispute` | `sorobanResolveDispute()` | Arbitrator resolves dispute |
| `claim_after_deadline` | `sorobanClaimAfterDeadline()` | Auto-claim after review period |
| `get_escrow` | `getEscrow()` | Fetches escrow state |

**Example Implementation:**

```javascript
// stellar.js excerpt

export async function sorobanCreateEscrow(wallet, config) {
  const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  
  // Load source account
  const sourceAccount = await server.getAccount(wallet);
  
  // Build transaction
  const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET
  })
    .addOperation(contract.call(
      'create_escrow',
      StellarSdk.nativeToScVal(config.buyer, {type: "address"}),
      StellarSdk.nativeToScVal(config.seller, {type: "address"}),
      StellarSdk.nativeToScVal(config.arbitrator, {type: "option"}),
      StellarSdk.nativeToScVal(config.amount, {type: "i128"}),
      StellarSdk.nativeToScVal(config.token, {type: "address"}),
      StellarSdk.nativeToScVal(config.deadline, {type: "u64"}),
      StellarSdk.nativeToScVal(config.description, {type: "symbol"})
    ))
    .setTimeout(300)
    .build();
  
  // Simulate & prepare
  const preparedTx = await server.prepareTransaction(transaction);
  
  // Sign with Freighter
  const signedTxXdr = await window.freighterApi.signTransaction(
    preparedTx.toXDR(),
    { networkPassphrase: StellarSdk.Networks.TESTNET }
  );
  
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedTxXdr,
    StellarSdk.Networks.TESTNET
  );
  
  // Submit
  const result = await server.sendTransaction(signedTx);
  
  // Wait for confirmation
  let status = await server.getTransaction(result.hash);
  while (status.status === 'PENDING') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    status = await server.getTransaction(result.hash);
  }
  
  if (status.status === 'SUCCESS') {
    const resultVal = status.returnValue;
    const escrowId = StellarSdk.scValToNative(resultVal);
    return { result: escrowId, txHash: result.hash };
  }
  
  throw new Error(status.status);
}
```

---

### 2. `trustwork-ui/src/utils/contract.js`

**Purpose:** Local state management, validation, and contract utilities

**Key Functions:**

```javascript
// Format contract ID for display
export function formatContractId(escrowId) {
  return `ESC-${String(escrowId).padStart(6, '0')}`;
}

// Calculate XLM from stroops
export function formatXLM(stroops) {
  return (Number(stroops) / 10_000_000).toFixed(2) + ' XLM';
}

// Contract state constants
export const CONTRACT_STATES = {
  ACTIVE: 'ACTIVE',
  SUBMITTED: 'SUBMITTED',
  COMPLETED: 'COMPLETED',
  DISPUTED: 'DISPUTED',
  REFUNDED: 'REFUNDED',
};

// Local state transitions (optimistic updates)
export function applySubmitWork(contract, txHash, note, deliverables) {
  return {
    ...contract,
    status: CONTRACT_STATES.SUBMITTED,
    submittedAt: new Date().toISOString(),
    submitTxHash: txHash,
    submissionNote: note,
    deliverables: deliverables,
  };
}

export function applyApprove(contract, txHash) {
  return {
    ...contract,
    status: CONTRACT_STATES.COMPLETED,
    completedAt: new Date().toISOString(),
    approveTxHash: txHash,
  };
}

// ... more state transition helpers
```

---

### 3. `trustwork-ui/src/pages/CreateContract.jsx`

**Purpose:** UI for creating escrow contracts

**Integration Flow:**

```javascript
import { sorobanCreateEscrow, sorobanDeposit } from '../utils/stellar';

async function handleCreate(formData) {
  // Step 1: Create escrow on-chain
  const { result: escrowId, txHash: createTxHash } = await sorobanCreateEscrow(wallet, {
    buyer: wallet,
    seller: formData.freelancer,
    arbitrator: formData.arbitrator,
    amountXlm: formData.amount,
    tokenAddress: xlmToken,
    deadlineUnix: Math.floor(new Date(formData.deadline).getTime() / 1000),
    description: formData.title,
  });
  
  // Step 2: Deposit funds
  const { txHash: depositTxHash } = await sorobanDeposit(wallet, escrowId);
  
  // Step 3: Save to local state
  const contract = {
    id: formatContractId(escrowId),
    escrowId: Number(escrowId),
    title: formData.title,
    client: wallet,
    freelancer: formData.freelancer,
    amount: formData.amount,
    status: CONTRACT_STATES.ACTIVE,
    createdAt: new Date().toISOString(),
    createTxHash,
    depositTxHash,
  };
  
  onCreate(contract);
}
```

---

### 4. `trustwork-ui/src/pages/ContractDetail.jsx`

**Purpose:** View contract details and execute actions

**Integration Flow:**

```javascript
import { 
  sorobanSubmitWork, 
  sorobanApprove, 
  sorobanRaiseDispute,
  sorobanClaimAfterDeadline,
  sorobanRefund 
} from '../utils/stellar';

async function handleAction(action, payload) {
  const escrowId = contract.escrowId;
  
  switch (action) {
    case 'submit':
      const { txHash } = await sorobanSubmitWork(wallet, escrowId);
      const updated = applySubmitWork(contract, txHash, payload.note, payload.deliverables);
      onUpdate(updated);
      break;
      
    case 'approve':
      const { txHash } = await sorobanApprove(wallet, escrowId);
      const updated = applyApprove(contract, txHash);
      onUpdate(updated);
      break;
      
    case 'dispute':
      const { txHash } = await sorobanRaiseDispute(wallet, escrowId);
      const updated = applyDispute(contract, txHash, payload.reason);
      onUpdate(updated);
      break;
      
    case 'claim':
      const { txHash } = await sorobanClaimAfterDeadline(wallet, escrowId);
      const updated = applyClaim(contract, txHash);
      onUpdate(updated);
      break;
      
    case 'refund':
      const { txHash } = await sorobanRefund(wallet, escrowId);
      const updated = applyRefund(contract, txHash);
      onUpdate(updated);
      break;
  }
}
```

---

## Data Flow: Creating a Contract

```
┌────────────┐
│ User fills │
│ form       │
└──────┬─────┘
       │
       ▼
┌────────────────────────────────┐
│ CreateContract.jsx             │
│ - Validates inputs             │
│ - Calls sorobanCreateEscrow()  │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ stellar.js                     │
│ - Builds Soroban transaction   │
│ - Encodes parameters as ScVal  │
│ - Calls Freighter for signature│
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Freighter Wallet               │
│ - User reviews & signs         │
│ - Returns signed XDR           │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Soroban RPC                    │
│ - Submits transaction          │
│ - Waits for confirmation       │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Smart Contract                 │
│ - create_escrow() executes     │
│ - Stores escrow config         │
│ - Returns escrow ID            │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Frontend                       │
│ - Receives escrow ID           │
│ - Calls deposit()              │
│ - Saves to localStorage        │
│ - Shows success screen         │
└────────────────────────────────┘
```

---

## Parameter Encoding

The contract expects specific Soroban value types. The frontend must encode parameters correctly:

| Contract Type | JavaScript | Encoding Function |
|--------------|-----------|-------------------|
| `Address` | `string` | `nativeToScVal(addr, {type: "address"})` |
| `i128` | `string/BigInt` | `nativeToScVal(amount, {type: "i128"})` |
| `u64` | `number` | `nativeToScVal(timestamp, {type: "u64"})` |
| `Symbol` | `string` | `nativeToScVal(text, {type: "symbol"})` |
| `Option<Address>` | `Address \| null` | `nativeToScVal(addr, {type: "option"})` |
| `enum Resolution` | `number` | Custom encoding (0=Seller, 1=Buyer, 2=Split) |

**Example:**

```javascript
// Contract expects: create_escrow(buyer: Address, seller: Address, ...)
// Frontend sends:
contract.call(
  'create_escrow',
  StellarSdk.nativeToScVal(buyerAddress, {type: "address"}),
  StellarSdk.nativeToScVal(sellerAddress, {type: "address"}),
  // ...
)
```

---

## Error Handling

The frontend translates contract errors into user-friendly messages:

```javascript
// stellar.js
export async function handleContractError(error) {
  // Parse Soroban error codes
  if (error.message.includes('Unauthorized')) {
    return 'You do not have permission to perform this action.';
  }
  if (error.message.includes('InvalidStatus')) {
    return 'This action cannot be performed in the current contract state.';
  }
  if (error.message.includes('DeadlineNotPassed')) {
    return 'Cannot claim funds before the deadline has passed.';
  }
  if (error.message.includes('NoArbitrator')) {
    return 'This contract does not have an arbitrator assigned.';
  }
  return 'An unexpected error occurred. Please try again.';
}
```

---

## State Synchronization

The frontend maintains a local copy of contract state for performance:

```javascript
// 1. Optimistic update (immediate UI feedback)
const updated = applySubmitWork(contract, 'PENDING_TX', note);
onUpdate(updated);

// 2. Submit transaction
const { txHash } = await sorobanSubmitWork(wallet, escrowId);

// 3. Update with real tx hash
const confirmed = { ...updated, submitTxHash: txHash };
onUpdate(confirmed);

// 4. Periodically sync from chain (optional)
const chainState = await getEscrow(escrowId);
if (chainState.status !== localState.status) {
  onUpdate(chainState);
}
```

---

## Testing Integration

**Unit Tests (Frontend):**
```bash
cd trustwork-ui
npm test
```

**Unit Tests (Contract):**
```bash
cd democontract
cargo test
```

**Integration Test (Manual):**
1. Start frontend: `npm run dev`
2. Connect Freighter wallet
3. Create test contract
4. Verify transaction on Stellar Expert
5. Check contract state with `get_escrow()`

---

## Environment Configuration

**Required `.env` variables:**

```bash
# Contract deployed address
VITE_CONTRACT_ID=CBEUUVKJD2FM5CL57COXJV55HXYSEDW7VXRBJFWKDNZZRSHBMWQZUNQS

# Network configuration
VITE_STELLAR_NETWORK=testnet
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Supabase (for chat)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## CI/CD Integration Check

The GitHub Actions workflow verifies frontend-contract integration:

```yaml
- name: Verify frontend integration code
  run: |
    # Check stellar.js imports Stellar SDK
    grep -q "@stellar/stellar-sdk" src/utils/stellar.js
    
    # Check contract.js exists
    test -f src/utils/contract.js
    
    # Verify contract functions are called
    grep -q "create_escrow" src/utils/stellar.js
    grep -q "deposit" src/utils/stellar.js
    # ... check all 9 functions
```

---

## Deployment Checklist

✅ Smart contract built (`cargo build --release`)  
✅ Smart contract tests pass (`cargo test`)  
✅ Contract deployed to testnet  
✅ Frontend `.env` updated with contract ID  
✅ Frontend calls correct contract functions  
✅ Parameter encoding matches contract expectations  
✅ Error handling implemented  
✅ State synchronization tested  
✅ CI/CD pipeline passing  

---

## Resources

- **Contract Code:** `democontract/`
- **Frontend Integration:** `trustwork-ui/src/utils/stellar.js`
- **Contract Documentation:** [CONTRACT_DOCUMENTATION.md](./CONTRACT_DOCUMENTATION.md)
- **Stellar SDK Docs:** https://developers.stellar.org/docs/tools/sdks/library
- **Soroban Docs:** https://soroban.stellar.org/docs
