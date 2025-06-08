import { Octokit } from '@octokit/rest';
import type {
  VCSProvider,
  VCSProviderConfig,
  DiffInfo,
  Comment,
  PullRequestInfo,
} from './base';

/**
 * GitHub provider implementation
 */
export class GitHubProvider implements VCSProvider {
  private octokit!: Octokit;
  private owner!: string;
  private repo!: string;

  async initialize(config: VCSProviderConfig): Promise<void> {
    this.octokit = new Octokit({
      auth: config.token,
      baseUrl: config.host.includes('github.com') ? undefined : `${config.host}/api/v3`,
    });

    // Parse owner/repo from projectId (format: "owner/repo")
    const [owner, repo] = config.projectId.split('/');
    if (!owner || !repo) {
      throw new Error('GitHub projectId must be in format "owner/repo"');
    }
    this.owner = owner;
    this.repo = repo;
  }

  async getDiffs(pullRequestId: string): Promise<DiffInfo[]> {
    const prNumber = parseInt(pullRequestId, 10);

    // Get the list of files in the PR
    const { data: files } = await this.octokit.pulls.listFiles({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    const diffs: DiffInfo[] = [];

    for (const file of files) {
      // For each file, get the actual diff content
      const diff = file.patch ?? '';

      diffs.push({
        oldPath: file.previous_filename ?? file.filename,
        newPath: file.filename,
        diff,
        isNewFile: file.status === 'added',
        isDeletedFile: file.status === 'removed',
        isRenamedFile: file.status === 'renamed',
      });
    }

    return diffs;
  }

  async getComments(pullRequestId: string): Promise<Comment[]> {
    const prNumber = parseInt(pullRequestId, 10);

    const { data: comments } = await this.octokit.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
    });

    return comments.map((comment): Comment => ({
      id: comment.id.toString(),
      body: comment.body ?? '',
      authorId: comment.user?.id.toString() ?? '',
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    }));
  }

  async createComment(pullRequestId: string, body: string): Promise<Comment> {
    const prNumber = parseInt(pullRequestId, 10);

    const { data: comment } = await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
      body,
    });

    return {
      id: comment.id.toString(),
      body: comment.body ?? '',
      authorId: comment.user?.id.toString() ?? '',
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    };
  }

  async updateComment(pullRequestId: string, commentId: string, body: string): Promise<Comment> {
    const commentIdNum = parseInt(commentId, 10);

    const { data: comment } = await this.octokit.issues.updateComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: commentIdNum,
      body,
    });

    return {
      id: comment.id.toString(),
      body: comment.body ?? '',
      authorId: comment.user?.id.toString() ?? '',
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    };
  }

  async getLabels(pullRequestId: string): Promise<string[]> {
    const prNumber = parseInt(pullRequestId, 10);

    const { data: pr } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return pr.labels?.map(label =>
      typeof label === 'string' ? label : label.name ?? '',
    ).filter(Boolean) || [];
  }

  async setLabels(pullRequestId: string, labels: string[]): Promise<void> {
    const prNumber = parseInt(pullRequestId, 10);

    await this.octokit.issues.setLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
      labels,
    });
  }

  async getPullRequest(pullRequestId: string): Promise<PullRequestInfo> {
    const prNumber = parseInt(pullRequestId, 10);

    const { data: pr } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return {
      id: pr.id.toString(),
      title: pr.title,
      description: pr.body ?? '',
      authorId: pr.user?.id.toString() ?? '',
      state: this.mapState(pr.state, pr.merged),
      labels: pr.labels?.map(label =>
        typeof label === 'string' ? label : label.name ?? '',
      ).filter(Boolean) || [],
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
    };
  }

  private mapState(prState: string, merged?: boolean | null): 'open' | 'closed' | 'merged' {
    if (merged) {
      return 'merged';
    }

    switch (prState.toLowerCase()) {
    case 'open':
      return 'open';
    case 'closed':
      return 'closed';
    default:
      return 'open';
    }
  }
}
