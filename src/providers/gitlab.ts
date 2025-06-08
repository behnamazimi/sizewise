import { Gitlab } from '@gitbeaker/rest';
import type {
  VCSProvider,
  VCSProviderConfig,
  DiffInfo,
  Comment,
  PullRequestInfo,
} from './base';

/**
 * GitLab-specific response types
 */
interface GitLabDiffResponse {
  old_path: string;
  new_path: string;
  a_mode: string;
  b_mode: string;
  diff: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
}

interface GitLabNote {
  id: number;
  body: string;
  author: { id: number; username: string };
  created_at: string;
  updated_at: string;
}

interface GitLabMR {
  id: number;
  iid: number;
  title: string;
  description: string;
  author: { id: number; username: string };
  state: string;
  labels: string[];
  created_at: string;
  updated_at: string;
}

/**
 * GitLab provider implementation
 */
export class GitLabProvider implements VCSProvider {
  private gitlab!: InstanceType<typeof Gitlab>;
  private projectId!: string;

  async initialize(config: VCSProviderConfig): Promise<void> {
    this.gitlab = new Gitlab({
      token: config.token,
      host: config.host,
    });
    this.projectId = config.projectId;
  }

  async getDiffs(pullRequestId: string): Promise<DiffInfo[]> {
    const mrId = parseInt(pullRequestId, 10);
    const diffs = await this.gitlab.MergeRequests.allDiffs(this.projectId, mrId);
    const changes = diffs as unknown as GitLabDiffResponse[];

    return changes.map((change): DiffInfo => ({
      oldPath: change.old_path,
      newPath: change.new_path,
      diff: change.diff,
      isNewFile: change.new_file,
      isDeletedFile: change.deleted_file,
      isRenamedFile: change.renamed_file,
    }));
  }

  async getComments(pullRequestId: string): Promise<Comment[]> {
    const mrId = parseInt(pullRequestId, 10);
    const notes = await this.gitlab.MergeRequestNotes.all(this.projectId, mrId) as GitLabNote[];

    return notes.map((note): Comment => ({
      id: note.id.toString(),
      body: note.body,
      authorId: note.author.id.toString(),
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));
  }

  async createComment(pullRequestId: string, body: string): Promise<Comment> {
    const mrId = parseInt(pullRequestId, 10);
    const note = await this.gitlab.MergeRequestNotes.create(
      this.projectId,
      mrId,
      body,
    ) as GitLabNote;

    return {
      id: note.id.toString(),
      body: note.body,
      authorId: note.author.id.toString(),
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };
  }

  async updateComment(pullRequestId: string, commentId: string, body: string): Promise<Comment> {
    const mrId = parseInt(pullRequestId, 10);
    const noteId = parseInt(commentId, 10);

    const note = await this.gitlab.MergeRequestNotes.edit(
      this.projectId,
      mrId,
      noteId,
      { body },
    ) as GitLabNote;

    return {
      id: note.id.toString(),
      body: note.body,
      authorId: note.author.id.toString(),
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    };
  }

  async getLabels(pullRequestId: string): Promise<string[]> {
    const mrId = parseInt(pullRequestId, 10);
    const mr = await this.gitlab.MergeRequests.show(this.projectId, mrId) as GitLabMR;

    return Array.isArray(mr.labels)
      ? mr.labels.map((label: unknown) => {
        if (typeof label === 'string') {
          return label;
        }
        if (typeof label === 'object' && label !== null) {
          if ('name' in label && typeof label.name === 'string') {
            return label.name;
          }
          if ('title' in label && typeof label.title === 'string') {
            return label.title;
          }
        }
        return String(label);
      })
      : [];
  }

  async setLabels(pullRequestId: string, labels: string[]): Promise<void> {
    const mrId = parseInt(pullRequestId, 10);
    await this.gitlab.MergeRequests.edit(this.projectId, mrId, {
      labels: labels.join(','),
    });
  }

  async getPullRequest(pullRequestId: string): Promise<PullRequestInfo> {
    const mrId = parseInt(pullRequestId, 10);
    const mr = await this.gitlab.MergeRequests.show(this.projectId, mrId) as GitLabMR;

    return {
      id: mr.id.toString(),
      title: mr.title,
      description: mr.description || '',
      authorId: mr.author.id.toString(),
      state: this.mapState(mr.state),
      labels: Array.isArray(mr.labels) ? mr.labels : [],
      createdAt: mr.created_at,
      updatedAt: mr.updated_at,
    };
  }

  private mapState(gitlabState: string): 'open' | 'closed' | 'merged' {
    switch (gitlabState.toLowerCase()) {
    case 'opened':
      return 'open';
    case 'merged':
      return 'merged';
    case 'closed':
      return 'closed';
    default:
      return 'open';
    }
  }
}
