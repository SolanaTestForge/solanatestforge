/// Security Checker — analyzes Anchor IDL for common
/// vulnerability patterns in Solana programs.

import * as fs from 'fs';
import * as path from 'path';
import { runSecurityChecks, formatReport } from '../core/security-checker';

export async function securityCommand(programId: string) {
  console.log(`Running security checks on ${programId}...\n`);

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
    console.log('No IDL found. Provide path to IDL JSON or run from Anchor project root.');
    console.log(`Searched: ${idlPaths.join(', ')}`);
    console.log('\nUsage: solforge security <path-to-idl.json>');
    console.log('       solforge security <program-name>  (from anchor project)');
    return;
  }

  console.log(`IDL loaded: ${idlPath}`);
  console.log(`Program: ${idl.name || programId}`);
  console.log(`Instructions: ${idl.instructions?.length || 0}`);

  const issues = runSecurityChecks(idl);
  const report = formatReport(issues, idl.name || programId);
  console.log(report);

  if (issues.length === 0) {
    console.log('\nNo issues found — program looks clean!');
  } else {
    const critCount = issues.filter((i) => i.severity === 'critical').length;
    if (critCount > 0) {
      console.log(`\n${critCount} CRITICAL issue(s) require immediate attention.`);
    }
  }
}
