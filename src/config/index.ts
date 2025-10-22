import core from '@actions/core';
import path from 'path';

// ----- Types -----
export interface ActionConfig {
  workingDirectory: string;
  model: string;
  issueNumber?: number;
  userPromptPath?: string;
  maxFiles: number;
  maxFileSizeBytes: number;
  modelEndpoint: string;
  token: string;
}

// ----- Config Loader -----
export function loadConfig(): ActionConfig {
  const workingDirectory = core.getInput('working_directory') || '.';
  const modelInput = core.getInput('model') || 'gpt-4.1-mini';
  const issueNumberInput = core.getInput('issue_number');
  const userPromptPath = core.getInput('user_prompt_path') || undefined;
  const modelEndpoint = process.env.PYTHAGORAS_MODEL_ENDPOINT || 'https://models.github.ai/inference/chat/completions';
  const token = process.env.GITHUB_TOKEN || '';

  return {
    workingDirectory,
    model: modelInput,
    issueNumber: issueNumberInput ? parseInt(issueNumberInput, 10) : undefined,
    userPromptPath,
    maxFiles: 25,
    maxFileSizeBytes: 50 * 1024,
    modelEndpoint,
    token,
  };
}

// ----- Derived Paths -----
export function derivePaths(cfg: ActionConfig) {
  return {
    knowledgeBasePath: path.join(cfg.workingDirectory, 'knowledge_base'),
    mcpConfigPath: path.join(cfg.workingDirectory, 'config', 'mcp'),
    systemPromptPath: path.join(cfg.workingDirectory, 'example', 'system-prompt.md'),
  } as const;
}
