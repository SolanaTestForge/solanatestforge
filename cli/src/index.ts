#!/usr/bin/env node

/// SolanaTestForge CLI — test framework with forked state
/// and built-in security checks for Solana programs.

import { Command } from 'commander';
import { forkCommand } from './commands/fork';
import { testCommand } from './commands/test';
import { securityCommand } from './commands/security';
import { fuzzCommand } from './commands/fuzz';

const cli = new Command();

cli
  .name('solforge')
  .version('0.1.0')
  .description('Solana test framework with forked state, security checks, and fuzzing');

cli
  .command('init')
  .description('scaffold a new test project')
  .action(() => {
    console.log('solforge init — scaffold coming soon');
  });

cli
  .command('fork <network> <programId>')
  .option('-s, --slot <slot>', 'fork at specific slot')
  .description('fork devnet/mainnet state for local testing')
  .action(forkCommand);

cli
  .command('test')
  .option('-f, --file <path>', 'test file to run')
  .description('run tests on forked state')
  .action(testCommand);

cli
  .command('security <programId>')
  .description('run security checks against a program IDL')
  .action(securityCommand);

cli
  .command('fuzz <programId>')
  .option('-n, --iterations <n>', 'number of fuzz iterations', '1000')
  .description('fuzz test a program with random inputs')
  .action(fuzzCommand);

cli.parse();
