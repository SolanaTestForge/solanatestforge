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
    const KNOWN_PROGRAMS = ['systemProgram', 'system_program', 'tokenProgram', 'token_program', 'associatedTokenProgram', 'rent']
    const hasCpiProgram = ix.accounts.some(
      (a) => a.name.includes('program') && !KNOWN_PROGRAMS.includes(a.name)
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
    (e) => e.name.toLowerCase().includes('overflow') || (e.msg && e.msg.toLowerCase().includes('overflow'))
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
  const chalkMod = require('chalk')
  const chalk = chalkMod.default || chalkMod
  const { severityBadge, header, divider, resultTable, summary } = require('./output')

  const lines: string[] = [header(`Security Report: ${programName}`)]

  const critCount = issues.filter((i) => i.severity === 'critical').length
  const highCount = issues.filter((i) => i.severity === 'high').length
  const medCount = issues.filter((i) => i.severity === 'medium').length
  const lowCount = issues.filter((i) => i.severity === 'low').length

  lines.push('')
  lines.push(`  ${chalk.red.bold(critCount)} critical  ${chalk.red(highCount)} high  ${chalk.yellow(medCount)} medium  ${chalk.cyan(lowCount)} low`)
  lines.push(divider())

  // issue details with colored severity badges
  for (const issue of issues) {
    const badge = severityBadge(issue.severity)
    lines.push(`\n  ${badge} ${chalk.bold(issue.rule)}`)
    lines.push(`  ${issue.message}`)
    if (issue.instruction) lines.push(`  ${chalk.gray('instruction:')} ${issue.instruction}`)
    if (issue.account) lines.push(`  ${chalk.gray('account:')} ${issue.account}`)
  }

  // pass/fail summary table
  const checkNames = [
    'missing-signer', 'unchecked-owner', 'arithmetic-overflow',
    'reinitialization', 'cpi-authority', 'rent-exemption',
  ]

  lines.push('')
  lines.push(divider())
  lines.push(chalk.bold('  Check Summary'))
  lines.push('')

  const rows = checkNames.map((name) => {
    const found = issues.filter((i) => i.rule === name)
    if (found.length === 0) {
      return { label: name, status: 'pass' as const }
    }
    const worst = found.some((f) => f.severity === 'critical') ? 'fail' as const : 'warn' as const
    return { label: name, status: worst, detail: `${found.length} issue(s)` }
  })

  lines.push(resultTable(rows))

  const passed = rows.filter((r) => r.status === 'pass').length
  const failed = rows.filter((r) => r.status === 'fail').length
  const warnings = rows.filter((r) => r.status === 'warn').length
  lines.push('')
  lines.push(summary(rows.length, passed, failed, warnings))

  return lines.join('\n')
}
