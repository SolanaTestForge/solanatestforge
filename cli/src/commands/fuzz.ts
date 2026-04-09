/// Fuzzer CLI wrapper — generates random instruction
/// inputs and simulates execution for crash detection.

import * as fs from 'fs';
import * as path from 'path';
import { simulateFuzz } from '../core/fuzzer';

interface FuzzOpts {
  iterations: string;
}

export async function fuzzCommand(programId: string, opts: FuzzOpts) {
  const iterations = parseInt(opts.iterations, 10) || 1000;

  console.log(`Fuzzing ${programId} with ${iterations} iterations...\n`);

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
    console.error('No IDL found. Provide path to IDL JSON.');
    process.exit(1);
  }

  const result = simulateFuzz(idl.instructions, iterations);

  console.log('Fuzz Results:');
  console.log('═'.repeat(50));
  console.log(`Iterations:  ${result.iterations}`);
  console.log(`Passed:      ${result.passed}`);
  console.log(`Crashes:     ${result.crashes}`);
  console.log(`Timeouts:    ${result.timeouts}`);
  console.log(`Findings:    ${result.findings.length}`);
  console.log('─'.repeat(50));

  for (const f of result.findings.slice(0, 10)) {
    const tag = f.type === 'crash' ? 'CRASH' : f.type === 'timeout' ? 'TIMEOUT' : 'INVARIANT';
    console.log(`[${tag}] iter ${f.iteration}: ${f.message}`);
  }

  if (result.findings.length > 10) {
    console.log(`... and ${result.findings.length - 10} more`);
  }

  console.log('═'.repeat(50));
}
