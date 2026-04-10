/// Fork Engine CLI wrapper — creates local snapshot
/// of program accounts from devnet or mainnet.

import chalk from 'chalk';
import { forkState, saveSnapshot } from '../core/fork-engine';
import { spinner } from '../core/output';

interface ForkOpts {
  slot?: string;
}

export async function forkCommand(network: string, programId: string, opts: ForkOpts) {
  const validNetworks = ['devnet', 'mainnet'];
  if (!validNetworks.includes(network)) {
    console.error(chalk.red(`Invalid network: ${network}. Use devnet or mainnet.`));
    process.exit(1);
  }

  const rpcUrl = network === 'mainnet'
    ? process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
    : process.env.DEVNET_RPC_URL || 'https://api.devnet.solana.com';

  const slot = opts.slot ? parseInt(opts.slot, 10) : undefined;
  const spin = spinner(`Forking ${programId} on ${network}${slot ? ` at slot ${slot}` : ''}`);

  try {
    const result = await forkState(programId, rpcUrl, slot);
    const filepath = saveSnapshot(result, '.solforge');
    spin.succeed(chalk.green(`Forked ${result.accounts.length} accounts at slot ${result.slot}`));
    console.log(chalk.gray(`  Snapshot: ${filepath}`));
  } catch (e) {
    spin.fail(chalk.red(`Fork failed: ${e instanceof Error ? e.message : e}`));
    process.exit(1);
  }
}
