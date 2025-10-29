// Configuration
export { ConfigLoader } from './config/config-loader';
export type { AgentConfiguration, KnowledgeBase } from './config/types';

// Tools
export { ToolsManager } from './tools/tools-manager';

// Memory
export { GitHubMemoryManager } from './memory/github-memory';
export type { GitHubChatMessage } from './memory/github-memory';

// Agent
export { PlanExecuteAgent } from './agent/plan-execute-agent';
export type {
  PlanStep,
  ExecutionPlan,
  ExecutionResult,
  StepResult,
  FilePatch,
} from './agent/types';

// PR Management
export { PRManager } from './pr/pr-manager';
export type { PRInfo } from './pr/pr-manager';
