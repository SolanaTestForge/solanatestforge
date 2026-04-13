/// Security Checker — analyzes Anchor IDL for common
/// vulnerability patterns in Solana programs.

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { runSecurityChecks, formatReport } from '../core/security-checker';
import { spinner } from '../core/output';

export async function securityCommand(programId: string) {
  const spin = spinner(`Running security checks on ${programId}`);

  // try to find IDL in common locations
  const idlPaths = [
    path.join('target', 'idl', `${programId}.json`),
    path.join('idl', `${programId}.json`),
    programId, // allow direct path to IDL file
  ];

  let idl = null;
  let idlPath = '';

  for (const p of idlPaths) {
    if (fs.existsSync(p)) {
      try {
        idl = JSON.parse(fs.readFileSync(p, 'utf-8'));
        idlPath = p;
        break;
      } catch {
        // skip invalid JSON
      }
    }
  }

  if (!idl) {
    spin.fail('No IDL found');
    console.log(chalk.gray(`Searched: ${idlPaths.join(', ')}`));
    console.log(`\nUsage: ${chalk.bold('solforge security <path-to-idl.json>')}`);
    console.log(`       ${chalk.bold('solforge security <program-name>')}  (from anchor project)`);
    return;
  }

  spin.succeed(`IDL loaded: ${idlPath}`);
  console.log(chalk.gray(`  Program: ${idl.name || programId} | Instructions: ${idl.instructions?.length || 0}`));

  const issues = runSecurityChecks(idl);
  const report = formatReport(issues, idl.name || programId);
  console.log(report);

  if (issues.length === 0) {
    console.log(chalk.green.bold('\n  All clear — no security issues detected!'));
  } else {
    const critCount = issues.filter((i: any) => i.severity === 'critical').length;
    if (critCount > 0) {
      console.log(chalk.red.bold(`\n  ${critCount} CRITICAL issue(s) require immediate attention.`));
    }
  }
}
