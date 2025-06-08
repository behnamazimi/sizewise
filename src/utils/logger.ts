import chalk from 'chalk';
import type { SizewiseConfig } from '../types';
import { handleError } from './errors';

/**
 * Enhanced logger that respects the verbose configuration
 */
export class Logger {
  private log: (...args: unknown[]) => void;
  private error: (...args: unknown[]) => void;
  private warn: (...args: unknown[]) => void;

  constructor(config: SizewiseConfig) {
    const isVerbose = config.logging?.verbose ?? true;

    // Always log errors and warnings, but only log info if verbose is enabled
    this.error = console.error.bind(console);
    this.warn = console.warn.bind(console);
    this.log = isVerbose ? console.log.bind(console) : () => {};
  }

  /**
   * Log info messages (respects verbose setting)
   */
  info(...args: unknown[]): void {
    this.log(...args);
  }

  /**
   * Log success messages (respects verbose setting)
   */
  success(...args: unknown[]): void {
    this.log(chalk.green('✅'), ...args);
  }

  /**
   * Log warning messages (always shown)
   */
  warning(...args: unknown[]): void {
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
      chalk.red(message),
    );
  }

  /**
   * Log a blank line
   */
  blank(): void {
    this.log('');
  }

  /**
   * Log a section header
   */
  header(text: string): void {
    this.blank();
    this.log(chalk.bold(text));
    this.log(chalk.dim('─'.repeat(text.length)));
  }

  /**
   * Log a subheader
   */
  subheader(text: string): void {
    this.blank();
    this.log(chalk.bold(text));
    this.log(chalk.dim('─'.repeat(20)));
  }

  /**
   * Log a JSON object
   */
  json(data: unknown): void {
    this.log(JSON.stringify(data, null, 2));
  }

  /**
   * Log a dimmed message
   */
  dim(...args: unknown[]): void {
    this.log(chalk.dim(...args));
  }
}

/**
 * Create a logger instance for the given configuration
 */
export function createLogger(config: SizewiseConfig): Logger {
  return new Logger(config);
}

/**
 * Create a logger instance with default configuration
 */
export function createDefaultLogger(): Logger {
  return new Logger({
    thresholds: {
      small: {
        files: 5,
        lines: 50,
        directories: 2,
      },
      medium: {
        files: 10,
        lines: 200,
        directories: 4,
      },
      large: {
        files: 20,
        lines: 500,
        directories: 8,
      },
    },
    excludePatterns: [],
    logging: { verbose: true },
  });
}
