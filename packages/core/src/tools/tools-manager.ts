import { Connection, MultiServerMCPClient } from '@langchain/mcp-adapters';
import { DynamicStructuredTool } from 'langchain';

/**
 * ToolsManager manages MCP server connections and provides tool discovery
 */
export class ToolsManager {
  private client: MultiServerMCPClient;
  private tools: DynamicStructuredTool[] | undefined;

  constructor(mcpServers: Map<string, Connection>) {
    const connections: Record<string, Connection> = {};
    for (const [serverName, connection] of mcpServers.entries()) {
      connections[serverName] = connection;
    }
    this.client = new MultiServerMCPClient(connections);
  }

  async initialize(): Promise<void> {
    this.client.initializeConnections();
  }

  async getTools(): Promise<DynamicStructuredTool[]> {
    if (this.tools !== undefined) {
      return this.tools || [];
    }

    const tools = await this.client.getTools();
    this.tools = tools;
    return tools;
  }

  /**
   * Cleanup and close all connections
   */
  async cleanup(): Promise<void> {
    this.client.close();
    this.tools = undefined;
  }
}
