/**
 * Common interface for Version Control System providers
 */
export interface VCSProvider {
  /**
   * Initialize the provider with authentication and configuration
   */
  initialize(config: VCSProviderConfig): Promise<void>;

  /**
   * Get diff information for a pull/merge request
   */
  getDiffs(pullRequestId: string): Promise<DiffInfo[]>;

  /**
   * Get existing comments on a pull/merge request
   */
  getComments(pullRequestId: string): Promise<Comment[]>;

  /**
   * Create a new comment on a pull/merge request
   */
  createComment(pullRequestId: string, body: string): Promise<Comment>;

  /**
   * Update an existing comment
   */
  updateComment(pullRequestId: string, commentId: string, body: string): Promise<Comment>;

  /**
   * Get current labels/tags on a pull/merge request
   */
  getLabels(pullRequestId: string): Promise<string[]>;

  /**
   * Set labels on a pull/merge request
   */
  setLabels(pullRequestId: string, labels: string[]): Promise<void>;

  /**
   * Get pull/merge request information
   */
  getPullRequest(pullRequestId: string): Promise<PullRequestInfo>;
}

/**
 * Configuration for VCS providers
 */
export interface VCSProviderConfig {
  token: string;
  host: string;
  projectId: string;
  platform: 'gitlab' | 'github';
}

/**
 * Standardized diff information
 */
export interface DiffInfo {
  oldPath: string;
  newPath: string;
  diff: string;
  isNewFile: boolean;
  isDeletedFile: boolean;
  isRenamedFile: boolean;
}

/**
 * Standardized comment information
 */
export interface Comment {
  id: string;
  body: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Standardized pull/merge request information
 */
export interface PullRequestInfo {
  id: string;
  title: string;
  description: string;
  authorId: string;
  state: 'open' | 'closed' | 'merged';
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Platform detection utility
 */
export function detectPlatform(): 'gitlab' | 'github' | null {
  // GitLab CI
  if (process.env.GITLAB_CI || process.env.CI_SERVER_URL) {
    return 'gitlab';
  }

  // GitHub Actions
  if (process.env.GITHUB_ACTIONS || process.env.GITHUB_SERVER_URL) {
    return 'github';
  }

  return null;
}
