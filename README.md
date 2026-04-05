# SolanaTestForge

Advanced test framework for Solana programs with forked state, security checks, and fuzzing.

## Getting Started

```bash
npm install -g solana-test-forge

# Run tests with security checks
solforge test ./programs/my-program

# Fork devnet state
solforge fork --network devnet --program <PROGRAM_ID>

# Run fuzzer
solforge fuzz ./programs/my-program --iterations 10000
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
