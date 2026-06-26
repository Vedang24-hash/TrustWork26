#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, Symbol,
};

use crate::{TrustWorkEscrowContract, TrustWorkEscrowContractClient, types::EscrowStatus};

fn create_token_contract<'a>(e: &Env, admin: &Address) -> token::Client<'a> {
    token::Client::new(e, &e.register_stellar_asset_contract(admin.clone()))
}

#[test]
fn test_create_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustWorkEscrowContract);
    let client = TrustWorkEscrowContractClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = create_token_contract(&env, &token_admin);

    let escrow_id = client.create_escrow(
        &buyer,
        &seller,
        &None,
        &1000,
        &token.address,
        &(env.ledger().timestamp() + 86400),
        &Symbol::new(&env, "test"),
    );

    assert_eq!(escrow_id, 0);
    
    let escrow = client.get_escrow(&escrow_id);
    assert_eq!(escrow.buyer, buyer);
    assert_eq!(escrow.seller, seller);
    assert_eq!(escrow.amount, 1000);
}

#[test]
fn test_deposit_and_submit() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustWorkEscrowContract);
    let client = TrustWorkEscrowContractClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = create_token_contract(&env, &token_admin);

    // Mint tokens to buyer
    token.mint(&buyer, &10000);

    let escrow_id = client.create_escrow(
        &buyer,
        &seller,
        &None,
        &1000,
        &token.address,
        &(env.ledger().timestamp() + 86400),
        &Symbol::new(&env, "test"),
    );

    // Deposit funds
    client.deposit(&escrow_id);
    
    let escrow_after_deposit = client.get_escrow(&escrow_id);
    assert_eq!(escrow_after_deposit.status, EscrowStatus::Funded);

    // Submit work
    client.submit_work(&escrow_id);
    
    let escrow_after_submit = client.get_escrow(&escrow_id);
    assert_eq!(escrow_after_submit.status, EscrowStatus::WorkSubmitted);
}

#[test]
fn test_approve_and_release() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustWorkEscrowContract);
    let client = TrustWorkEscrowContractClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = create_token_contract(&env, &token_admin);

    token.mint(&buyer, &10000);

    let escrow_id = client.create_escrow(
        &buyer,
        &seller,
        &None,
        &1000,
        &token.address,
        &(env.ledger().timestamp() + 86400),
        &Symbol::new(&env, "test"),
    );

    client.deposit(&escrow_id);
    client.submit_work(&escrow_id);
    
    let seller_balance_before = token.balance(&seller);
    
    // Approve and release
    client.approve_and_release(&escrow_id);
    
    let escrow_final = client.get_escrow(&escrow_id);
    assert_eq!(escrow_final.status, EscrowStatus::Completed);
    
    let seller_balance_after = token.balance(&seller);
    assert_eq!(seller_balance_after - seller_balance_before, 1000);
}

#[test]
fn test_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustWorkEscrowContract);
    let client = TrustWorkEscrowContractClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = create_token_contract(&env, &token_admin);

    token.mint(&buyer, &10000);

    let escrow_id = client.create_escrow(
        &buyer,
        &seller,
        &None,
        &1000,
        &token.address,
        &(env.ledger().timestamp() + 86400),
        &Symbol::new(&env, "test"),
    );

    client.deposit(&escrow_id);
    
    let buyer_balance_before = token.balance(&buyer);
    
    // Refund before work submission
    client.refund(&escrow_id);
    
    let escrow_final = client.get_escrow(&escrow_id);
    assert_eq!(escrow_final.status, EscrowStatus::Refunded);
    
    let buyer_balance_after = token.balance(&buyer);
    assert_eq!(buyer_balance_after - buyer_balance_before, 1000);
}

#[test]
fn test_dispute_resolution() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustWorkEscrowContract);
    let client = TrustWorkEscrowContractClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let arbitrator = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = create_token_contract(&env, &token_admin);

    token.mint(&buyer, &10000);

    let escrow_id = client.create_escrow(
        &buyer,
        &seller,
        &Some(arbitrator.clone()),
        &1000,
        &token.address,
        &(env.ledger().timestamp() + 86400),
        &Symbol::new(&env, "test"),
    );

    client.deposit(&escrow_id);
    client.submit_work(&escrow_id);
    
    // Raise dispute
    client.raise_dispute(&escrow_id);
    
    let escrow_disputed = client.get_escrow(&escrow_id);
    assert_eq!(escrow_disputed.status, EscrowStatus::Disputed);
    
    // Arbitrator resolves (split 50/50)
    use crate::types::Resolution;
    client.resolve_dispute(&escrow_id, &Resolution::Split);
    
    let escrow_final = client.get_escrow(&escrow_id);
    assert_eq!(escrow_final.status, EscrowStatus::Completed);
}

#[test]
fn test_escrow_count() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustWorkEscrowContract);
    let client = TrustWorkEscrowContractClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = create_token_contract(&env, &token_admin);

    assert_eq!(client.escrow_count(), 0);

    client.create_escrow(
        &buyer,
        &seller,
        &None,
        &1000,
        &token.address,
        &(env.ledger().timestamp() + 86400),
        &Symbol::new(&env, "test1"),
    );

    assert_eq!(client.escrow_count(), 1);

    client.create_escrow(
        &buyer,
        &seller,
        &None,
        &2000,
        &token.address,
        &(env.ledger().timestamp() + 86400),
        &Symbol::new(&env, "test2"),
    );

    assert_eq!(client.escrow_count(), 2);
}

#[test]
#[should_panic]
fn test_unauthorized_approve() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, TrustWorkEscrowContract);
    let client = TrustWorkEscrowContractClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = create_token_contract(&env, &token_admin);

    token.mint(&buyer, &10000);

    let escrow_id = client.create_escrow(
        &buyer,
        &seller,
        &None,
        &1000,
        &token.address,
        &(env.ledger().timestamp() + 86400),
        &Symbol::new(&env, "test"),
    );

    client.deposit(&escrow_id);
    client.submit_work(&escrow_id);
    
    // This should fail - unauthorized user trying to approve
    env.set_source_account(&unauthorized);
    client.approve_and_release(&escrow_id);
}
