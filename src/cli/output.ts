import type { AnalysisResult, SizeThresholds } from '../types';
import chalk from 'chalk';
import { handleError } from '../utils/errors';
import { createDefaultLogger } from '../utils/logger';

const logger = createDefaultLogger();

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
  const { size, details } = result;

  // Header
  logger.header('📊 Pull Request Analysis');

  // Platform
  logger.info(`Platform: ${platform.toUpperCase()}`);

  // Size classification
  logger.blank();
  logger.info('Size Classification:', size.toUpperCase());

  // Metrics
  logger.subheader('Metrics');

  for (const detail of details) {
    logger.dim('•', detail);
  }

  // Verbose output
  if (verbose) {
    logger.subheader('Thresholds');

    for (const [category, threshold] of Object.entries(result.thresholds)) {
      logger.dim(`${category}:`);
      logger.dim('  Files:', threshold.files);
      logger.dim('  Lines:', threshold.lines);
      logger.dim('  Directories:', threshold.directories);
    }
  }

  logger.blank();
}

/**
 * Display error message in appropriate format
 */
export function displayError(error: unknown, isJson: boolean, platform?: string): void {
  const { message, code } = handleError(error);
  
  if (isJson) {
    logger.json(formatJsonOutput(null, false, platform, message));
  } else {
    logger.logError('Error', error);
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
      logger.json({ warning: message });
    } else {
      logger.blank();
      logger.warning(message);
      logger.blank();
    }
    return true;
  }

  return false;
}
