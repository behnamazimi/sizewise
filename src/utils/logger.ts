import chalk from 'chalk';
import type { SizewiseConfig } from '../types';
import { SizeWiseError, handleError } from './errors';

/**
 * Logger levels
 */
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

/**
 * Enhanced logger that respects the verbose configuration
 */
export class Logger {
  private log: (...args: any[]) => void;
  private error: (...args: any[]) => void;
  private warn: (...args: any[]) => void;

  constructor(config: SizewiseConfig) {
    const isVerbose = config.logging?.verbose ?? true;

    // Always log errors and warnings, but only log info and debug if verbose is enabled
    this.error = console.error.bind(console);
    this.warn = console.warn.bind(console);
    this.log = isVerbose ? console.log.bind(console) : () => {};
  }

  /**
   * Log info messages (respects verbose setting)
   */
  info(...args: any[]): void {
    this.log(chalk.blue('ℹ'), ...args);
  }

  /**
   * Log warning messages (always shown)
   */
  warning(...args: any[]): void {
    this.warn(chalk.yellow('⚠'), ...args);
  }

  /**
   * Log error messages with proper formatting and error codes
   */
  logError(context: string, error: unknown): void {
    const { message, code } = handleError(error);
    this.error(
      chalk.red('❌'),
      chalk.red(context),
      chalk.dim(`[${code}]`),
      '\n',
      chalk.red(message)
    );
  }
}

/**
 * Create a logger instance for the given configuration
 */
export function createLogger(config: SizewiseConfig): Logger {
  return new Logger(config);
}
