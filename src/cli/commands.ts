import { Command } from 'commander';
import chalk from 'chalk';
import { UniversalSizeWiseAnalyzer } from '../analyzer';
import { detectPlatform } from '../providers';
import { createConfigFile, loadConfig } from './config';
import { getRequiredValues, validateRequiredValues } from './env';
import { displayConsoleOutput, displayError, formatJsonOutput, checkAndDisplaySizeWarning } from './output';
import { runConfigWizard } from './wizard';
import type { CliOptions } from '../types';
import { ValidationError, PlatformError } from '../utils/errors';

/**
 * Setup analyze command (default)
 */
export function setupAnalyzeCommand(program: Command): void {
  program
    .option('--pr-id <id>', 'Pull/Merge request ID to analyze')
    .option('--mr-id <id>', 'Merge request ID to analyze (alias for --pr-id)')
    .option('--project-id <id>', 'Project ID (GitLab: project-id, GitHub: owner/repo)')
    .option('--token <token>', 'API token for authentication')
    .option('--host <url>', 'Platform host URL (e.g., https://gitlab.com, https://github.com)')
    .option('--platform <platform>', 'Platform to use (gitlab, github) - auto-detected if not specified')
    .option('-c, --config <path>', 'Path to configuration file')
    .option('-v, --verbose', 'Show detailed output', false)
    .option('-j, --json', 'Output results in JSON format', false)
    .option('--no-exit-code', 'Don\'t exit with error code for large PRs/MRs', false)
    .action(handleAnalyzeCommand);
}

/**
 * Setup init command
 */
export function setupInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize a configuration file through an interactive wizard')
    .option('--platform <platform>', 'Platform to use (gitlab, github) - skips platform selection')
    .option('--force', 'Force overwrite of existing configuration file')
    .option('--no-wizard', 'Use default configuration without wizard')
    .action(async (options: { platform?: string; force?: boolean; wizard?: boolean }) => {
      try {
        if (options.platform && !['github', 'gitlab'].includes(options.platform)) {
          throw new ValidationError('Platform must be either "github" or "gitlab"');
        }

        if (options.wizard === false) {
          // Use old behavior with platform
          if (!options.platform) {
            throw new ValidationError('Platform is required when not using wizard');
          }
          createConfigFile(options.platform as 'github' | 'gitlab', options.force || false);
        } else {
          // Run interactive wizard
          await runConfigWizard();
        }
        process.exit(0);
      } catch (error) {
        displayError(error, false);
        process.exit(1);
      }
    });
}

/**
 * Handle analyze command
 */
async function handleAnalyzeCommand(options: CliOptions): Promise<void> {
  try {
    // Auto-detect platform if not specified
    const detectedPlatform = options.platform || detectPlatform();

    if (!detectedPlatform) {
      throw new PlatformError('Could not auto-detect platform. Please specify --platform (gitlab, github) or ensure you\'re running in a supported CI environment.');
    }

    const platform = detectedPlatform;

    if (!options.json) {
      console.log(chalk.gray(`🔧 Detected platform: ${platform.toUpperCase()}`));
    }

    // Get and validate required values
    const values = getRequiredValues(options, platform);
    const errors = validateRequiredValues(values);

    // Check for either PR ID or MR ID
    if (!values.prId) {
      throw new ValidationError('Pull/Merge request ID is required. Please provide a valid PR/MR ID using --pr-id or --mr-id.');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Missing required values: ${errors.join(', ')}`);
    }

    // Load configuration
    const config = loadConfig(options.config);

    // Create and run analyzer
    const analyzer = await UniversalSizeWiseAnalyzer.createWithAutoDetect(config, {
      platform,
      token: values.token!,
      host: values.host!,
      projectId: values.projectId!,
    });

    const result = await analyzer.analyzePullRequest(values.prId);

    // Output results
    if (options.json) {
      console.log(JSON.stringify(formatJsonOutput(result, true, platform), null, 2));
    } else {
      displayConsoleOutput(result, platform, options.verbose || false);
    }

    // Check size warning and exit code
    if (options.exitCode !== false && checkAndDisplaySizeWarning(result, config.thresholds, platform, options.json || false)) {
      process.exit(1);
    }
  } catch (error) {
    displayError(error, options.json || false);
    process.exit(1);
  }
}
