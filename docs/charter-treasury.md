# Charter treasury integration

AfriWage's org treasuries are [Charter](https://github.com/fadesany/charter-contract)
Soroban contracts. AfriWage does not deploy its own treasury contract and does not
custody any org's funds.

## What Charter provides

Two contracts:

- **Factory** — deploys treasuries from one uploaded treasury wasm and keeps a public
  org registry. Deployment is permissioned: the factory stores a single `deployer`
  address, and `deploy_treasury` requires that address to authorise every deployment.
- **Treasury** — holds one token for one organization. Funds are grouped into budget
  categories with lifetime caps. Spending goes through submit → approve, and the payout
  executes automatically inside the approval that meets the threshold.

Testnet deployment used by AfriWage (from Charter's README):

| Contract | Address |
|----------|---------|
| Factory  | `CCUQBFFRGR4RUWHKLWSRWKBL3WORHNTHFLTKMHTNUZL4T5733ODN5WD4` |

## Contract functions AfriWage calls

Verified against `contracts/factory/src/lib.rs` and `contracts/treasury/src/lib.rs`, not
assumed:

```rust
// factory
fn deploy_treasury(name: String, admin: Address, approvers: Vec<Address>,
                   threshold: u32, token: Address) -> u32   // returns org_id
fn get_org(org_id: u32) -> OrgRecord

// treasury
fn create_category(admin: Address, name: String, cap: i128) -> u32
fn deposit(from: Address, amount: i128)
fn submit_request(requester: Address, category_id: u32, recipient: Address,
                  amount: i128, memo: String) -> u32        // returns request_id
fn approve_request(approver: Address, request_id: u32)      // auto-executes at threshold
fn get_categories() -> Vec<Category>
fn get_request(request_id: u32) -> Request
fn get_balance() -> i128
fn get_approvers() -> Vec<Address>
fn get_threshold() -> u32
```

## Who signs what

Every transaction that touches an org's treasury is built unsigned by
`packages/sdk/src/charter.ts` and signed client-side in Freighter by the org member
performing the action. The AfriWage server holds no treasury key and is not an approver
on any treasury.

There is exactly one server-held key in this integration, and it is not a treasury key:

**`CHARTER_FACTORY_DEPLOYER_SECRET_KEY`** — the factory's registered `deployer`.

Charter's factory is permissioned by design. `deploy_treasury` calls
`deployer.require_auth()` *and* `admin.require_auth()`, so a treasury deployment cannot
be authorised by the organization alone — the factory operator must co-sign. AfriWage is
the factory operator for its own deployment, so provisioning is built as:

1. The **org owner** is the transaction source. They pay the fee, and their `admin`
   authorisation is satisfied by the envelope signature they add in Freighter.
2. The **server** signs only the factory's `deployer` authorization entry, using
   `authorizeEntry`. That entry authorises one specific `deploy_treasury` invocation and
   nothing else.

What that key can and cannot do:

- **Can**: authorise deploying a new treasury through the factory.
- **Cannot**: submit, approve, reject or execute a payout; change a treasury's approver
  set or threshold; create or alter a budget category; move any funds. All of those
  require an org member's own signature, and the server never holds one.

If you would rather not run a deployer key at all, deploy your own Charter factory with
an operator-controlled `deployer` and provision treasuries out of band, then write the
resulting address into `organizations.treasury_contract_id` directly. Everything after
provisioning works without the key.

## Amounts

Charter takes every amount as an `i128` in the token's smallest unit. USDC reaches
Soroban as a Stellar Asset Contract carrying the classic asset's 7 decimals, which is the
precision `build-payment.ts` already accepts.

`toTokenUnits` **throws** rather than rounding when a value carries more precision than
the token can represent. Silently truncating a wage is the one outcome a payroll system
must never produce.

## Resolving a deployed treasury address

`deploy_treasury` returns the new **org id**, not the treasury address. After the signed
transaction is submitted:

1. `readDeployedOrgId(hash)` reads the return value from the transaction result.
2. `getOrgRecord(factoryId, orgId)` reads the address from the factory's registry.

Reading `get_org_count()` instead would race with any other organization provisioning at
the same moment, so the id always comes from the caller's own transaction result.
