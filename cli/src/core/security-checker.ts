export interface SecurityIssue {
  rule: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  instruction?: string
  account?: string
}

interface IdlAccount {
  name: string
  isMut?: boolean
  isSigner?: boolean
}

interface IdlInstruction {
  name: string
  accounts: IdlAccount[]
  args: Array<{ name: string; type: unknown }>
}

interface AnchorIdl {
  name: string
  instructions: IdlInstruction[]
  accounts?: Array<{ name: string; type: { fields: Array<{ name: string; type: unknown }> } }>
  errors?: Array<{ code: number; name: string; msg: string }>
}

const AUTHORITY_KEYWORDS = ['authority', 'admin', 'owner', 'signer', 'creator']
const MUT_KEYWORDS = ['vault', 'treasury', 'pool', 'config', 'state']

export function runSecurityChecks(idl: AnchorIdl): SecurityIssue[] {
  const issues: SecurityIssue[] = []

  for (const ix of idl.instructions) {
    // 1. missing-signer: authority accounts without isSigner
    for (const acc of ix.accounts) {
      const isAuthName = AUTHORITY_KEYWORDS.some((k) => acc.name.toLowerCase().includes(k))
      if (isAuthName && !acc.isSigner) {
        issues.push({
          rule: 'missing-signer',
          severity: 'critical',
          message: `Account "${acc.name}" looks like an authority but is not a signer`,
          instruction: ix.name,
          account: acc.name,
        })
      }
    }

    // 2. unchecked-owner: mutable accounts that could be spoofed
    for (const acc of ix.accounts) {
      const isSensitive = MUT_KEYWORDS.some((k) => acc.name.toLowerCase().includes(k))
      if (isSensitive && acc.isMut && !acc.isSigner) {
        issues.push({
          rule: 'unchecked-owner',
          severity: 'high',
          message: `Mutable sensitive account "${acc.name}" — verify ownership constraints exist`,
          instruction: ix.name,
          account: acc.name,
        })
      }
    }

    // 3. arithmetic-overflow: check if program has custom error codes for overflow
    // (heuristic: if no overflow error defined, flag it)

    // 4. no-close-account: init instructions without corresponding close
    const isInit = ix.name.startsWith('initialize') || ix.name.startsWith('create') || ix.name.startsWith('init')
    if (isInit) {
      const hasSystemProgram = ix.accounts.some((a) => a.name === 'systemProgram' || a.name === 'system_program')
      if (!hasSystemProgram) {
        issues.push({
          rule: 'reinitialization',
          severity: 'medium',
          message: `Init instruction "${ix.name}" missing system_program — verify PDA init constraints`,
          instruction: ix.name,
        })
      }
    }

    // 5. cpi-authority: CPI calls without proper program checks
    const hasCpiProgram = ix.accounts.some(
      (a) => a.name.includes('program') && a.name !== 'systemProgram' && a.name !== 'system_program'
    )
    if (hasCpiProgram) {
      issues.push({
        rule: 'cpi-authority',
        severity: 'medium',
        message: `Instruction "${ix.name}" has external program account — verify program address constraint`,
        instruction: ix.name,
      })
    }
  }

  // 6. arithmetic-overflow: global check for error codes
  const hasOverflowError = idl.errors?.some(
    (e) => e.name.toLowerCase().includes('overflow') || e.msg.toLowerCase().includes('overflow')
  )
  if (!hasOverflowError) {
    issues.push({
      rule: 'arithmetic-overflow',
      severity: 'high',
      message: 'No overflow error code defined — program may not use checked math',
    })
  }

  // 7. rent-exemption: check for close patterns
  const hasCloseInstruction = idl.instructions.some(
    (ix) => ix.name.includes('close') || ix.name.includes('delete') || ix.name.includes('remove')
  )
  if (!hasCloseInstruction && idl.instructions.length > 3) {
    issues.push({
      rule: 'rent-exemption',
      severity: 'low',
      message: 'No close/delete instruction found — accounts may leak rent forever',
    })
  }

  return issues
}

export function formatReport(issues: SecurityIssue[], programName: string): string {
  const lines: string[] = [
    `\nSecurity Report: ${programName}`,
    '═'.repeat(60),
    `Total issues: ${issues.length}`,
    `  Critical: ${issues.filter((i) => i.severity === 'critical').length}`,
    `  High:     ${issues.filter((i) => i.severity === 'high').length}`,
    `  Medium:   ${issues.filter((i) => i.severity === 'medium').length}`,
    `  Low:      ${issues.filter((i) => i.severity === 'low').length}`,
    '─'.repeat(60),
  ]

  for (const issue of issues) {
    const sev = issue.severity.toUpperCase().padEnd(8)
    lines.push(`[${sev}] ${issue.rule}`)
    lines.push(`  ${issue.message}`)
    if (issue.instruction) lines.push(`  instruction: ${issue.instruction}`)
    if (issue.account) lines.push(`  account: ${issue.account}`)
    lines.push('')
  }

  lines.push('═'.repeat(60))
  return lines.join('\n')
}
