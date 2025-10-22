import core from '@actions/core';
import github from '@actions/github';
import fs from 'fs';
import path from 'path';
import { request } from 'https';

interface Patch { file: string; action: 'create' | 'update' | 'delete'; content?: string; }
interface ModelResponse { reasoning: string; patches: Patch[] }

async function callModel({ model, systemPrompt, userPrompt, endpoint }: { model: string; systemPrompt: string; userPrompt: string; endpoint?: string }): Promise<ModelResponse> {
  const finalUser = `${userPrompt}\n\nReturn a JSON object in a fenced code block with keys reasoning and patches (array of {file, action, content}).`;
  const body = JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: finalUser }], temperature: 0.2 });
  const apiUrl = endpoint || 'https://models.github.ai/inference/chat/completions';
  const responseText = await httpPostJson(apiUrl, body, { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', Accept: 'application/json' });
  let data: any; try { data = JSON.parse(responseText); } catch (e: any) { throw new Error(`Failed to parse model raw response JSON: ${e.message}`); }
  const content: string = data.choices?.[0]?.message?.content || '';
  const jsonStr = extractJsonFromMarkdown(content);
  let parsed: ModelResponse; try { parsed = JSON.parse(jsonStr); } catch (e: any) { throw new Error(`Failed to parse JSON block from model: ${e.message}`); }
  if (!parsed.patches) parsed.patches = []; return parsed;
}

function extractJsonFromMarkdown(md: string): string { const fenceMatch = md.match(/```json\n([\s\S]*?)```/i) || md.match(/```\n([\s\S]*?)```/); if (fenceMatch) return fenceMatch[1]; return md.trim(); }

function httpPostJson(urlStr: string, body: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(urlStr);
      const options = {
        method: 'POST',
        hostname: urlObj.hostname,
        path: urlObj.pathname + (urlObj.search || ''),
        headers: {
          'Content-Length': Buffer.byteLength(body),
          ...headers
        }
      };
      const req = request(options, (res: any) => {
        let data = '';
        res.on('data', (d: any) => (data += d));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Model API HTTP ${res.statusCode}: ${data.substring(0, 500)}`));
          }
          resolve(data);
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function readKnowledgeBase(dir: string): { name: string; content: string }[] { if (!fs.existsSync(dir)) return []; return fs.readdirSync(dir).map(f => ({ name: f, content: fs.readFileSync(path.join(dir, f), 'utf-8') })); }
function readMcpConfig(dir: string): { name: string; config: any }[] { if (!fs.existsSync(dir)) return []; return fs.readdirSync(dir).filter(e => e.endsWith('.yml') || e.endsWith('.yaml')).map(e => ({ name: e, config: yaml.load(fs.readFileSync(path.join(dir, e), 'utf-8')) })); }
function applyPatches(patches: Patch[]) { for (const p of patches) { const target = path.join(process.cwd(), p.file); if (p.action === 'create') { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, p.content || '', 'utf-8'); } else if (p.action === 'update') { fs.writeFileSync(target, p.content || '', 'utf-8'); } else if (p.action === 'delete') { if (fs.existsSync(target)) fs.unlinkSync(target); } } }

async function run(): Promise<void> {
  try {
    const prompt = core.getInput('prompt', { required: true }); const model = core.getInput('model'); const maxPatchFiles = parseInt(core.getInput('max_patch_files'), 10); const dryRun = core.getInput('dry_run') === 'true'; const issueNumberInput = core.getInput('issue_number'); const mcpConfigPath = core.getInput('mcp_config_path'); const knowledgeBasePath = core.getInput('knowledge_base_path'); const mode = core.getInput('mode') || 'propose'; const modelsEndpoint = core.getInput('models_endpoint'); const maxMemoryComments = parseInt(core.getInput('max_memory_comments') || '20', 10);
    const kb = readKnowledgeBase(knowledgeBasePath); const mcpConfigs = readMcpConfig(mcpConfigPath); const issueContext = issueNumberInput ? await fetchIssue(parseInt(issueNumberInput, 10)) : null; let issueComments: any[] = []; if (issueContext) issueComments = await fetchIssueComments(issueContext.number, maxMemoryComments);
    const systemPrompt = `You are Pythagoras, an AI assistant that proposes repo changes via PR before applying fixes. Use provided knowledge base and MCP server configs contextually. If diagnosing infrastructure issues (e.g., disk space), produce actionable scripts.`;
    const issueMemory = issueContext ? `Issue Title: ${issueContext.title}\nIssue Body: ${issueContext.body}\nRecent Comments:\n${issueComments.map(c => `- ${c.user.login}: ${truncate(c.body, 300)}`).join('\n')}` : '';
    let modelResp: ModelResponse; if (process.env.GITHUB_TOKEN === 'dummy') { modelResp = { reasoning: 'Local test mode; skipping real model call.', patches: [{ file: 'scripts/cleanup.sh', action: 'create', content: '#!/bin/bash\necho test' }] }; } else { modelResp = await callModel({ model, systemPrompt, userPrompt: prompt + (issueMemory ? ('\nMemory Context:\n' + issueMemory) : ''), endpoint: modelsEndpoint }); }
    const oversized = modelResp.patches.find(p => p.content && Buffer.byteLength(p.content, 'utf-8') > 50 * 1024); if (oversized) { core.setFailed(`Patch for ${oversized.file} exceeds 50KB limit.`); return; }
    if (modelResp.patches.length > maxPatchFiles) { core.setFailed(`Refusing to create PR: patch file count ${modelResp.patches.length} exceeds limit ${maxPatchFiles}`); return; }
    if (mode === 'apply') { core.info('Apply mode placeholder: In future will execute merged scripts or remote diagnostics.'); core.setOutput('applied', 'true'); return; }
    if (process.env.GITHUB_TOKEN === 'dummy') { core.warning('Detected dummy token, skipping GitHub API calls (local test mode).'); core.info(JSON.stringify(modelResp, null, 2)); core.setOutput('pr_number', '0'); core.setOutput('applied', 'false'); return; }
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN as string);
    const { owner, repo } = github.context.repo;
    const baseRef = github.context.ref.replace('refs/heads/', '') || 'main';
    const branchName = await ensureProposalBranch(octokit, owner, repo, prompt);
    const baseSha = await getRefSha(octokit, owner, repo, baseRef);
    const treeItems: { path: string; mode: '100644'; type: 'blob'; content?: string }[] = [];
    for (const p of modelResp.patches) {
      treeItems.push({ path: p.file, mode: '100644', type: 'blob', content: p.content });
    }
    const newTree = await octokit.rest.git.createTree({ owner, repo, base_tree: baseSha, tree: treeItems });
    const commit = await octokit.rest.git.createCommit({ owner, repo, message: `Pythagoras proposal update: ${prompt}`, tree: newTree.data.sha, parents: [baseSha] });
    await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${branchName}`, sha: commit.data.sha, force: true });
    const prs = await octokit.rest.pulls.list({ owner, repo, head: `${owner}:${branchName}`, state: 'open' });
    let prNumber: number;
    if (prs.data.length) {
      const pr = prs.data[0];
      const updatedBody = generatePrBody({ prompt, modelResp, kb, mcpConfigs, issueContext, issueComments });
      await octokit.rest.pulls.update({ owner, repo, pull_number: pr.number, body: updatedBody });
      prNumber = pr.number;
    } else {
      const created = await octokit.rest.pulls.create({ owner, repo, title: `Pythagoras Fix Proposal: ${prompt.substring(0, 60)}`, head: branchName, base: baseRef, body: generatePrBody({ prompt, modelResp, kb, mcpConfigs, issueContext, issueComments }) });
      prNumber = created.data.number;
    }
    core.setOutput('pr_number', prNumber.toString());
    if (dryRun) { core.info('Dry run enabled: not waiting for merge to apply actions.'); core.setOutput('applied', 'false'); return; }
    core.info('Awaiting human review. Merge will trigger application phase.');
    core.setOutput('applied', 'false');
  } catch (err: any) { core.setFailed(err.message); }
}

async function fetchIssue(number: number) { const octokit = github.getOctokit(process.env.GITHUB_TOKEN as string); const { owner, repo } = github.context.repo; const issue = await octokit.rest.issues.get({ owner, repo, issue_number: number }); return issue.data; }
async function fetchIssueComments(number: number, limit: number) { const octokit = github.getOctokit(process.env.GITHUB_TOKEN as string); const { owner, repo } = github.context.repo; const comments = await octokit.rest.issues.listComments({ owner, repo, issue_number: number, per_page: limit }); return comments.data.slice(-limit); }
async function ensureProposalBranch(octokit: any, owner: string, repo: string, prompt: string) { const baseName = 'pythagoras/proposal'; const branches = await octokit.rest.repos.listBranches({ owner, repo, per_page: 100 }); const existing = branches.data.find((b: any) => b.name.startsWith(baseName)); if (existing) return existing.name; return `${baseName}-${Date.now()}`; }
function truncate(str: string, max: number) { return str.length > max ? str.slice(0, max) + '…' : str; }
async function getRefSha(octokit: any, owner: string, repo: string, ref: string) { const branch = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${ref}` }); return branch.data.object.sha; }
function generatePrBody({ prompt, modelResp, kb, mcpConfigs, issueContext, issueComments = [] }: { prompt: string; modelResp: ModelResponse; kb: { name: string; content: string }[]; mcpConfigs: { name: string; config: any }[]; issueContext: any; issueComments?: any[] }) { let body = `## Pythagoras Proposal\n\n**Prompt:** ${prompt}\n\n`; if (issueContext) body += `**Issue #${issueContext.number}:** ${issueContext.title}\n\n${issueContext.body}\n\n`; body += `### Reasoning\n${modelResp.reasoning}\n\n### Proposed Changes (${modelResp.patches.length} file(s))\n`; modelResp.patches.forEach(p => { body += `- ${p.action.toUpperCase()} \`${p.file}\`\n`; }); if (kb.length) body += `\n### Knowledge Base Referenced\n` + kb.map(k => `- ${k.name}`).join('\n'); if (mcpConfigs.length) body += `\n\n### MCP Servers\n` + mcpConfigs.map(c => `- ${c.name}`).join('\n'); if (issueComments.length) body += `\n\n### Recent Issue Comments (memory)\n` + issueComments.map((c: any) => `- @${c.user.login}: ${truncate(c.body.replace(/\n/g, ' '), 120)}`).join('\n'); body += `\n\n> Human review required. Merge will trigger application phase.`; return body; }

if (process.env.NODE_ENV !== 'test') { run(); }
export { run, callModel };
