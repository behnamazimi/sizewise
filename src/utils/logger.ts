import type { SizewiseConfig } from '../types';

/**
 * Simple logger that respects the verbose configuration
 */
export class Logger {
  private log: (...args: any[]) => void;
  private error: (...args: any[]) => void;

  constructor(config: SizewiseConfig) {
    const isVerbose = config.logging?.verbose ?? true;

    // Always log errors, but only log info if verbose is enabled
    this.log = isVerbose ? console.log.bind(console) : () => {};
    this.error = console.error.bind(console);
  }

  /**
   * Log info messages (respects verbose setting)
   */
  info(...args: any[]): void {
    this.log(...args);
  }

  /**
   * Log error messages (always shown regardless of verbose setting)
   */
  logError(...args: any[]): void {
    this.error(...args);
  }
}

/**
 * Create a logger instance for the given configuration
 */
export function createLogger(config: SizewiseConfig): Logger {
  return new Logger(config);
}
