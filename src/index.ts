/**
 * Entry point for the Pythagoras AI Agent GitHub Action
 *
 * This file serves two purposes:
 * 1. Runs the GitHub Action when executed
 * 2. Exports all components for testing and programmatic use
 */

import { run } from './main.js';

// Run the GitHub Action
run();

// Export the run function for testing
export { run } from './main.js';

// Export all components for testing and programmatic use
export { ConfigLoader } from './config/config-loader.js';
export { ToolsManager } from './tools/tools-manager.js';
export { GitHubMemoryManager } from './memory/github-memory.js';
export { PlanExecuteAgent } from './agent/plan-execute-agent.js';
export { PRManager } from './pr/pr-manager.js';

// Export types
export type { AgentConfiguration, KnowledgeBase, MCPServerConfig } from './config/types.js';
export type { ToolInfo } from './tools/tools-manager.js';
export type {
  PlanStep,
  ExecutionPlan,
  ExecutionResult,
  StepResult,
  FilePatch,
} from './agent/plan-execute-agent.js';
export type { PRInfo } from './pr/pr-manager.js';
