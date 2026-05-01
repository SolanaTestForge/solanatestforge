# Security Rules Reference

Full BOM of every static-analysis rule shipped with `solanatestforge`.

| ID | Severity | Rule | What it catches |
|---|---|---|---|
| `STF-001` | critical | `missing_signer_check` | An instruction mutates state without enforcing `Signer<'info>` on the relevant authority account. |
| `STF-002` | critical | `unchecked_arithmetic` | Raw `+ - * /` on `u64`/`i64` outside a `checked_*` helper — silent overflow on Solana. |
| `STF-003` | high     | `missing_owner_check` | An `AccountInfo` is used without verifying its owner program — allows account confusion attacks. |
| `STF-004` | high     | `unsigned_close_account` | `close = recipient` constraint missing the matching signer guard, allowing rent griefing. |
| `STF-005` | medium   | `mut_without_signer` | A `#[account(mut)]` attribute on an account that is never made `Signer` and lacks an authority constraint. |
| `STF-006` | medium   | `pda_seed_drift` | An instruction recomputes a canonical bump (`bump`) instead of reusing the stored `bump = account.bump`. |
| `STF-007` | low      | `missing_error_codes` | A `require!` or `?` returns a generic Anchor error instead of a project-defined `ErrorCode` variant. |

## Severity ramps

| Severity | Default exit code | Recommended `--fail-on` |
|---|---|---|
| critical | `1` | `critical` |
| high     | `1` | `high` |
| medium   | `1` | `medium` |
| low      | `0` | _(advisory only)_ |

## Adding a new rule

1. Drop a TS file in `cli/src/security/rules/your_rule.ts` exporting an object that implements `SecurityRule`.
2. Register it in `cli/src/security/index.ts` `rules` array.
3. Add a fixture under `cli/test/fixtures/your_rule_unsafe/` containing minimal Anchor source that triggers the rule.
4. Add a unit test under `cli/test/your_rule.test.ts` asserting the rule flags the fixture and clears on a sibling `your_rule_safe/` variant.

## Configuration

Project-level overrides live in `.solforge.toml`:

```toml
[security]
rules = ["STF-001", "STF-002", "STF-003", "STF-004"]
ignore = ["tests/**"]
fail_on = "high"
```
