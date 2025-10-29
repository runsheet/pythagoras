/**
 * Configuration types for Pythagoras AI Agent
 */

import { Connection } from '@langchain/mcp-adapters';

export interface AgentConfiguration {
  systemPrompt: string;
  knowledgeBases: KnowledgeBase[];
  mcpServers: Map<string, Connection>;
}

export interface KnowledgeBase {
  name: string;
  content: string;
}
