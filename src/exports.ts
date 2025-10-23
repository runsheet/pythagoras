// Configuration
export { ConfigLoader } from './config/config-loader.js';
export type { AgentConfiguration, KnowledgeBase, MCPServerConfig } from './config/types.js';

// Tools
export { ToolsManager } from './tools/tools-manager.js';
export type { ToolInfo } from './tools/tools-manager.js';

// Memory
export { GitHubMemoryManager } from './memory/github-memory.js';
export type { GitHubChatMessage } from './memory/github-memory.js';

// Agent
export { PlanExecuteAgent } from './agent/plan-execute-agent.js';
export type {
  PlanStep,
  ExecutionPlan,
  ExecutionResult,
  StepResult,
  FilePatch,
} from './agent/plan-execute-agent.js';

// PR Management
export { PRManager } from './pr/pr-manager.js';
export type { PRInfo } from './pr/pr-manager.js';
