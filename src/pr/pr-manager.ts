import * as github from '@actions/github';
import { FilePatch } from '../agent/plan-execute-agent.js';

/**
 * PR information
 */
export interface PRInfo {
  number: number;
  url: string;
  branch: string;
}

/**
 * PRManager handles creating and managing Pull Requests for human-in-the-loop review
 */
export class PRManager {
  private octokit: ReturnType<typeof github.getOctokit>;
  private owner: string;
  private repo: string;
  private baseBranch: string;

  constructor(token: string, owner: string, repo: string, baseBranch = 'main') {
    this.octokit = github.getOctokit(token);
    this.owner = owner;
    this.repo = repo;
    this.baseBranch = baseBranch;
  }

  /**
   * Create a pull request with the proposed changes
   */
  async createPR(
    issueNumber: number,
    title: string,
    summary: string,
    patches: FilePatch[]
  ): Promise<PRInfo> {
    console.log(`Creating PR for issue #${issueNumber} with ${patches.length} patches`);

    // Create a unique branch name
    const branchName = `pythagoras/proposal-${issueNumber}-${Date.now()}`;

    // Get the base branch reference
    const baseRef = await this.octokit.rest.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${this.baseBranch}`,
    });

    // Create a new branch
    await this.octokit.rest.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.data.object.sha,
    });

    console.log(`Created branch: ${branchName}`);

    // Apply patches to the branch
    for (const patch of patches) {
      await this.applyPatch(branchName, patch);
    }

    // Create the PR body
    const body = this.createPRBody(issueNumber, summary, patches);

    // Create the pull request
    const pr = await this.octokit.rest.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title: `[Pythagoras] ${title}`,
      head: branchName,
      base: this.baseBranch,
      body,
    });

    console.log(`Created PR #${pr.data.number}: ${pr.data.html_url}`);

    // Link the PR to the issue
    await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body: `🤖 **Pythagoras has created a proposal**\n\nPull Request: #${pr.data.number}\n\nPlease review the changes and merge if approved.`,
    });

    return {
      number: pr.data.number,
      url: pr.data.html_url,
      branch: branchName,
    };
  }

  /**
   * Apply a single patch to the branch
   */
  private async applyPatch(branch: string, patch: FilePatch): Promise<void> {
    console.log(`Applying patch: ${patch.action} ${patch.file}`);

    if (patch.action === 'delete') {
      await this.deleteFile(branch, patch.file);
    } else if (patch.action === 'create' || patch.action === 'update') {
      if (!patch.content) {
        throw new Error(`Content is required for ${patch.action} action on ${patch.file}`);
      }
      await this.createOrUpdateFile(branch, patch.file, patch.content);
    }
  }

  /**
   * Create or update a file on the branch
   */
  private async createOrUpdateFile(
    branch: string,
    filePath: string,
    content: string
  ): Promise<void> {
    try {
      // Try to get the file if it exists
      const existingFile = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: branch,
      });

      // File exists, update it
      if ('sha' in existingFile.data) {
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          message: `Update ${filePath}`,
          content: Buffer.from(content).toString('base64'),
          branch,
          sha: existingFile.data.sha,
        });
        console.log(`Updated file: ${filePath}`);
      }
    } catch (error: unknown) {
      // File doesn't exist, create it
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          message: `Create ${filePath}`,
          content: Buffer.from(content).toString('base64'),
          branch,
        });
        console.log(`Created file: ${filePath}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete a file from the branch
   */
  private async deleteFile(branch: string, filePath: string): Promise<void> {
    try {
      const existingFile = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: branch,
      });

      if ('sha' in existingFile.data) {
        await this.octokit.rest.repos.deleteFile({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          message: `Delete ${filePath}`,
          branch,
          sha: existingFile.data.sha,
        });
        console.log(`Deleted file: ${filePath}`);
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        console.log(`File ${filePath} not found, skipping deletion`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Create the PR body with details about the changes
   */
  private createPRBody(issueNumber: number, summary: string, patches: FilePatch[]): string {
    let body = `## 🤖 Pythagoras AI Proposal\n\n`;
    body += `This PR addresses issue #${issueNumber}\n\n`;
    body += `### Summary\n\n${summary}\n\n`;
    body += `### Changes\n\n`;
    body += `This PR includes ${patches.length} file change(s):\n\n`;

    for (const patch of patches) {
      const emoji = patch.action === 'create' ? '✨' : patch.action === 'update' ? '📝' : '🗑️';
      body += `- ${emoji} **${patch.action}**: \`${patch.file}\`\n`;
    }

    body += `\n### Review Guidelines\n\n`;
    body += `Please review the proposed changes carefully:\n`;
    body += `1. Verify the changes address the issue correctly\n`;
    body += `2. Check for any potential security or safety concerns\n`;
    body += `3. Ensure the changes follow project conventions\n`;
    body += `4. Test the changes if possible before merging\n\n`;
    body += `### Next Steps\n\n`;
    body += `- ✅ **Approve and merge** if the changes look good\n`;
    body += `- 💬 **Comment** if you need clarifications or changes\n`;
    body += `- ❌ **Close** if the approach is incorrect\n\n`;
    body += `---\n`;
    body += `*This PR was automatically generated by Pythagoras AI*\n`;

    return body;
  }

  /**
   * Update an existing PR with new patches
   */
  async updatePR(prNumber: number, summary: string, patches: FilePatch[]): Promise<void> {
    console.log(`Updating PR #${prNumber}`);

    // Get the PR details
    const pr = await this.octokit.rest.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    const branch = pr.data.head.ref;

    // Apply new patches
    for (const patch of patches) {
      await this.applyPatch(branch, patch);
    }

    // Add a comment about the update
    await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: prNumber,
      body: `🤖 **Pythagoras has updated this PR**\n\n${summary}\n\nApplied ${patches.length} new patch(es).`,
    });

    console.log(`Updated PR #${prNumber}`);
  }
}
