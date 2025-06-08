import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { DEFAULT_CONFIG } from '../index';
import type { SizewiseConfig } from '../types';
import { createDefaultLogger } from '../utils/logger';

const logger = createDefaultLogger();

interface WizardAnswers {
  platform: 'github' | 'gitlab';
  enableComments: boolean;
  enableLabels: boolean;
}

export async function runConfigWizard(): Promise<void> {
  logger.blank();
  logger.header('Welcome to SizeWise Configuration Wizard');
  logger.dim('This wizard will help you create a customized configuration file for your project.');
  logger.blank();

  try {
    const answers = await inquirer.prompt<WizardAnswers>([
      {
        type: 'list',
        name: 'platform',
        message: 'Which platform are you using?',
        choices: [
          { name: 'GitHub', value: 'github' },
          { name: 'GitLab', value: 'gitlab' },
        ],
      },
      {
        type: 'confirm',
        name: 'enableComments',
        message: 'Would you like SizeWise to comment on pull/merge requests?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'enableLabels',
        message: 'Would you like SizeWise to add size labels to pull/merge requests?',
        default: true,
      },
    ]);

    // Generate configuration
    const config: SizewiseConfig = {
      ...DEFAULT_CONFIG,
      comment: {
        enabled: answers.enableComments,
        template: '🔍 **Pull Request Size:** {size}',
        updateExisting: true,
      },
      label: {
        enabled: answers.enableLabels,
        prefix: 'size:',
      },
    };

    // Determine config file location based on platform
    const configPath = path.resolve(process.cwd(), `.${answers.platform}/sizewise.config.json`);
    const configDir = path.dirname(configPath);

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Write configuration file
    fs.writeFileSync(
      configPath,
      JSON.stringify(config, null, 2),
      'utf8',
    );

    // Success message
    logger.blank();
    logger.header('Configuration Complete');
    logger.success('Configuration file created successfully!');
    logger.info(`Location: ${configPath}`);
    logger.blank();
    logger.info('You can now run SizeWise with your custom configuration:');
    logger.dim('npx sizewise');
    logger.blank();

  } catch (error) {
    logger.blank();
    logger.logError('Error creating configuration', error);
    logger.blank();
    process.exit(1);
  }
}
