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

export function createBox(title: string, content: string[]): string[] {
  const maxLength = Math.max(
    title.length,
    ...content.map(line => line.length),
  );

  const horizontalLine = colors.dim('─'.repeat(maxLength + 4));
  const result = [
    horizontalLine,
    `${colors.dim('│')} ${colors.header(title.padEnd(maxLength))} ${colors.dim('│')}`,
    horizontalLine,
    ...content.map(line => `${colors.dim('│')} ${line.padEnd(maxLength)} ${colors.dim('│')}`),
    horizontalLine,
  ];

  return result;
}

export function createSection(title: string, content: string[]): string[] {
  return [
    colors.subheader(`\n${title}`),
    colors.dim('─'.repeat(title.length)),
    ...content.map(line => `  ${line}`),
  ];
}

export function formatMetric(label: string, value: number | string, description?: string): string {
  const formattedValue = typeof value === 'number'
    ? colors.highlight(value.toString())
    : colors.value(value.toString());

  return description
    ? `${colors.label(label)}: ${formattedValue} ${colors.dim(`(${description})`)}`
    : `${colors.label(label)}: ${formattedValue}`;
}

export function formatList(items: string[], indent: number = 2): string[] {
  return items.map(item => `${' '.repeat(indent)}${colors.dim(symbols.bullet)} ${item}`);
}

export function formatCommand(command: string, description?: string): string {
  return description
    ? `${colors.command(command)} ${colors.dim(symbols.arrow)} ${colors.dim(description)}`
    : colors.command(command);
}

export function formatPath(path: string): string {
  return colors.link(path);
}

export function formatTree(items: { label: string; children?: string[] }[]): string[] {
  const result: string[] = [];

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const prefix = isLast ? symbols.corner : symbols.branch;

    result.push(`${colors.dim(prefix)} ${item.label}`);

    if (item.children) {
      const childPrefix = isLast ? ' ' : colors.dim(symbols.vertical);
      item.children.forEach(child => {
        result.push(`${childPrefix}   ${colors.dim(symbols.bullet)} ${child}`);
      });
    }
  });

  return result;
}
