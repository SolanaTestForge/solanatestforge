# `.solforge.toml` configuration examples

The forge picks up an optional `.solforge.toml` at the project root.
Use it to disable rules that don't fit your codebase, tune severity, or pin
fixture data.

---

## Disable a single rule

When your math library intentionally uses unchecked arithmetic with overflow
guards elsewhere:

```toml
[rules]
disable = ["STF-002"]   # checked-math required

[rules.severity]
"STF-001" = "warning"   # was error: missing-signer-check
```

---

## Whitelist files

Skip vendored or generated code:

```toml
[scan]
exclude = [
    "programs/**/idl.rs",
    "programs/**/generated/*.rs",
    "tests/fixtures/**",
]
```

---

## Pin a snapshot for forking

```toml
[fork]
network = "devnet"
slot = 296_440_512
accounts = [
    "Vote111111111111111111111111111111111111111",
    "11111111111111111111111111111111",
]
```

---

## Fuzzer corpus

Useful when reproducing a regression:

```toml
[fuzz]
seed = "0xCAFE_BABE_DEADBEEF"
iterations = 5000

[fuzz.boundary_values]
u64 = ["0", "1", "2", "u64::MAX"]
i128 = ["i128::MIN", "0", "i128::MAX"]
```

---

## Combined example

A repo that:
- silences the bump-farming rule (intentional design choice)
- bumps signer-check from error to fatal (treats missing as build-breaker)
- fuzzes 50k iterations against pinned mainnet slot

```toml
[rules]
disable = ["STF-006"]

[rules.severity]
"STF-001" = "fatal"

[fork]
network = "mainnet"
slot = 318_001_274

[fuzz]
iterations = 50_000
```
