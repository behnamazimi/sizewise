import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { DEFAULT_CONFIG } from './config';
import type { SizewiseConfig } from '../types';
import { colors, symbols } from './style';

interface WizardAnswers {
  platform: 'github' | 'gitlab';
  enableComments: boolean;
  enableLabels: boolean;
}

export async function runConfigWizard(): Promise<void> {
  console.log('');
  console.log(colors.header('Welcome to SizeWise Configuration Wizard'));
  console.log(colors.dim('─'.repeat(40)));
  console.log(colors.dim('This wizard will help you create a customized configuration file for your project.'));
  console.log('');

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
    console.log('');
    console.log(colors.header('Configuration Complete'));
    console.log(colors.dim('─'.repeat(20)));
    console.log(colors.success(`${symbols.success} Configuration file created successfully!`));
    console.log(colors.info(`${symbols.info} Location: ${colors.link(configPath)}`));
    console.log('');
    console.log('You can now run SizeWise with your custom configuration:');
    console.log(colors.command('npx sizewise'));
    console.log('');

  } catch (error) {
    console.log('');
    console.log(colors.error(`${symbols.error} Error creating configuration:`));
    console.log(colors.error(error instanceof Error ? error.message : String(error)));
    console.log('');
    process.exit(1);
  }
}
