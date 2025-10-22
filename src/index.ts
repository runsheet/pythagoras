import core from '@actions/core';
import fs from 'fs';
import path from 'path';
import { loadConfig, derivePaths } from './config/index.js';
import { GitHubModelClient } from './services/model/index.js';
import { readKnowledgeBase, readMcpConfigs, fetchIssue, fetchIssueComments, buildIssueMemory } from './services/memory/index.js';
import { GitService } from './services/git/index.js';
import { renderPullRequestBody } from './render/index.js';

// ----- Orchestrator -----
async function run(): Promise<void> {
  try {
    // 1. Load config & derive paths
    const cfg = loadConfig();
    const paths = derivePaths(cfg);

    // 2. Gather issue context & comments
    const issueContext = cfg.issueNumber ? await fetchIssue(cfg.issueNumber) : null;
    const issueComments: any[] = issueContext ? await fetchIssueComments(issueContext.number, 20) : [];

    // 3. Resolve user prompt (issue title takes precedence)
    const userPrompt = resolveUserPrompt(issueContext, cfg.userPromptPath);
    if (!userPrompt) { core.setFailed('No issue_number or user_prompt_path provided.'); return; }

    // 4. Load system prompt + auxiliary context
    const systemPrompt = fs.existsSync(paths.systemPromptPath)
      ? fs.readFileSync(paths.systemPromptPath, 'utf-8')
      : 'You are Pythagoras.';
    const kb = readKnowledgeBase(paths.knowledgeBasePath);
    const mcpConfigs = readMcpConfigs(paths.mcpConfigPath);
    const issueMemory = buildIssueMemory(issueContext, issueComments);

    // 5. Model invocation
    if (!cfg.token) { core.setFailed('Missing GITHUB_TOKEN environment variable.'); return; }
    const modelClient = new GitHubModelClient(cfg.modelEndpoint, cfg.token);
    const modelResp = await modelClient.generate(
      systemPrompt,
      userPrompt + (issueMemory ? `\nMemory Context:\n${issueMemory}` : ''),
      cfg.model
    );

    // 6. Safety checks
    const oversized = modelResp.patches.find(p => p.content && Buffer.byteLength(p.content || '', 'utf-8') > cfg.maxFileSizeBytes);
    if (oversized) { core.setFailed(`Patch for ${oversized.file} exceeds ${cfg.maxFileSizeBytes} bytes limit.`); return; }
    if (modelResp.patches.length > cfg.maxFiles) { core.setFailed(`Refusing to create PR: patch file count ${modelResp.patches.length} exceeds limit ${cfg.maxFiles}`); return; }
    if (cfg.token === 'dummy') {
      core.warning('Detected dummy token, skipping GitHub API calls (local test mode).');
      core.info(JSON.stringify(modelResp, null, 2));
      core.setOutput('pr_number', '0');
      core.setOutput('applied', 'false');
      return;
    }

    // 7. Git operations & PR upsert
    const git = new GitService();
    const branchName = await git.ensureBranch(userPrompt);
    await git.commitPatches(
      branchName,
      `Pythagoras proposal update: ${userPrompt}`,
      modelResp.patches.map(p => ({ path: p.file, content: p.content || '' }))
    );
    const prBody = renderPullRequestBody({ prompt: userPrompt, modelResp, kb, mcp: mcpConfigs, issue: issueContext, comments: issueComments });
    const prNumber = await git.upsertPullRequest(branchName, `Pythagoras Fix Proposal: ${userPrompt.substring(0, 60)}`, prBody);

    // 8. Outputs
    core.setOutput('pr_number', prNumber.toString());
    core.info('Awaiting human review. Merge will trigger application phase.');
    core.setOutput('applied', 'false');
  } catch (err: any) {
    core.setFailed(err.message);
  }
}

// ----- Helpers -----
function resolveUserPrompt(issueContext: any, promptPath?: string): string {
  if (issueContext) return issueContext.title;
  if (!promptPath) return '';
  const abs = path.resolve(promptPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : '';
}

if (process.env.NODE_ENV !== 'test') { run(); }
export { run };
