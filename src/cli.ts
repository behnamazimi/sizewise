#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { setupAnalyzeCommand, setupInitCommand } from './cli/commands';

const packageJson = require('../package.json');

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const program = new Command();

  program
    .name('sizewise')
    .description('Analyze pull/merge request size and complexity across GitLab and GitHub')
    .version(packageJson.version);

  // Setup commands
  setupAnalyzeCommand(program);
  setupInitCommand(program);

  program.parse(process.argv);
}

// Run CLI
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ Error:'), error);
    process.exit(1);
  });
}

export { main as runUniversalCli };
