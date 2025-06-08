import { ENV_MAPPINGS } from '../providers';
import type { CliOptions } from '../types';

/**
 * Get environment variable value from multiple possible keys
 */
export function getEnvValue(keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return undefined;
}

/**
 * Get required values from options or environment variables
 */
export function getRequiredValues(options: CliOptions, platform: 'github' | 'gitlab') {
  const mapping = ENV_MAPPINGS[platform];

  // Get PR/MR ID from options or environment
  const prId = options.prId || options.mrId || getEnvValue(mapping.pullRequestId);

  // Get other required values
  const projectId = options.projectId || getEnvValue(mapping.projectId);
  const token = options.token || getEnvValue(mapping.token);
  const host = options.host || getEnvValue(mapping.host);

  return {
    prId,
    projectId,
    token,
    host,
  };
}

/**
 * Validate required values and return any errors
 */
export function validateRequiredValues(values: ReturnType<typeof getRequiredValues>): string[] {
  const errors: string[] = [];

  if (!values.token) errors.push('API token is required');
  if (!values.host) errors.push('Host URL is required');
  if (!values.projectId) errors.push('Project ID is required');

  return errors;
}
