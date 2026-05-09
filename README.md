# SolanaTestForge

Test framework for Solana programs with forked state, security analysis, and fuzzing.

## Getting Started

```bash
npm install -g solanatestforge
```

### CI integration

Run the security pass on every PR — fails the build on `high`+ findings, JSON output for parsers:

```yaml
# .github/workflows/security.yml
jobs:
  forge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install -g solanatestforge
      - run: solforge security ./programs --json --fail-on high
```

## Commands

### `solforge fork <network> <PROGRAM_ID>`

Fork devnet or mainnet state for local testing.

```
$ solforge fork devnet TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA

  Forking program state...
  Network:     devnet
  Program:     TokenkegQfe...VQ5DA
  Accounts:    847 fetched
  Snapshot:    .solforge/TokenkegQfe_284719203.json
  Size:        1.2 MB

  Fork complete. Use `solforge test` to run tests against forked state.
```

### `solforge security <PROGRAM_ID>`

Run security checks against a program IDL.

```
$ solforge security ./target/idl/my_program.json

  Security Analysis: my_program

  ┌─────────────────────┬──────────┬────────┐
  │ Check               │ Severity │ Result │
  ├─────────────────────┼──────────┼────────┤
  │ Missing signer      │ Critical │  FAIL  │
  │ Unchecked owner     │ Critical │  PASS  │
  │ Arithmetic overflow │ High     │  FAIL  │
  │ Reinitialization    │ Medium   │  PASS  │
  │ CPI authority       │ Medium   │  PASS  │
  │ Rent exemption      │ Low      │  PASS  │
  └─────────────────────┴──────────┴────────┘

  2 issues found (1 critical, 1 high)

  FAIL  missing-signer
        Instruction `withdraw` has authority account without isSigner flag
        Severity: Critical

  FAIL  arithmetic-overflow
        No overflow error codes found in program error enum
        Severity: High
```

### `solforge fuzz <PROGRAM_ID> [--iterations N]`

Fuzz test with random inputs and boundary values.

```
$ solforge fuzz ./target/idl/my_program.json --iterations 5000

  Fuzzing: my_program (5000 iterations)
  ████████████████████████████████████████ 100%

  Results:
    Total inputs:     5,000
    Crashes:          3
    Invariant breaks: 1
    Edge cases:       12
```

### `solforge test [--file <path>]`

Run tests on forked state (requires local validator).

## Supported Security Checks

| Check | Description | Severity |
|-------|-------------|----------|
| Missing signer | Instruction lacks required signer validation | Critical |
| Unchecked owner | Mutable account without owner verification | Critical |
| Arithmetic overflow | No checked math or overflow error codes | High |
| Reinitialization | Init instruction missing system_program guard | Medium |
| CPI authority | External program call without constraint | Medium |
| Rent exemption | No close/delete for account cleanup | Low |

## Stack

- TypeScript CLI (commander.js)
- Fork engine (JSON-RPC snapshots)
- IDL-based security analysis
- Random + boundary value fuzzer

## Dev

```bash
cd cli
npm install
npm run build
node dist/index.js security ./target/idl/my_program.json
```

## License

MIT
