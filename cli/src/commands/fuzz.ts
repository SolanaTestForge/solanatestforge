/// Fuzzer CLI wrapper — generates random instruction
/// inputs and simulates execution for crash detection.

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { simulateFuzz } from '../core/fuzzer';
import { header, divider, passBadge, failBadge, warnBadge, spinner } from '../core/output';

interface FuzzOpts {
  iterations: string;
}

export async function fuzzCommand(programId: string, opts: FuzzOpts) {
  const iterations = parseInt(opts.iterations, 10) || 1000;

  const spin = spinner(`Fuzzing ${programId} with ${iterations} iterations`);

  // try to find IDL
  const idlPaths = [
    path.join('target', 'idl', `${programId}.json`),
    path.join('idl', `${programId}.json`),
    programId,
  ];

  let idl = null;

  for (const p of idlPaths) {
    if (fs.existsSync(p)) {
      try {
        idl = JSON.parse(fs.readFileSync(p, 'utf-8'));
        break;
      } catch {
        // skip
      }
    }
  }

  if (!idl || !idl.instructions) {
    spin.fail('No IDL found. Provide path to IDL JSON.');
    process.exit(1);
  }

  const result = simulateFuzz(idl.instructions, iterations);
  spin.stop();

  console.log(header('Fuzz Results'));
  console.log('');
  console.log(`  Iterations:  ${chalk.bold(result.iterations)}`);
  console.log(`  Passed:      ${chalk.green.bold(result.passed)}`);
  console.log(`  Crashes:     ${result.crashes > 0 ? chalk.red.bold(result.crashes) : chalk.green('0')}`);
  console.log(`  Timeouts:    ${result.timeouts > 0 ? chalk.yellow.bold(result.timeouts) : chalk.green('0')}`);
  console.log(`  Findings:    ${result.findings.length > 0 ? chalk.red.bold(result.findings.length) : chalk.green('0')}`);
  console.log(divider());

  for (const f of result.findings.slice(0, 10)) {
    const badge = f.type === 'crash' ? failBadge()
      : f.type === 'timeout' ? warnBadge()
      : chalk.bgMagenta.white(' INVARIANT ');
    console.log(`  ${badge} iter ${chalk.gray(f.iteration)}: ${f.message}`);
  }

  if (result.findings.length > 10) {
    console.log(chalk.gray(`  ... and ${result.findings.length - 10} more`));
  }

  console.log('');
  if (result.crashes === 0 && result.findings.length === 0) {
    console.log(`  ${passBadge()} ${chalk.green('No crashes or invariant violations detected')}`);
  } else {
    console.log(`  ${failBadge()} ${chalk.red(`${result.crashes} crash(es), ${result.findings.length} finding(s)`)}`);
  }
  console.log(divider());
}
