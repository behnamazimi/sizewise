#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { setupAnalyzeCommand, setupInitCommand } from './cli/commands';
import { handleError } from './utils/errors';

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
  console.error(chalk.red('❌ Invalid command'));
  console.error(chalk.dim('See --help for a list of available commands.'));
  process.exit(1);
});

// Main execution
async function main() {
  await program.parseAsync(process.argv);
}

main().catch(error => {
  const { message, code } = handleError(error);
  console.error(chalk.red('❌ Error:'), chalk.dim(`[${code}]`));
  console.error(chalk.red(message));
  process.exit(1);
});

export { main as runUniversalCli };
