import core from '@actions/core';
import github from '@actions/github';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { request } from 'node:https';

async function callModel({ model, systemPrompt, userPrompt, endpoint }) {
    // Compose prompt asking model to output JSON fenced block with reasoning + patches.
    const finalUser = `${userPrompt}\n\nReturn a JSON object in a fenced code block with keys reasoning and patches (array of {file, action, content}).`;
    const body = JSON.stringify({
        model,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: finalUser }
        ],
        temperature: 0.2
    });

    const apiUrl = endpoint || 'https://models.github.ai/inference/chat/completions';

    const responseText = await httpPostJson(apiUrl, body, {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    });

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Failed to parse model raw response JSON: ${e.message}`);
    }

    // Expect choices[0].message.content containing text possibly with fenced JSON
    const content = data.choices?.[0]?.message?.content || '';
    const jsonStr = extractJsonFromMarkdown(content);
    let parsed;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (e) {
        throw new Error(`Failed to parse JSON block from model: ${e.message}`);
    }
    if (!parsed.patches) parsed.patches = [];
    return parsed;
}

function extractJsonFromMarkdown(md) {
    const fenceMatch = md.match(/```json\n([\s\S]*?)```/i) || md.match(/```\n([\s\S]*?)```/);
    if (fenceMatch) return fenceMatch[1];
    return md.trim();
}

function httpPostJson(urlStr, body, headers) {
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
            const req = request(options, res => {
                let data = '';
                res.on('data', d => (data += d));
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

function readKnowledgeBase(dir) {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    return files.map(f => ({
        name: f,
        content: fs.readFileSync(path.join(dir, f), 'utf-8')
    }));
}

function readMcpConfig(dir) {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir);
    return entries.filter(e => e.endsWith('.yml') || e.endsWith('.yaml')).map(e => ({
        name: e,
        config: yaml.load(fs.readFileSync(path.join(dir, e), 'utf-8'))
    }));
}

function applyPatches(patches) {
    for (const p of patches) {
        const target = path.join(process.cwd(), p.file);
        if (p.action === 'create') {
            const dir = path.dirname(target);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(target, p.content, 'utf-8');
        } else if (p.action === 'update') {
            fs.writeFileSync(target, p.content, 'utf-8');
        } else if (p.action === 'delete') {
            if (fs.existsSync(target)) fs.unlinkSync(target);
        }
    }
}

async function run() {
    try {
        const prompt = core.getInput('prompt', { required: true });
        const model = core.getInput('model');
        const maxPatchFiles = parseInt(core.getInput('max_patch_files'), 10);
        const dryRun = core.getInput('dry_run') === 'true';
        const issueNumberInput = core.getInput('issue_number');
        const mcpConfigPath = core.getInput('mcp_config_path');
        const knowledgeBasePath = core.getInput('knowledge_base_path');
        const mode = core.getInput('mode') || 'propose'; // future: 'apply'
        const modelsEndpoint = core.getInput('models_endpoint');
        const maxMemoryComments = parseInt(core.getInput('max_memory_comments') || '20', 10);

        const kb = readKnowledgeBase(knowledgeBasePath);
        const mcpConfigs = readMcpConfig(mcpConfigPath);

        const issueContext = issueNumberInput ? await fetchIssue(parseInt(issueNumberInput, 10)) : null;
        let issueComments = [];
        if (issueContext) {
            issueComments = await fetchIssueComments(issueContext.number, maxMemoryComments);
        }

        const systemPrompt = `You are Pythagoras, an AI assistant that proposes repo changes via PR before applying fixes. Use provided knowledge base and MCP server configs contextually. If diagnosing infrastructure issues (e.g., disk space), produce actionable scripts.`;

        // Construct evolving memory text from issue & comments
        const issueMemory = issueContext ? `Issue Title: ${issueContext.title}\nIssue Body: ${issueContext.body}\nRecent Comments:\n${issueComments.map(c => `- ${c.user.login}: ${truncate(c.body, 300)}`).join('\n')}` : '';

        let modelResp;
        if (process.env.GITHUB_TOKEN === 'dummy') {
            modelResp = { reasoning: 'Local test mode; skipping real model call.', patches: [{ file: 'scripts/cleanup.sh', action: 'create', content: '#!/bin/bash\necho test' }] };
        } else {
            modelResp = await callModel({ model, systemPrompt, userPrompt: prompt + (issueMemory ? ('\nMemory Context:\n' + issueMemory) : ''), endpoint: modelsEndpoint });
        }

        // Quick size safety: refuse if any patch exceeds 50KB
        const oversized = modelResp.patches.find(p => p.content && Buffer.byteLength(p.content, 'utf-8') > 50 * 1024);
        if (oversized) {
            core.setFailed(`Patch for ${oversized.file} exceeds 50KB limit.`);
            return;
        }

        if (modelResp.patches.length > maxPatchFiles) {
            core.setFailed(`Refusing to create PR: patch file count ${modelResp.patches.length} exceeds limit ${maxPatchFiles}`);
            return;
        }

        if (mode === 'apply') {
            core.info('Apply mode placeholder: In future will execute merged scripts or remote diagnostics.');
            core.setOutput('applied', 'true');
            return;
        }

        // If running locally with dummy token, skip GitHub PR creation (test harness mode)
        if (process.env.GITHUB_TOKEN === 'dummy') {
            core.warning('Detected dummy token, skipping GitHub API calls (local test mode).');
            core.info(JSON.stringify(modelResp, null, 2));
            core.setOutput('pr_number', '0');
            core.setOutput('applied', 'false');
            return;
        }

        // Create branch & commit patches (propose mode)
        const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
        const { owner, repo } = github.context.repo;

        const baseRef = github.context.ref.replace('refs/heads/', '') || 'main';
        const branchName = await ensureProposalBranch(octokit, owner, repo, prompt);

        const baseSha = await getRefSha(octokit, owner, repo, baseRef);
        const treeItems = [];

        for (const p of modelResp.patches) {
            const filePath = p.file;
            treeItems.push({
                path: filePath,
                mode: '100644',
                type: 'blob',
                content: p.content
            });
        }

        const newTree = await octokit.rest.git.createTree({ owner, repo, base_tree: baseSha, tree: treeItems });
        const commit = await octokit.rest.git.createCommit({ owner, repo, message: `Pythagoras proposal update: ${prompt}`, tree: newTree.data.sha, parents: [baseSha] });
        await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${branchName}`, sha: commit.data.sha, force: true });

        // Find existing PR for branch
        const prs = await octokit.rest.pulls.list({ owner, repo, head: `${owner}:${branchName}`, state: 'open' });
        let pr;
        if (prs.data.length) {
            pr = prs.data[0];
            const updatedBody = generatePrBody({ prompt, modelResp, kb, mcpConfigs, issueContext, issueComments });
            await octokit.rest.pulls.update({ owner, repo, pull_number: pr.number, body: updatedBody });
        } else {
            pr = await octokit.rest.pulls.create({ owner, repo, title: `Pythagoras Fix Proposal: ${prompt.substring(0, 60)}`, head: branchName, base: baseRef, body: generatePrBody({ prompt, modelResp, kb, mcpConfigs, issueContext, issueComments }) });
        }
        core.setOutput('pr_number', pr.number);

        if (dryRun) {
            core.info('Dry run enabled: not waiting for merge to apply actions.');
            core.setOutput('applied', 'false');
            return;
        }

        // Post-merge application would be done in a separate workflow triggered on PR merge using the same action with mode=apply (not yet implemented)
        core.info('Awaiting human review. Merge will trigger application phase.');
        core.setOutput('applied', 'false');

    } catch (err) {
        core.setFailed(err.message);
    }
}

async function fetchIssue(number) {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const { owner, repo } = github.context.repo;
    const issue = await octokit.rest.issues.get({ owner, repo, issue_number: number });
    return issue.data;
}

async function fetchIssueComments(number, limit) {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const { owner, repo } = github.context.repo;
    const comments = await octokit.rest.issues.listComments({ owner, repo, issue_number: number, per_page: limit });
    return comments.data.slice(-limit); // ensure latest subset
}

async function ensureProposalBranch(octokit, owner, repo, prompt) {
    const baseName = 'pythagoras/proposal';
    // Try existing branches
    const branches = await octokit.rest.repos.listBranches({ owner, repo, per_page: 100 });
    const existing = branches.data.find(b => b.name.startsWith(baseName));
    if (existing) return existing.name;
    // Create new branch with timestamp suffix
    return `${baseName}-${Date.now()}`;
}

function truncate(str, max) { return str.length > max ? str.slice(0, max) + '…' : str; }

async function getRefSha(octokit, owner, repo, ref) {
    const branch = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${ref}` });
    return branch.data.object.sha;
}

function generatePrBody({ prompt, modelResp, kb, mcpConfigs, issueContext, issueComments = [] }) {
    let body = `## Pythagoras Proposal\n\n**Prompt:** ${prompt}\n\n`;
    if (issueContext) body += `**Issue #${issueContext.number}:** ${issueContext.title}\n\n${issueContext.body}\n\n`;
    body += `### Reasoning\n${modelResp.reasoning}\n\n### Proposed Changes (${modelResp.patches.length} file(s))\n`;
    modelResp.patches.forEach(p => { body += `- ${p.action.toUpperCase()} \`${p.file}\`\n`; });
    if (kb.length) {
        body += `\n### Knowledge Base Referenced\n` + kb.map(k => `- ${k.name}`).join('\n');
    }
    if (mcpConfigs.length) {
        body += `\n\n### MCP Servers\n` + mcpConfigs.map(c => `- ${c.name}`).join('\n');
    }
    if (issueComments.length) {
        body += `\n\n### Recent Issue Comments (memory)\n` + issueComments.map(c => `- @${c.user.login}: ${truncate(c.body.replace(/\n/g, ' '), 120)}`).join('\n');
    }
    body += `\n\n> Human review required. Merge will trigger application phase.`;
    return body;
}

// Auto-run unless in test environment
if (process.env.NODE_ENV !== 'test') {
    run();
}

export { run };
