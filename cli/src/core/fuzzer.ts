import * as crypto from 'crypto'

export interface FuzzResult {
  iterations: number
  crashes: number
  timeouts: number
  passed: number
  findings: FuzzFinding[]
}

export interface FuzzFinding {
  iteration: number
  type: 'crash' | 'timeout' | 'invariant'
  input: string
  message: string
}

interface IdlInstruction {
  name: string
  args: Array<{ name: string; type: unknown }>
}

function randomBytes(len: number): Buffer {
  return crypto.randomBytes(len)
}

function randomU64(): bigint {
  return crypto.randomBytes(8).readBigUInt64LE()
}

function generateRandomArg(argType: unknown): unknown {
  if (typeof argType === 'string') {
    switch (argType) {
      case 'u8': return Math.floor(Math.random() * 256)
      case 'u16': return Math.floor(Math.random() * 65536)
      case 'u32': return Math.floor(Math.random() * 4294967296)
      case 'u64': return randomU64().toString()
      case 'i8': return Math.floor(Math.random() * 256) - 128
      case 'i16': return Math.floor(Math.random() * 65536) - 32768
      case 'i64': return (randomU64() - BigInt('9223372036854775808')).toString()
      case 'bool': return Math.random() > 0.5
      case 'string': return randomBytes(Math.floor(Math.random() * 64)).toString('hex')
      case 'publicKey': return randomBytes(32).toString('hex')
      default: return randomBytes(8).toString('hex')
    }
  }
  return randomBytes(8).toString('hex')
}

export function generateFuzzInputs(
  instructions: IdlInstruction[],
  iterations: number
): Array<{ instruction: string; args: Record<string, unknown> }> {
  const inputs: Array<{ instruction: string; args: Record<string, unknown> }> = []

  for (let i = 0; i < iterations; i++) {
    const ix = instructions[Math.floor(Math.random() * instructions.length)]
    const args: Record<string, unknown> = {}

    for (const arg of ix.args) {
      args[arg.name] = generateRandomArg(arg.type)
    }

    // edge cases: inject boundary values ~10% of the time
    if (Math.random() < 0.1) {
      const argNames = Object.keys(args)
      if (argNames.length > 0) {
        const target = argNames[Math.floor(Math.random() * argNames.length)]
        const edgeCases = [0, 1, 255, 65535, '18446744073709551615', -1, '']
        args[target] = edgeCases[Math.floor(Math.random() * edgeCases.length)]
      }
    }

    inputs.push({ instruction: ix.name, args })
  }

  return inputs
}

export function simulateFuzz(
  instructions: IdlInstruction[],
  iterations: number
): FuzzResult {
  const inputs = generateFuzzInputs(instructions, iterations)
  const findings: FuzzFinding[] = []
  let crashedIterations = 0
  let timeouts = 0

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    let iterCrashed = false

    // simulate: boundary values often cause issues
    for (const [key, val] of Object.entries(input.args)) {
      if (val === 0 || val === '0') {
        findings.push({
          iteration: i,
          type: 'invariant',
          input: JSON.stringify(input),
          message: `Zero value for "${key}" in ${input.instruction} — check division by zero`,
        })
      }
      if (val === '18446744073709551615' || val === 65535 || val === 255) {
        findings.push({
          iteration: i,
          type: 'crash',
          input: JSON.stringify(input),
          message: `Max value for "${key}" in ${input.instruction} — check overflow`,
        })
        iterCrashed = true
      }
      if (val === -1) {
        findings.push({
          iteration: i,
          type: 'crash',
          input: JSON.stringify(input),
          message: `Negative value for "${key}" in ${input.instruction} — check underflow`,
        })
        iterCrashed = true
      }
    }

    if (iterCrashed) crashedIterations++
  }

  return {
    iterations,
    crashes: crashedIterations,
    timeouts,
    passed: iterations - crashedIterations - timeouts,
    findings: findings.slice(0, 50), // cap at 50 findings
  }
}
