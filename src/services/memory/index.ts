import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import github from '@actions/github';

// ----- Types -----
export interface KnowledgeItem {
	name: string;
	content: string;
}

export interface McpConfig {
	name: string;
	config: any;
}

// ----- GitHub Issue Memory Fetchers -----
export async function fetchIssue(number: number) {
	const octokit = github.getOctokit(process.env.GITHUB_TOKEN as string);
	const { owner, repo } = github.context.repo;
	const issue = await octokit.rest.issues.get({ owner, repo, issue_number: number });
	return issue.data;
}

export async function fetchIssueComments(number: number, limit: number) {
	const octokit = github.getOctokit(process.env.GITHUB_TOKEN as string);
	const { owner, repo } = github.context.repo;
	const comments = await octokit.rest.issues.listComments({ owner, repo, issue_number: number, per_page: limit });
	return comments.data.slice(-limit);
}

// ----- Local Repository Context Readers -----
export function readKnowledgeBase(dir: string): KnowledgeItem[] {
	if (!fs.existsSync(dir)) return [];
	return fs.readdirSync(dir).map(f => ({
		name: f,
		content: fs.readFileSync(path.join(dir, f), 'utf-8')
	}));
}

export function readMcpConfigs(dir: string): McpConfig[] {
	if (!fs.existsSync(dir)) return [];
	return fs.readdirSync(dir)
		.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
		.map(f => ({
			name: f,
			config: yaml.load(fs.readFileSync(path.join(dir, f), 'utf-8'))
		}));
}

// ----- Memory Assembly -----
export function buildIssueMemory(issue: any, comments: any[]): string {
	if (!issue) return '';
	const recent = comments
		.map((c: any) => `- ${c.user.login}: ${truncate(c.body, 300)}`)
		.join('\n');
	return `Issue Title: ${issue.title}\nIssue Body: ${issue.body}\nRecent Comments:\n${recent}`;
}

function truncate(str: string, max: number) {
	return str.length > max ? str.slice(0, max) + '…' : str;
}
