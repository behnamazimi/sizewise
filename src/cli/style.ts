import chalk from 'chalk';

export const symbols = {
  success: '✓',
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
  arrow: '→',
  bullet: '•',
  line: '─',
  corner: '└',
  branch: '├',
  vertical: '│',
} as const;

export const colors = {
  // Severity-based colors for dynamic thresholds
  severity: {
    lowest: chalk.green,    // For the smallest threshold
    low: chalk.cyan,        // For thresholds near the start
    medium: chalk.yellow,   // For middle thresholds
    high: chalk.magenta,    // For thresholds near the end
    highest: chalk.red,     // For the largest threshold
  },
  // Status colors
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  // UI elements
  header: chalk.bold.blue,
  subheader: chalk.bold.cyan,
  label: chalk.gray,
  value: chalk.white,
  dim: chalk.dim,
  highlight: chalk.bold.yellow,
  link: chalk.underline.cyan,
  command: chalk.bold.green,
} as const;
