# Output formats

Every solforge subcommand emits human-readable output by default and
supports `--json` for machine-readable.

## Human format

Compact, color-coded, tuned for terminal scrollback:

```
$ solforge security programs/example_vault
─────────────────────────────────────────────────────────────
[security] programs/example_vault — 7 rules evaluated
─────────────────────────────────────────────────────────────
✗ STF-001  missing-signer-check               1 violation  [fatal]
  ▸ programs/example_vault/src/lib.rs:42
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()>
    fix: mark authority as Signer<'info> or add signer constraint

✗ STF-002  checked-math-required              1 violation  [error]
  ▸ programs/example_vault/src/handlers.rs:88
    let total = amount * price;
    fix: use checked_mul().ok_or(ErrorCode::MathOverflow)?

✓ STF-004  account-validation-correct         no violations
─────────────────────────────────────────────────────────────
4 violations across 7 rules — exit 1
```

## JSON format (`--json`)

Stable schema. CI-friendly. Matches `cli/test/fixtures/golden/<cmd>.json`.

```sh
$ solforge security programs/example_vault --json | jq .summary
{
  "files_scanned": 7,
  "rules_evaluated": 7,
  "violations_total": 4,
  "violations_by_severity": { "fatal": 1, "error": 2, "warning": 1 }
}
```

## CSV format (`--csv`)

For spreadsheet imports / reporting. One row per violation.

```sh
$ solforge security programs/example_vault --csv > out.csv
$ head -1 out.csv
rule_id,name,severity,file,line,snippet
```

## Exit codes

| code | meaning                             |
|-----:|-------------------------------------|
|    0 | success, no violations              |
|    1 | violations found                    |
|    2 | bad invocation (missing args, etc.) |
|    3 | I/O failure (can't read source)     |
|    4 | network failure (fork command)      |
|    5 | timeout                             |
