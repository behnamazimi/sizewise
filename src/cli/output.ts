import type { CliJsonOutput, AnalysisResult, SizeThresholds } from '../types';
import { colors, symbols, formatMetric, formatList } from './style';
import chalk from 'chalk';
import { handleError } from '../utils/errors';

const packageJson = require('../../package.json');

/**
 * Get color and symbol for a size based on its position in the threshold list
 */
function getSizeFormatting(size: string, thresholds: Record<string, any>): { color: (text: string) => string; symbol: string } {
  const thresholdKeys = Object.keys(thresholds);
  const position = thresholdKeys.indexOf(size.toLowerCase());

  if (position === -1) {
    return { color: colors.value, symbol: symbols.info };
  }

  const ratio = position / (thresholdKeys.length - 1); // 0 to 1

  if (position === 0) {
    return { color: colors.severity.lowest, symbol: symbols.success };
  } else if (ratio <= 0.25) {
    return { color: colors.severity.low, symbol: symbols.success };
  } else if (ratio <= 0.5) {
    return { color: colors.severity.medium, symbol: symbols.info };
  } else if (ratio <= 0.75) {
    return { color: colors.severity.high, symbol: symbols.warning };
  } else {
    return { color: colors.severity.highest, symbol: symbols.error };
  }
}

/**
 * Formats output for JSON display
 */
export function formatJsonOutput(
  result: AnalysisResult | null,
  success: boolean,
  platform?: string,
  error?: string,
): Record<string, unknown> {
  return {
    success,
    data: result,
    error,
    platform,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  };
}

/**
 * Display analysis results in console format
 */
export function displayConsoleOutput(
  result: AnalysisResult,
  platform: string,
  verbose: boolean,
): void {
  const { metrics, size, details } = result;

  // Header
  console.log('');
  console.log(chalk.bold('📊 Pull Request Analysis'));
  console.log(chalk.dim('─'.repeat(30)));

  // Platform
  console.log(chalk.gray(`Platform: ${platform.toUpperCase()}`));

  // Size classification
  console.log('');
  console.log('Size Classification:', getSizeColor(size)(size.toUpperCase()));

  // Metrics
  console.log('');
  console.log(chalk.bold('Metrics:'));
  console.log(chalk.dim('─'.repeat(20)));

  for (const detail of details) {
    console.log(chalk.gray('•'), detail);
  }

  // Verbose output
  if (verbose) {
    console.log('');
    console.log(chalk.bold('Thresholds:'));
    console.log(chalk.dim('─'.repeat(20)));

    for (const [category, threshold] of Object.entries(result.thresholds)) {
      console.log(chalk.gray(`${category}:`));
      console.log(chalk.gray('  Files:'), threshold.files);
      console.log(chalk.gray('  Lines:'), threshold.lines);
      console.log(chalk.gray('  Directories:'), threshold.directories);
    }
  }

  console.log('');
}

/**
 * Display error message in appropriate format
 */
export function displayError(error: unknown, isJson: boolean, platform?: string): void {
  const { message, code } = handleError(error);
  
  if (isJson) {
    console.log(JSON.stringify(formatJsonOutput(null, false, platform, message), null, 2));
  } else {
    console.error(chalk.red('❌ Error:'), chalk.dim(`[${code}]`));
    console.error(chalk.red(message));
  }
}

/**
 * Check and display size warning
 */
export function checkAndDisplaySizeWarning(
  result: AnalysisResult,
  thresholds: Record<string, SizeThresholds>,
  platform: string,
  isJson: boolean,
): boolean {
  const thresholdKeys = Object.keys(thresholds);
  const largestThreshold = thresholdKeys[thresholdKeys.length - 1];

  if (result.size === largestThreshold) {
    const message = `This ${platform === 'github' ? 'pull' : 'merge'} request is ${result.size.toLowerCase()}! Consider breaking it down into smaller chunks.`;
    
    if (isJson) {
      console.log(JSON.stringify({ warning: message }, null, 2));
    } else {
      console.log('');
      console.log(chalk.yellow('⚠️  Warning:'), message);
      console.log('');
    }
    return true;
  }

  return false;
}

/**
 * Get chalk color function based on size
 */
function getSizeColor(size: string): (text: string) => string {
  switch (size.toLowerCase()) {
    case 'small':
      return chalk.green;
    case 'medium':
      return chalk.yellow;
    case 'large':
      return chalk.red;
    default:
      return chalk.white;
  }
}
