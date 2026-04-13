/// Colored output helpers for SolanaTestForge CLI.
/// Uses chalk for terminal colors and ora for spinners.

import chalk from 'chalk'

export const SEVERITY_COLORS: Record<string, (s: string) => string> = {
  critical: chalk.bgRed.white.bold,
  high: chalk.red.bold,
  medium: chalk.yellow,
  low: chalk.cyan,
}

export function severityBadge(severity: string): string {
  const colorFn = SEVERITY_COLORS[severity] || chalk.gray
  return colorFn(` ${severity.toUpperCase()} `)
}

export function passBadge(): string {
  return chalk.bgGreen.black(' PASS ')
}

export function failBadge(): string {
  return chalk.bgRed.white(' FAIL ')
}

export function warnBadge(): string {
  return chalk.bgYellow.black(' WARN ')
}

export function header(text: string): string {
  return chalk.bold.white(`\n${'═'.repeat(60)}\n  ${text}\n${'═'.repeat(60)}`)
}

export function divider(): string {
  return chalk.gray('─'.repeat(60))
}

export function resultTable(rows: Array<{ label: string; status: 'pass' | 'fail' | 'warn'; detail?: string }>): string {
  const lines: string[] = []
  const maxLabel = Math.max(...rows.map(r => r.label.length), 20)

  for (const row of rows) {
    const badge = row.status === 'pass' ? passBadge()
      : row.status === 'fail' ? failBadge()
      : warnBadge()
    const label = row.label.padEnd(maxLabel)
    const detail = row.detail ? chalk.gray(` — ${row.detail}`) : ''
    lines.push(`  ${badge} ${label}${detail}`)
  }

  return lines.join('\n')
}

export function summary(total: number, passed: number, failed: number, warnings: number): string {
  const lines = [divider()]

  if (failed > 0) {
    lines.push(chalk.red.bold(`  ${failed} failed`) + chalk.gray(`, ${passed} passed, ${total} total`))
  } else if (warnings > 0) {
    lines.push(chalk.yellow.bold(`  ${warnings} warnings`) + chalk.gray(`, ${passed} passed, ${total} total`))
  } else {
    lines.push(chalk.green.bold(`  All ${total} checks passed!`))
  }

  return lines.join('\n')
}

export function spinner(text: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const oraModule = require('ora')
  const ora = oraModule.default || oraModule
  return ora({ text, spinner: 'dots' }).start()
}
