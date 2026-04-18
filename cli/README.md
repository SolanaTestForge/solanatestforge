# solanatestforge

An engineer's toolkit for safer Anchor programs — fork live state, scan IDLs against security rules, and fuzz with boundary-aware inputs. All offline, no deploys, no SOL.

```
$ npm i -g solanatestforge
$ solforge --help
```

## Commands

### `solforge fork <network> <programId>`

Snapshot every account owned by a program from devnet or mainnet-beta. The JSON dump is reproducible state you can diff, replay, or load into tests.

```bash
solforge fork devnet ERSbyEx6s4MJnAem1vjmZW8Wv2cQdx1U4Fytuo6qy8ro
# -> .solforge/fork_<prog>_<slot>.json
```

### `solforge security <idl.json>`

Static analysis over an Anchor IDL. Seven rules, severity-ranked:

| part      | finds                                                      | severity |
|-----------|------------------------------------------------------------|----------|
| MIS-SIGN  | authority-shaped accounts declared without `Signer<'info>` | critical |
| UNCHK-OWN | `UncheckedAccount` used for owned state                    | critical |
| ARITH-OVF | raw `+/-/*` on u64/u128 without `checked_*`                | high     |
| REINIT    | `init` on a mutable target without `close`/`realloc`       | high     |
| CPI-AUTH  | CPI calls signed by the wrong seed / user-controlled PDA   | high     |
| RENT-EX   | `close = x` without post-transfer lamport assertion        | medium   |
| PDA-BUMP  | non-canonical bump reused across instructions              | medium   |

```bash
solforge security ./target/idl/my_program.json
```

### `solforge fuzz <idl.json> [-n 1000]`

Boundary-aware random input hammering. Generates `u64::MAX`, `-1`, `0`, and random inputs against every instruction. Reports crashes, overflows, div-by-zero, and invariant breaks.

```bash
solforge fuzz ./target/idl/my_program.json --iterations 1000
```

### `solforge test`

Run tests against a forked snapshot without a running validator.

### `solforge init`

Scaffold a fresh test project with sensible defaults.

## Why

`anchor test` runs your unit tests. `bankrun` and `solana-test-validator` run your program. Neither one *inspects* the program for a known vulnerability class, neither one *fuzzes* it against boundary inputs, and neither one will fork live state without a deploy. `solforge` does all three.

## Requirements

- Node.js 18+
- No Rust toolchain required

## License

MIT
