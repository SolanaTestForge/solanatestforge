# Fixtures

Anchor sources used by the security-rule snapshot tests.

| Fixture        | Triggers              | Notes |
|----------------|-----------------------|-------|
| `vault_unsafe` | STF-001, STF-002, STF-003 | Three deliberate violations: missing signer, unchecked arithmetic, missing owner check on a CPI program account. |

## Conventions

- Each unsafe fixture has a `_safe` sibling that should produce **zero** findings under the same rule set.
- Fixtures never get deployed. They exist purely as input to `security-checker.parseSource()`.
- Keep the file count minimal — one `lib.rs`, one `Cargo.toml`. Anything more belongs in an integration test.

## Adding a fixture

1. Create `cli/test/fixtures/<name>_unsafe/{lib.rs, Cargo.toml}` with the violation.
2. Optional: create the matching `<name>_safe/` variant.
3. Add a unit test under `cli/test/<name>.test.ts` that asserts the rule fires (and clears, if applicable).
4. Document the trigger row in this README.
