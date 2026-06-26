# TrustWork Smart Contract Documentation

## Overview

The TrustWork Escrow Contract is a Soroban smart contract written in Rust that provides trustless escrow services for freelance work on the Stellar blockchain.

**Contract Address (Testnet):** `CBEUUVKJD2FM5CL57COXJV55HXYSEDW7VXRBJFWKDNZZRSHBMWQZUNQS`

## Contract Structure

```
democontract/
├── Cargo.toml          # Soroban dependencies & build config
├── lib.rs              # Main contract interface
├── types.rs            # Data structures & enums
├── storage.rs          # On-chain state management
├── escrow.rs           # Core escrow logic
├── factory.rs          # Escrow instance creation
└── tests.rs            # Comprehensive test suite
```

## Contract Functions

### 1. `create_escrow`

Creates a new escrow instance and returns its ID.

**Parameters:**
- `buyer: Address` - Client who will fund the escrow
- `seller: Address` - Freelancer who will receive payment
- `arbitrator: Option<Address>` - Optional third-party dispute resolver
- `amount: i128` - Amount to be escrowed (in stroops)
- `token: Address` - Token contract address (e.g., XLM SAC)
- `deadline: u64` - Unix timestamp for project deadline
- `description: Symbol` - Short project description

**Returns:** `u64` - Escrow ID

**Authorization:** Requires `buyer` signature

```rust
let escrow_id = contract.create_escrow(
    buyer,
    seller,
    Some(arbitrator),
    1_000_0000000, // 1000 XLM
    xlm_token,
    deadline_timestamp,
    Symbol::new(&env, "website"),
);
```

---

### 2. `deposit`

Locks funds from buyer into the escrow contract.

**Parameters:**
- `escrow_id: u64` - ID of the escrow to fund

**Returns:** `Result<(), EscrowError>`

**Authorization:** Requires `buyer` signature

**State Transition:** `AwaitingDeposit` → `Funded`

```rust
contract.deposit(escrow_id)?;
```

---

### 3. `submit_work`

Marks work as completed and submitted for review.

**Parameters:**
- `escrow_id: u64` - ID of the escrow

**Returns:** `Result<(), EscrowError>`

**Authorization:** Requires `seller` signature

**State Transition:** `Funded` → `WorkSubmitted`

```rust
contract.submit_work(escrow_id)?;
```

---

### 4. `approve_and_release`

Approves the work and releases funds to the freelancer.

**Parameters:**
- `escrow_id: u64` - ID of the escrow

**Returns:** `Result<(), EscrowError>`

**Authorization:** Requires `buyer` signature

**State Transition:** `WorkSubmitted` → `Completed`

```rust
contract.approve_and_release(escrow_id)?;
```

---

### 5. `refund`

Returns funds to the buyer before work is submitted.

**Parameters:**
- `escrow_id: u64` - ID of the escrow

**Returns:** `Result<(), EscrowError>`

**Authorization:** Requires `buyer` signature

**State Transition:** `Funded` → `Refunded`

```rust
contract.refund(escrow_id)?;
```

---

### 6. `raise_dispute`

Escalates a disagreement to the arbitrator.

**Parameters:**
- `escrow_id: u64` - ID of the escrow

**Returns:** `Result<(), EscrowError>`

**Authorization:** Requires `buyer` OR `seller` signature

**State Transition:** `WorkSubmitted` → `Disputed`

```rust
contract.raise_dispute(escrow_id)?;
```

---

### 7. `resolve_dispute`

Arbitrator decides how to split/award the escrowed funds.

**Parameters:**
- `escrow_id: u64` - ID of the escrow
- `resolution: Resolution` - One of:
  - `Resolution::Seller` - Award 100% to seller
  - `Resolution::Buyer` - Award 100% to buyer (refund)
  - `Resolution::Split` - Award 50/50

**Returns:** `Result<(), EscrowError>`

**Authorization:** Requires `arbitrator` signature

**State Transition:** `Disputed` → `Completed` or `Refunded`

```rust
contract.resolve_dispute(escrow_id, Resolution::Split)?;
```

---

### 8. `claim_after_deadline`

Allows seller to claim funds if buyer is inactive after deadline.

**Parameters:**
- `escrow_id: u64` - ID of the escrow

**Returns:** `Result<(), EscrowError>`

**Authorization:** Requires `seller` signature

**Requirements:**
- Status must be `WorkSubmitted`
- Current timestamp must be > `deadline`

**State Transition:** `WorkSubmitted` → `Completed`

```rust
contract.claim_after_deadline(escrow_id)?;
```

---

### 9. `get_escrow`

Retrieves the current state of an escrow.

**Parameters:**
- `escrow_id: u64` - ID of the escrow

**Returns:** `Result<EscrowConfig, EscrowError>`

```rust
let escrow = contract.get_escrow(escrow_id)?;
println!("Status: {:?}", escrow.status);
println!("Amount: {}", escrow.amount);
```

---

### 10. `escrow_count`

Returns the total number of escrows created.

**Returns:** `u64`

```rust
let count = contract.escrow_count();
```

---

## Data Structures

### EscrowConfig

```rust
pub struct EscrowConfig {
    pub buyer: Address,
    pub seller: Address,
    pub arbitrator: Option<Address>,
    pub amount: i128,
    pub token: Address,
    pub deadline: u64,
    pub status: EscrowStatus,
    pub description: Symbol,
}
```

### EscrowStatus

```rust
pub enum EscrowStatus {
    AwaitingDeposit,
    Funded,
    WorkSubmitted,
    Completed,
    Refunded,
    Disputed,
}
```

### Resolution

```rust
pub enum Resolution {
    Seller,   // 100% to seller
    Buyer,    // 100% to buyer (refund)
    Split,    // 50/50 split
}
```

### EscrowError

```rust
pub enum EscrowError {
    NotFound,
    Unauthorized,
    InvalidStatus,
    DeadlineNotPassed,
    NoArbitrator,
}
```

---

## State Machine

```
create_escrow()
      │
      ▼
AwaitingDeposit
      │
   deposit()
      │
      ▼
   Funded ──────────────┐
      │                 │
submit_work()       refund()
      │                 │
      ▼                 ▼
WorkSubmitted      Refunded
      │
      ├──────┬──────────┐
      │      │          │
approve() raise_    claim_after_
      │   dispute()   deadline()
      │      │          │
      ▼      ▼          │
 Completed Disputed     │
           │            │
    resolve_dispute()   │
           │            │
      ┌────┴────┐       │
      ▼         ▼       │
 Completed  Refunded    │
      ▲                 │
      └─────────────────┘
```

---

## Building & Testing

### Build the Contract

```bash
cd democontract
cargo build --target wasm32-unknown-unknown --release
```

### Run Tests

```bash
cargo test
```

### Optimize WASM

```bash
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/trustwork_escrow.wasm
```

### Deploy to Testnet

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/trustwork_escrow.wasm \
  --source ACCOUNT_SECRET_KEY \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

---

## CI/CD Integration

The contract is automatically built and tested in GitHub Actions on every push:

```yaml
- Build smart contract (Rust + WASM target)
- Run comprehensive test suite
- Optimize WASM binary
- Upload artifact for deployment
- Integration check with frontend
```

**Workflow:** `.github/workflows/deploy.yml`

---

## Frontend Integration

The contract is called from the frontend using `@stellar/stellar-sdk`:

**File:** `trustwork-ui/src/utils/stellar.js`

```javascript
import * as StellarSdk from '@stellar/stellar-sdk';

export async function sorobanCreateEscrow(wallet, config) {
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET
  })
  .addOperation(contract.call(
    'create_escrow',
    StellarSdk.nativeToScVal(config.buyer, {type: "address"}),
    StellarSdk.nativeToScVal(config.seller, {type: "address"}),
    // ... other parameters
  ))
  .setTimeout(300)
  .build();
  
  return await submitTransaction(tx);
}
```

**Contract Functions Mapped:**
- `create_escrow` → `sorobanCreateEscrow()`
- `deposit` → `sorobanDeposit()`
- `submit_work` → `sorobanSubmitWork()`
- `approve_and_release` → `sorobanApprove()`
- `refund` → `sorobanRefund()`
- `raise_dispute` → `sorobanRaiseDispute()`
- `resolve_dispute` → `sorobanResolveDispute()`
- `claim_after_deadline` → `sorobanClaimAfterDeadline()`
- `get_escrow` → `getEscrow()`

---

## Security Features

✅ **Authorization Checks:** Every state-changing function requires proper signature  
✅ **State Validation:** Transitions only allowed from valid states  
✅ **Deadline Enforcement:** `claim_after_deadline` validates timestamp  
✅ **Arbitrator Gating:** Dispute resolution requires arbitrator if set  
✅ **Token Standard:** Uses Stellar Asset Contract (SAC) for token transfers  
✅ **No Reentrancy:** Contract follows checks-effects-interactions pattern  
✅ **Immutable States:** Completed/Refunded states are terminal  

---

## Testing Coverage

| Test | Coverage |
|------|----------|
| Create escrow | ✅ Verified |
| Deposit funds | ✅ Verified |
| Submit work | ✅ Verified |
| Approve & release | ✅ Verified |
| Refund | ✅ Verified |
| Raise dispute | ✅ Verified |
| Resolve dispute (all resolutions) | ✅ Verified |
| Escrow count | ✅ Verified |
| Unauthorized access | ✅ Verified (should panic) |
| Deadline validation | ✅ Verified |

**Run tests:** `cargo test` (9/9 passing)

---

## Deployed Contract

**Network:** Stellar Testnet  
**Contract ID:** `CBEUUVKJD2FM5CL57COXJV55HXYSEDW7VXRBJFWKDNZZRSHBMWQZUNQS`  
**Explorer:** [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBEUUVKJD2FM5CL57COXJV55HXYSEDW7VXRBJFWKDNZZRSHBMWQZUNQS)  

---

## License

MIT
