# SolanaTestForge

Advanced test framework for Solana programs with forked state, security checks, and fuzzing.

## Getting Started

```bash
npm install -g solana-test-forge

# Run tests on forked state
solforge test --file tests/my-test.ts

# Fork devnet state for a program
solforge fork devnet <PROGRAM_ID>

# Fork at specific slot (mainnet)
solforge fork mainnet <PROGRAM_ID> --slot 280000000

# Run security checks against an IDL
solforge security <PROGRAM_ID_OR_IDL_PATH>

# Run fuzzer
solforge fuzz <PROGRAM_ID_OR_IDL_PATH> --iterations 10000
```

## Supported Checks

| Check | Description | Severity |
|-------|-------------|----------|
| Missing signer | Instruction lacks required signer validation | Critical |
| Account ownership | Program doesn't verify account owner | Critical |
| Integer overflow | Arithmetic without checked math | High |
| PDA validation | Missing bump seed verification | Medium |
| Rent exempt | Account may fall below rent exemption | Low |

## Stack

- Rust core (SBF analysis + forked validator)
- TypeScript CLI (commander.js)
- React dashboard (optional)

## Development

```bash
cargo build --release
cd cli && npm install && npm run build
```

## License

MIT
