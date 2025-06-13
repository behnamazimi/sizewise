import type { VCSProvider, VCSProviderConfig } from './base';
import { GitHubProvider } from './github';
import { GitLabProvider } from './gitlab';
import { PlatformError } from '../utils/errors';

/**
 * Creates a VCS provider instance based on configuration
 */
export function createProvider(config: VCSProviderConfig): VCSProvider {
  switch (config.platform) {
  case 'github':
    return new GitHubProvider();
  case 'gitlab':
    return new GitLabProvider();
  default:
    throw new PlatformError(`Unsupported platform: ${config.platform}`);
  }
}

/**
 * Environment variable mappings for different platforms
 */
export const ENV_MAPPINGS = {
  gitlab: {
    token: ['GITLAB_TOKEN', 'CI_JOB_TOKEN'],
    host: ['GITLAB_HOST', 'CI_SERVER_URL'],
    projectId: ['CI_PROJECT_ID', 'GITLAB_PROJECT_ID'],
    pullRequestId: ['CI_MERGE_REQUEST_IID', 'GITLAB_MR_IID'],
  },
  github: {
    token: ['GITHUB_TOKEN', 'GH_TOKEN'],
    host: ['GITHUB_SERVER_URL', 'GITHUB_HOST'],
    projectId: ['GITHUB_REPOSITORY'],
    pullRequestId: ['GITHUB_EVENT_NUMBER', 'PR_NUMBER'],
  },
} as const;
