# Changelog

All notable changes to `solanatestforge` cli.

## [0.1.0] — first npm publish

### Added
- `[fork]` devnet snapshot engine with retry-on-429 and exp backoff
- `[security]` 7 lint rules: missing-signer, unchecked-arithmetic, missing-owner, etc.
- `[fuzz]` u64 boundary corpus with overflow / underflow / wrap traps
- `[cli]` `solforge fork`, `solforge security`, `solforge fuzz` commands
- `[cli]` colored output, table reporters, exit-code on findings
- `[landing]` blueprint × forge theme with Departure Mono + Space Grotesk
- `[landing]` SVG schematic that self-draws with animated data-flow dots
- `[landing]` 288-cell heat-map with auto-ignite on scroll
- `[landing]` Live Forge 3-stage deck with spark bursts
- `[landing]` BOM table for 7 rules, comparison table, install plate
- E2E verified: fork 11 live devnet accounts, security scan finds 3 CRITICAL on a sibling project, fuzz catches 6 overflow / underflow

## [unreleased] — 0.2.0 prep

### Planned
- `[security]` missing-owner-check rule + unchecked-arithmetic rule
- `[fork]` program_data accounts for upgradeable BPF programs
- `[fuzz]` `--seed` flag for reproducible runs
- `[cli]` `--json` reporter + `--fail-on` severity threshold
- `[cli]` `solforge init` scaffolds `.solforge.toml`
- `[docs]` rules reference table + sample anchor fixtures
