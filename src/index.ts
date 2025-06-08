import path from 'path';
import fs from 'fs';
import type { SizewiseConfig } from './types';
// Legacy GitLab-only analyzer is available in src/legacy/ but not exported by default
import { UniversalSizeWiseAnalyzer } from './analyzer';

export * from './types';
export * from './analyzer';
export * from './providers';
export * from './utils/diff-parser';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: SizewiseConfig = {
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
  excludePatterns: [
    '**/*.lock',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml',
  ],
  comment: {
    enabled: false,
    template: '🔍 **Pull Request Size:** {size}',
    updateExisting: true,
  },
  label: {
    enabled: false,
    prefix: 'size:',
  },
  logging: {
    verbose: true,
  },
};

/**
 * Utility function to load configuration from file
 */
export function loadConfigFromFile(configPath?: string): SizewiseConfig {
  let config = { ...DEFAULT_CONFIG };

  // Check for config files in both .gitlab and .github directories
  const gitlabConfigPath = path.resolve(process.cwd(), '.gitlab/sizewise.config.json');
  const githubConfigPath = path.resolve(process.cwd(), '.github/sizewise.config.json');

  const finalConfigPath = configPath ||
    (fs.existsSync(gitlabConfigPath) ? gitlabConfigPath :
      (fs.existsSync(githubConfigPath) ? githubConfigPath : null));

  if (finalConfigPath) {
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
      throw new Error(`Failed to load config file: ${finalConfigPath}. ${error}`);
    }
  }

  return config;
}

/**
 * Convenience function to create a platform-agnostic analyzer
 */
export function createUniversalAnalyzer(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  config?: Partial<SizewiseConfig>,
): typeof UniversalSizeWiseAnalyzer {
  return UniversalSizeWiseAnalyzer;
}

/**
 * Platform-agnostic analysis function with auto-detection
 * @param prId Pull/Merge request ID
 * @param config Optional configuration override
 */
export async function analyzePullRequest(
  prId: string,
  config?: Partial<SizewiseConfig>,
) {
  const finalConfig = config ? { ...DEFAULT_CONFIG, ...config } : DEFAULT_CONFIG;
  const analyzer = await UniversalSizeWiseAnalyzer.createWithAutoDetect(finalConfig);
  return analyzer.analyzePullRequest(prId);
}
