import path from 'path';
import type {
  SizewiseConfig,
  PullRequestMetrics,
  AnalysisResult,
} from './types';
import { createProvider, detectPlatform, type VCSProvider, type VCSProviderConfig } from './providers';
import { parseDiff, globToRegex } from './utils/diff-parser';
import { createLogger, Logger } from './utils/logger';

/**
 * Platform-agnostic analyzer class that processes pull/merge requests and determines their size.
 */
export class UniversalSizeWiseAnalyzer {
  private provider: VCSProvider;
  private config: SizewiseConfig;
  private logger: Logger;

  constructor(config: SizewiseConfig, providerConfig: VCSProviderConfig) {
    this.provider = createProvider(providerConfig);
    this.config = config;
    this.logger = createLogger(config);
  }

  /**
   * Initialize the analyzer with provider configuration
   */
  async initialize(providerConfig: VCSProviderConfig): Promise<void> {
    await this.provider.initialize(providerConfig);
  }

  /**
   * Create analyzer with auto-detected platform
   */
  static async createWithAutoDetect(
    config: SizewiseConfig,
    overrides: Partial<VCSProviderConfig> = {},
  ): Promise<UniversalSizeWiseAnalyzer> {
    const platform = overrides.platform || detectPlatform();

    if (!platform) {
      throw new Error('Could not auto-detect platform. Please specify platform explicitly.');
    }

    const providerConfig: VCSProviderConfig = {
      platform,
      token: overrides.token || process.env.GITLAB_TOKEN || process.env.GITHUB_TOKEN || '',
      host: overrides.host || process.env.GITLAB_HOST || process.env.GITHUB_SERVER_URL || '',
      projectId: overrides.projectId || process.env.CI_PROJECT_ID || process.env.GITHUB_REPOSITORY || '',
      ...overrides,
    };

    if (!providerConfig.token) {
      throw new Error(`${platform.toUpperCase()}_TOKEN environment variable is required`);
    }
    if (!providerConfig.host) {
      throw new Error(`${platform.toUpperCase()}_HOST environment variable is required`);
    }
    if (!providerConfig.projectId) {
      throw new Error('Project ID is required');
    }

    const analyzer = new UniversalSizeWiseAnalyzer(config, providerConfig);
    await analyzer.initialize(providerConfig);
    return analyzer;
  }

  /**
   * Determines the size category of a pull request based on its metrics.
   */
  private determineSize(metrics: PullRequestMetrics): AnalysisResult['size'] {
    const { thresholds } = this.config;

    // Get all threshold entries and sort them by their values (ascending - smallest to largest)
    const sortedThresholds = Object.entries(thresholds).sort(([, a], [, b]) => {
      // Sort by the maximum of files, lines, or directories to get overall "size"
      const aMax = Math.max(a.files, a.lines / 10, a.directories * 5); // Weighted comparison
      const bMax = Math.max(b.files, b.lines / 10, b.directories * 5);
      return aMax - bMax;
    });

    // Check each threshold from smallest to largest
    let resultSize = sortedThresholds[0][0]; // Start with the smallest threshold

    for (const [sizeName, threshold] of sortedThresholds) {
      resultSize = sizeName; // Update to current threshold as we iterate

      // A pull request fits this size category only if ALL conditions are met
      if (
        metrics.filesChanged <= threshold.files &&
        metrics.totalLines <= threshold.lines &&
        metrics.directoriesAffected <= threshold.directories
      ) {
        return sizeName;
      }
    }

    return resultSize;
  }

  /**
   * Retrieves and processes changes from a pull/merge request.
   */
  private async getPullRequestChanges(prId: string): Promise<PullRequestMetrics> {
    try {
      const diffs = await this.provider.getDiffs(prId);

      const metrics: PullRequestMetrics = {
        filesChanged: diffs.length,
        linesAdded: 0,
        linesRemoved: 0,
        totalLines: 0,
        directoriesAffected: new Set(
          diffs.map((diff) => path.dirname(diff.newPath)),
        ).size,
        renamedFiles: diffs.filter((diff) => diff.isRenamedFile).length,
        newFiles: diffs.filter((diff) => diff.isNewFile).length,
        deletedFiles: diffs.filter((diff) => diff.isDeletedFile).length,
      };

      // Process each diff to count lines added/removed
      for (const diff of diffs) {
        if (diff.diff) {
          // Skip excluded files
          const isExcluded = this.config.excludePatterns.some((pattern) => {
            const regex = globToRegex(pattern);
            return regex.test(diff.newPath) || regex.test(diff.oldPath);
          });

          if (isExcluded) {
            continue;
          }

          const { additions, deletions } = parseDiff(diff.diff);
          metrics.linesAdded += additions;
          metrics.linesRemoved += deletions;
        }
      }

      metrics.totalLines = metrics.linesAdded + metrics.linesRemoved;

      return metrics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error getting pull request changes: ${errorMessage}`);
    }
  }

  /**
   * Analyzes a pull/merge request and returns detailed metrics and size classification.
   */
  public async analyzePullRequest(prId: string): Promise<AnalysisResult> {
    this.logger.info(`🔍 Analyzing PR/MR #${prId}...`);

    const metrics = await this.getPullRequestChanges(prId);
    const size = this.determineSize(metrics);
    const details = this.generateDetails(metrics);

    this.logger.info(
      `📊 PR/MR Analysis: ${metrics.filesChanged} files, ${metrics.totalLines} lines changed → Size: ${size.toUpperCase()}`,
    );

    // Handle PR/MR commenting if enabled
    await this.handlePullRequestComment(prId, size);

    // Handle PR/MR labeling if enabled
    await this.handlePullRequestLabels(prId, size);

    return {
      metrics,
      size,
      details,
      thresholds: this.config.thresholds,
    };
  }

  /**
   * Legacy method name for backward compatibility
   */
  public async analyzeMergeRequest(mrId: string): Promise<AnalysisResult> {
    return this.analyzePullRequest(mrId);
  }

  /**
   * Handles adding or updating PR/MR comments based on configuration
   */
  private async handlePullRequestComment(prId: string, size: string): Promise<void> {
    if (!this.config.comment?.enabled) {
      return;
    }

    try {
      this.logger.info('📝 Checking for existing sizewise comments...');

      // Get existing comments to find sizewise comment
      const comments = await this.provider.getComments(prId);
      const COMMENT_MARKER = '<!-- sizewise-comment -->';
      const sizeWiseComment = comments.find(
        (comment) => comment.body?.includes(COMMENT_MARKER),
      );

      if (sizeWiseComment) {
        this.logger.info(
          `📝 Found existing sizewise comment: ${sizeWiseComment.id}`,
        );
      }

      const updateExisting = this.config.comment.updateExisting ?? true;

      // Always include the marker, regardless of custom template (for tracking)
      const userTemplate =
        this.config.comment.template || '🔍 **Pull Request Size:** {size}';
      const commentBody = `${COMMENT_MARKER}\n${userTemplate.replace(/\{size\}/g, size)}`;

      this.logger.info(`📝 Update existing: ${updateExisting}`);
      this.logger.info(
        `📝 Comment content: "${userTemplate.replace(/\{size\}/g, size)}"`,
      );

      // Decide action based on updateExisting setting
      if (updateExisting && sizeWiseComment) {
        // Update existing comment
        this.logger.info(
          `📝 Updating existing comment ID: ${sizeWiseComment.id}`,
        );
        try {
          await this.provider.updateComment(prId, sizeWiseComment.id, commentBody);
          this.logger.info(
            `✅ Updated existing comment (ID: ${sizeWiseComment.id}) with size: ${size}`,
          );
        } catch {
          // Try without HTML marker as fallback
          this.logger.info('📝 Edit failed, trying without HTML marker...');
          const fallbackBody = userTemplate.replace(/\{size\}/g, size);
          await this.provider.updateComment(prId, sizeWiseComment.id, fallbackBody);
          this.logger.info(
            `✅ Updated existing comment (ID: ${sizeWiseComment.id}) with fallback content`,
          );
        }
      } else {
        // Create new comment
        if (!updateExisting && sizeWiseComment) {
          this.logger.info(
            '📝 Creating new comment (updateExisting=false, ignoring existing)',
          );
        } else {
          this.logger.info(
            '📝 Creating new comment (no existing comment found)',
          );
        }

        await this.provider.createComment(prId, commentBody);
        this.logger.info(`✅ Created new comment with size: ${size}`);
      }
    } catch (error) {
      this.logger.logError('❌ Failed to handle PR/MR comment:', error);
    }
  }

  /**
   * Handles adding or updating PR/MR labels based on configuration
   */
  private async handlePullRequestLabels(prId: string, size: string): Promise<void> {
    if (!this.config.label?.enabled) {
      return;
    }

    try {
      this.logger.info('🏷️ Checking current PR/MR labels...');

      const currentLabels = await this.provider.getLabels(prId);

      this.logger.info(
        `🏷️ Current labels: [${currentLabels.length > 0 ? currentLabels.join(', ') : 'none'}]`,
      );

      const labelPrefix = this.config.label.prefix || 'size:';
      const newSizeLabel = `${labelPrefix}${size}`;

      // Check if correct label already exists
      if (currentLabels.includes(newSizeLabel)) {
        this.logger.info(
          `🏷️ Label "${newSizeLabel}" already exists - no changes needed`,
        );
        return;
      }

      // Find and remove existing sizewise labels (using the prefix)
      const sizewiseLabels = currentLabels.filter((label: string) =>
        label.startsWith(labelPrefix),
      );

      const filteredLabels = currentLabels.filter(
        (label: string) => !label.startsWith(labelPrefix),
      );

      // Show what's being changed
      if (sizewiseLabels.length > 0) {
        this.logger.info(
          `🏷️ Removing existing size labels: [${sizewiseLabels.join(', ')}]`,
        );
      }

      const updatedLabels = [...filteredLabels, newSizeLabel];

      this.logger.info(`🏷️ Setting new labels: [${updatedLabels.join(', ')}]`);

      await this.provider.setLabels(prId, updatedLabels);

      // Log what actually changed
      if (sizewiseLabels.length > 0) {
        this.logger.info(
          `✅ Replaced label "${sizewiseLabels[0]}" with "${newSizeLabel}"`,
        );
      } else {
        this.logger.info(`✅ Added label "${newSizeLabel}"`);
      }
    } catch (error) {
      this.logger.logError('❌ Failed to update PR/MR labels:', error);
    }
  }

  private generateDetails(metrics: PullRequestMetrics): string[] {
    return [
      `Files changed: ${metrics.filesChanged}`,
      `Lines added: ${metrics.linesAdded}`,
      `Lines removed: ${metrics.linesRemoved}`,
      `Total lines changed: ${metrics.totalLines}`,
      `Directories affected: ${metrics.directoriesAffected}`,
      `Renamed files: ${metrics.renamedFiles}`,
      `New files: ${metrics.newFiles}`,
      `Deleted files: ${metrics.deletedFiles}`,
    ];
  }
}
