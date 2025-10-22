import { ModelResponse } from '../services/model/index.js';
import { KnowledgeItem, McpConfig } from '../services/memory/index.js';

// ----- Public API -----
export function renderPullRequestBody(args: {
  prompt: string;
  modelResp: ModelResponse;
  kb: KnowledgeItem[];
  mcp: McpConfig[];
  issue: any;
  comments: any[];
}) {
  const { prompt, modelResp, kb, mcp, issue, comments } = args;
  const sections: string[] = [];

  sections.push(headerSection(prompt, issue));
  sections.push(reasoningSection(modelResp));
  sections.push(changesSection(modelResp));
  if (kb.length) sections.push(kbSection(kb));
  if (mcp.length) sections.push(mcpSection(mcp));
  if (comments.length) sections.push(commentsSection(comments));
  sections.push(footerSection());

  return sections.join('\n\n');
}

// ----- Section Builders -----
function headerSection(prompt: string, issue: any): string {
  let out = `## Pythagoras Proposal\n\n**Prompt:** ${prompt}`;
  if (issue) {
    out += `\n\n**Issue #${issue.number}:** ${issue.title}\n\n${issue.body}`;
  }
  return out;
}

function reasoningSection(modelResp: ModelResponse): string {
  return `### Reasoning\n${modelResp.reasoning}`;
}

function changesSection(modelResp: ModelResponse): string {
  const lines = modelResp.patches.map(p => `- ${p.action.toUpperCase()} \`${p.file}\``);
  return `### Proposed Changes (${modelResp.patches.length} file(s))\n${lines.join('\n')}`;
}

function kbSection(items: KnowledgeItem[]): string {
  return `### Knowledge Base Referenced\n${items.map(i => `- ${i.name}`).join('\n')}`;
}

function mcpSection(items: McpConfig[]): string {
  return `### MCP Servers\n${items.map(i => `- ${i.name}`).join('\n')}`;
}

function commentsSection(comments: any[]): string {
  const lines = comments.map(c => `- @${c.user.login}: ${truncate(c.body.replace(/\n/g, ' '), 120)}`);
  return `### Recent Issue Comments (memory)\n${lines.join('\n')}`;
}

function footerSection(): string {
  return '> Human review required. Merge will trigger application phase.';
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
