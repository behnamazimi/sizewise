import type { CliJsonOutput, AnalysisResult } from '../types';
import { colors, symbols, formatMetric, formatList } from './style';

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
export function formatJsonOutput(result: any, success: boolean, platform?: string, error?: string): CliJsonOutput {
  return {
    success,
    data: success ? { ...result, platform } : undefined,
    error: error || undefined,
    timestamp: new Date().toISOString(),
    version: packageJson.version,
  };
}

/**
 * Display analysis results in console format
 */
export function displayConsoleOutput(result: AnalysisResult, platform: string, verbose: boolean): void {
  const platformDisplay = platform === 'gitlab' ? 'GitLab' : 'GitHub';
  const titleText = platform === 'gitlab' ? 'Merge Request Analysis' : 'Pull Request Analysis';
  const { color: sizeColor, symbol: sizeSymbol } = getSizeFormatting(result.size, result.thresholds || {});

  // Header
  console.log('');
  console.log(colors.header(titleText));
  console.log(colors.dim('─'.repeat(titleText.length)));

  // Main info
  console.log(`${colors.label('Platform')}: ${colors.value(platformDisplay)}`);
  console.log(`${colors.label('Size')}: ${sizeColor(result.size)} ${colors.dim(sizeSymbol)}`);
  console.log(`${colors.label('Changes')}: ${colors.value(`${result.metrics.filesChanged} files, ${result.metrics.totalLines} lines`)}`);

  // Details section
  if (result.details.length > 0) {
    console.log('');
    console.log(colors.subheader('Analysis Details'));
    formatList(result.details).forEach(line => console.log(line));
  }

  // Metrics section
  if (verbose) {
    console.log('');
    console.log(colors.subheader('Detailed Metrics'));
    const metrics = [
      formatMetric('Files Changed', result.metrics.filesChanged),
      formatMetric('Lines Added', result.metrics.linesAdded, '+'),
      formatMetric('Lines Removed', result.metrics.linesRemoved, '-'),
      formatMetric('Total Lines', result.metrics.totalLines),
      formatMetric('Directories', result.metrics.directoriesAffected),
      formatMetric('New Files', result.metrics.newFiles),
      formatMetric('Deleted Files', result.metrics.deletedFiles),
      formatMetric('Renamed Files', result.metrics.renamedFiles),
    ];
    formatList(metrics).forEach(line => console.log(line));
  }

  // Footer
  console.log('');
  console.log(colors.dim(`SizeWise v${packageJson.version}`));
  console.log('');
}

/**
 * Display error message in appropriate format
 */
export function displayError(error: string, json: boolean, platform?: string): void {
  if (json) {
    console.log(JSON.stringify(formatJsonOutput(null, false, platform, error), null, 2));
  } else {
    console.log('');
    console.log(colors.error(`${symbols.error} Error: ${error}`));
    console.log('');
  }
}

/**
 * Check and display size warning
 */
export function checkAndDisplaySizeWarning(
  result: AnalysisResult,
  thresholds: Record<string, any>,
  platform: string,
  json: boolean,
): boolean {
  const { symbol } = getSizeFormatting(result.size, thresholds);
  const isWarning = symbol === symbols.warning || symbol === symbols.error;

  if (isWarning && !json) {
    console.log('');
    console.log(colors.warning(`${symbols.warning} Warning: This ${platform === 'gitlab' ? 'merge' : 'pull'} request might be too large!`));
    console.log(colors.dim('Consider breaking it down into smaller chunks for better review.'));
    console.log('');
  }

  return isWarning;
}
