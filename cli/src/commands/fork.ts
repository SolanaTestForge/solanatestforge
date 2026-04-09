/// Fork Engine CLI wrapper — creates local snapshot
/// of program accounts from devnet or mainnet.

import { forkState, saveSnapshot } from '../core/fork-engine';

interface ForkOpts {
  slot?: string;
}

export async function forkCommand(network: string, opts: ForkOpts) {
  const validNetworks = ['devnet', 'mainnet'];
  if (!validNetworks.includes(network)) {
    console.error(`Invalid network: ${network}. Use devnet or mainnet.`);
    process.exit(1);
  }

  const rpcUrl = network === 'mainnet'
    ? process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
    : process.env.DEVNET_RPC_URL || 'https://api.devnet.solana.com';

  const slot = opts.slot ? parseInt(opts.slot, 10) : undefined;
  console.log(`Forking ${network}${slot ? ` at slot ${slot}` : ' (latest)'}...`);

  // for now, fork requires a programId — use env or default
  const programId = process.env.PROGRAM_ID;
  if (!programId) {
    console.error('Set PROGRAM_ID env var to fork a specific program');
    process.exit(1);
  }

  try {
    const result = await forkState(programId, rpcUrl, slot);
    const filepath = saveSnapshot(result, '.solforge');
    console.log(`Forked ${result.accounts.length} accounts at slot ${result.slot}`);
    console.log(`Snapshot saved: ${filepath}`);
  } catch (e) {
    console.error(`Fork failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
}
