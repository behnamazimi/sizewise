import path from 'path';
import fs from 'fs';
import type { SizewiseConfig } from '../types';
import { createDefaultLogger } from '../utils/logger';
import { DEFAULT_CONFIG } from '../index';

const logger = createDefaultLogger();

/**
 * Creates a configuration file in the appropriate directory
 */
export function createConfigFile(platform: 'github' | 'gitlab', force: boolean = false): void {
  const targetDir = platform === 'github' ? '.github' : '.gitlab';
  const configPath = path.join(process.cwd(), targetDir, 'sizewise.config.json');

  // Ensure the target directory exists
  const dirPath = path.dirname(configPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Check if config already exists and force is not set
  if (fs.existsSync(configPath) && !force) {
    logger.warning(`Configuration file already exists at ${configPath}`);
    logger.dim('Use --force to overwrite');
    return;
  }

  // Read the example configuration file
  const exampleConfigPath = path.join(__dirname, '..', '..', 'example.config.json');
  let configContent: string;

  try {
    if (fs.existsSync(exampleConfigPath)) {
      configContent = fs.readFileSync(exampleConfigPath, 'utf8');
    } else {
      // Fallback to default config if example.config.json is not found
      const configTemplate = {
        ...DEFAULT_CONFIG,
        comment: {
          ...DEFAULT_CONFIG.comment,
          enabled: true,
        },
        label: {
          ...DEFAULT_CONFIG.label,
          enabled: true,
        },
      };
      configContent = JSON.stringify(configTemplate, null, 2);
    }
  } catch (error) {
    logger.logError('Failed to read example configuration', error);
    process.exit(1);
  }

  // Write the configuration file
  try {
    fs.writeFileSync(configPath, configContent);
    if (force && fs.existsSync(configPath)) {
      logger.success(`Successfully overwritten configuration file at ${configPath}`);
    } else {
      logger.success(`Successfully created configuration file at ${configPath}`);
    }
    logger.dim('Edit this file to customize your size analysis thresholds and behavior.');
  } catch (error) {
    logger.logError('Failed to create configuration file', error);
    process.exit(1);
  }
}

/**
 * Loads configuration from file or returns default
 */
export function loadConfig(configPath?: string): SizewiseConfig {
  let config = { ...DEFAULT_CONFIG };

  const defaultConfigPath = path.resolve(process.cwd(), 'sizewise.config.json');
  const gitlabConfigPath = path.resolve(process.cwd(), '.gitlab/sizewise.config.json');
  const githubConfigPath = path.resolve(process.cwd(), '.github/sizewise.config.json');

  const finalConfigPath = configPath ??
    (fs.existsSync(defaultConfigPath) ? defaultConfigPath :
      (fs.existsSync(gitlabConfigPath) ? gitlabConfigPath :
        (fs.existsSync(githubConfigPath) ? githubConfigPath : undefined)));

  if (finalConfigPath !== undefined) {
    try {
      const userConfig = JSON.parse(fs.readFileSync(finalConfigPath, 'utf8'));
      config = {
        ...DEFAULT_CONFIG,
        ...userConfig,
        thresholds: {
          ...DEFAULT_CONFIG.thresholds,
          ...userConfig.thresholds,
        },
        comment: {
          ...DEFAULT_CONFIG.comment,
          ...userConfig.comment,
        },
        label: {
          ...DEFAULT_CONFIG.label,
          ...userConfig.label,
        },
        logging: {
          ...DEFAULT_CONFIG.logging,
          ...userConfig.logging,
        },
      };
    } catch (error) {
      logger.warning(`Failed to load config file: ${finalConfigPath}`);
      logger.dim(`Using default configuration. Error: ${error}`);
    }
  }

  return config;
}
