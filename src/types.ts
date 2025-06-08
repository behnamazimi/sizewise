/**
 * Configuration thresholds for different merge request sizes
 */
export interface SizeThresholds {
  files: number;
  lines: number;
  directories: number;
}
/**
 * Configuration for PR/MR commenting feature
 */
export interface CommentConfig {
  enabled: boolean;
  template?: string; // Optional custom template, defaults to simple size message
  updateExisting?: boolean; // If true, update existing comments; if false, always create new ones (default: true)
}

/**
 * Configuration for PR/MR labeling feature
 */
export interface LabelConfig {
  enabled: boolean;
  prefix?: string; // Optional prefix, defaults to "size:"
}

/**
 * Configuration for logging verbosity
 */
export interface LoggingConfig {
  verbose: boolean; // Whether to show detailed logs for comments/labels operations
}

/**
 * Configuration for the sizewise analyzer
 */
export interface SizewiseConfig {
  thresholds: Record<string, SizeThresholds>;
  excludePatterns: string[];
  comment?: CommentConfig;
  label?: LabelConfig;
  logging?: LoggingConfig;
}

/**
 * CLI command options
 */
export interface CliOptions {
  prId?: string; // The ID of the pull/merge request to analyze
  mrId?: string; // Alias for prId - provided for GitLab users' convenience
  projectId?: string;
  token?: string; // Generic token
  host?: string; // Generic host
  platform?: 'gitlab' | 'github'; // Platform selection
  // Legacy GitLab-specific options for backward compatibility
  gitlabToken?: string;
  gitlabHost?: string;
  config?: string;
  verbose?: boolean;
  json?: boolean;
  exitCode?: boolean;
}

/**
 * CLI Environment variables interface
 */
export interface CliEnvironment {
  // GitLab
  GITLAB_TOKEN?: string;
  GITLAB_HOST?: string;
  CI_PROJECT_ID?: string;
  CI_MERGE_REQUEST_IID?: string;
  CI_JOB_TOKEN?: string;
  CI_SERVER_URL?: string;

  // GitHub
  GITHUB_TOKEN?: string;
  GITHUB_SERVER_URL?: string;
  GITHUB_REPOSITORY?: string;
  GITHUB_EVENT_NUMBER?: string;
  GITHUB_ACTIONS?: string;
  GH_TOKEN?: string;
  PR_NUMBER?: string;

}

/**
 * Validation result for CLI inputs
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Metrics collected from analyzing a pull/merge request
 */
export interface PullRequestMetrics {
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  totalLines: number;
  directoriesAffected: number;
  renamedFiles: number;
  newFiles: number;
  deletedFiles: number;
}

// Keep old interface for backward compatibility
export interface MergeRequestMetrics extends PullRequestMetrics {}

/**
 * Analysis result interface
 */
export interface AnalysisResult {
  size: string;
  details: string[];
  metrics: {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    totalLines: number;
    directoriesAffected: number;
    newFiles: number;
    deletedFiles: number;
    renamedFiles: number;
  };
  thresholds: Record<string, {
    files: number;
    lines: number;
    directories: number;
  }>;
}

/**
 * CLI output format for JSON mode
 */
export interface CliJsonOutput {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
  timestamp: string;
  version: string;
}
