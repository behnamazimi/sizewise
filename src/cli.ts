#!/usr/bin/env node

import { Command } from 'commander';
import { setupAnalyzeCommand, setupInitCommand } from './cli/commands';
import { handleError } from './utils/errors';
import { createDefaultLogger } from './utils/logger';

const logger = createDefaultLogger();
const program = new Command();

program
  .name('sizewise')
  .description('A platform-agnostic pull/merge request size analyzer')
  .version(process.env.npm_package_version || '1.0.0');

// Setup commands
setupAnalyzeCommand(program);
setupInitCommand(program);

// Error handling for unknown commands
program.on('command:*', () => {
  logger.logError('Invalid command', new Error('See --help for a list of available commands.'));
  process.exit(1);
});

// Main execution
async function main() {
  await program.parseAsync(process.argv);
}

main().catch(error => {
  logger.logError('Error', error);
  process.exit(1);
});

export { main as runUniversalCli };
