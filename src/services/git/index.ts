import github from '@actions/github';

// ----- Interface -----
export interface IGitService {
  ensureBranch(prompt: string): Promise<string>;
  commitPatches(branch: string, message: string, patches: { path: string; content: string }[]): Promise<void>;
  upsertPullRequest(branch: string, title: string, body: string): Promise<number>;
}

// ----- Implementation -----
export class GitService implements IGitService {
  private octokit = github.getOctokit(process.env.GITHUB_TOKEN as string);
  private owner = github.context.repo.owner;
  private repo = github.context.repo.repo;
  private baseRef = github.context.ref.replace('refs/heads/', '') || 'main';

  async ensureBranch(_: string): Promise<string> {
    const baseName = 'pythagoras/proposal';
    const branches = await this.octokit.rest.repos.listBranches({ owner: this.owner, repo: this.repo, per_page: 100 });
    const existing = branches.data.find(b => b.name.startsWith(baseName));
    return existing ? existing.name : `${baseName}-${Date.now()}`;
  }

  async commitPatches(branch: string, message: string, patches: { path: string; content: string }[]): Promise<void> {
    const baseSha = await this.getRefSha(this.baseRef);
    const treeItems = patches.map(p => ({
      path: p.path,
      mode: '100644' as const,
      type: 'blob' as const,
      content: p.content
    }));

    const newTree = await this.octokit.rest.git.createTree({
      owner: this.owner,
      repo: this.repo,
      base_tree: baseSha,
      tree: treeItems
    });

    const commit = await this.octokit.rest.git.createCommit({
      owner: this.owner,
      repo: this.repo,
      message,
      tree: newTree.data.sha,
      parents: [baseSha]
    });

    const ref = `heads/${branch}`;
    try {
      await this.octokit.rest.git.getRef({ owner: this.owner, repo: this.repo, ref });
      await this.octokit.rest.git.updateRef({ owner: this.owner, repo: this.repo, ref, sha: commit.data.sha, force: true });
    } catch {
      await this.octokit.rest.git.createRef({ owner: this.owner, repo: this.repo, ref: `refs/${ref}`, sha: commit.data.sha });
    }
  }

  async upsertPullRequest(branch: string, title: string, body: string): Promise<number> {
    const prs = await this.octokit.rest.pulls.list({ owner: this.owner, repo: this.repo, head: `${this.owner}:${branch}`, state: 'open' });
    if (prs.data.length) {
      const pr = prs.data[0];
      await this.octokit.rest.pulls.update({ owner: this.owner, repo: this.repo, pull_number: pr.number, body });
      return pr.number;
    }
    const created = await this.octokit.rest.pulls.create({ owner: this.owner, repo: this.repo, title, head: branch, base: this.baseRef, body });
    return created.data.number;
  }

  private async getRefSha(ref: string) {
    const branch = await this.octokit.rest.git.getRef({ owner: this.owner, repo: this.repo, ref: `heads/${ref}` });
    return branch.data.object.sha;
  }
}
