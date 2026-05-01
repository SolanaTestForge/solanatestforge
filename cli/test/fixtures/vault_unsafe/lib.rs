// SAFETY: this file is INTENTIONALLY UNSAFE.
// It exists so the security-rule snapshot tests have a known set of failures
// to assert against. Do not deploy. Do not copy patterns from here.

use anchor_lang::prelude::*;

declare_id!("Fail1111111111111111111111111111111111111111");

#[program]
pub mod vault_unsafe {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // STF-002: unchecked arithmetic — silent overflow on u64 wrap.
        ctx.accounts.vault.balance = ctx.accounts.vault.balance + amount;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        // STF-001: missing signer check — anyone can drain by passing any
        // wallet as `owner`, since the struct uses `AccountInfo` not `Signer`.
        // STF-002: same overflow class on subtraction.
        ctx.accounts.vault.balance = ctx.accounts.vault.balance - amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub depositor: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    /// CHECK: STF-001 — should be `Signer<'info>` and constrained to `vault.owner`.
    pub owner: AccountInfo<'info>,
    /// CHECK: STF-003 — no owner check on this account, allows confusion attacks.
    pub external_program: AccountInfo<'info>,
}

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub balance: u64,
}
