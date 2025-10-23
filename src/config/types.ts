/**
 * Configuration types for Pythagoras AI Agent
 */

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface AgentConfiguration {
  systemPrompt: string;
  knowledgeBases: KnowledgeBase[];
  mcpServers: Map<string, MCPServerConfig>;
}

export interface KnowledgeBase {
  name: string;
  content: string;
}
