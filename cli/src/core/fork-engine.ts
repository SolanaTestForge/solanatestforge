import * as fs from 'fs'
import * as path from 'path'

export interface AccountSnapshot {
  pubkey: string
  lamports: number
  dataLen: number
  owner: string
  data: string
}

export interface ForkResult {
  network: string
  slot: number
  programId: string
  accounts: AccountSnapshot[]
  timestamp: string
}

export async function forkState(
  programId: string,
  rpcUrl: string,
  targetSlot?: number
): Promise<ForkResult> {
  if (targetSlot !== undefined) {
    console.warn('[fork] historical forking not yet supported, using latest slot')
  }

  const body: Record<string, unknown> = {
    jsonrpc: '2.0',
    id: 1,
    method: 'getProgramAccounts',
    params: [
      programId,
      { encoding: 'base64' },
    ],
  }

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const json = await res.json() as { result?: Array<{ pubkey: string; account: { lamports: number; data: string[]; owner: string } }>; error?: { message: string } }

  if (json.error) {
    throw new Error(`RPC error: ${json.error.message}`)
  }

  const accounts: AccountSnapshot[] = (json.result || []).map((acc) => ({
    pubkey: acc.pubkey,
    lamports: acc.account.lamports,
    dataLen: acc.account.data[0] ? Buffer.from(acc.account.data[0], 'base64').length : 0,
    owner: acc.account.owner,
    data: acc.account.data[0] || '',
  }))

  // get current slot
  const slotRes = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'getSlot' }),
  })
  const slotJson = await slotRes.json() as { result?: number }
  const slot = targetSlot || slotJson.result || 0

  return {
    network: rpcUrl.includes('devnet') ? 'devnet' : 'mainnet',
    slot,
    programId,
    accounts,
    timestamp: new Date().toISOString(),
  }
}

export function saveSnapshot(result: ForkResult, outDir: string): string {
  const filename = `fork_${result.programId.slice(0, 8)}_${result.slot}.json`
  const filepath = path.join(outDir, filename)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2))
  return filepath
}
