import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MCPServerConfig } from '../config/types.js';

/**
 * Tool information returned from MCP servers
 */
export interface ToolInfo {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * ToolsManager manages MCP server connections and provides tool discovery
 */
export class ToolsManager {
  private clients: Map<string, Client> = new Map();
  private tools: Map<string, ToolInfo[]> = new Map();

  /**
   * Initialize MCP servers from configuration
   */
  async initialize(mcpServers: Map<string, MCPServerConfig>): Promise<void> {
    for (const [serverName, config] of mcpServers.entries()) {
      try {
        await this.connectToServer(serverName, config);
      } catch (error) {
        console.error(`Failed to connect to MCP server ${serverName}:`, error);
      }
    }
  }

  /**
   * Connect to a single MCP server
   */
  private async connectToServer(serverName: string, config: MCPServerConfig): Promise<void> {
    console.log(`Connecting to MCP server: ${serverName}`);

    // Create transport based on configuration
    const envVars: Record<string, string> = {};

    // Copy process.env, filtering out undefined values
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        envVars[key] = value;
      }
    }

    // Override with config.env
    if (config.env) {
      Object.assign(envVars, config.env);
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: envVars,
    });

    // Create and initialize client
    const client = new Client(
      {
        name: `pythagoras-${serverName}`,
        version: '0.1.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    this.clients.set(serverName, client);

    // List available tools from this server
    const toolsList = await client.listTools();
    const serverTools: ToolInfo[] = toolsList.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema as {
        type: string;
        properties?: Record<string, unknown>;
        required?: string[];
      },
    }));

    this.tools.set(serverName, serverTools);
    console.log(`Discovered ${serverTools.length} tool(s) from ${serverName}`);
  }

  /**
   * Get all available tools from all connected MCP servers
   */
  listTools(): ToolInfo[] {
    const allTools: ToolInfo[] = [];
    for (const tools of this.tools.values()) {
      allTools.push(...tools);
    }
    return allTools;
  }

  /**
   * Get tools from a specific server
   */
  getServerTools(serverName: string): ToolInfo[] {
    return this.tools.get(serverName) || [];
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    // Find which server has this tool
    for (const [serverName, tools] of this.tools.entries()) {
      const tool = tools.find((t) => t.name === toolName);
      if (tool) {
        const client = this.clients.get(serverName);
        if (!client) {
          throw new Error(`Client not found for server: ${serverName}`);
        }

        console.log(`Calling tool ${toolName} on server ${serverName}`);
        const result = await client.callTool({
          name: toolName,
          arguments: args,
        });

        return result;
      }
    }

    throw new Error(`Tool not found: ${toolName}`);
  }

  /**
   * Get a specific client by server name
   */
  getClient(serverName: string): Client | undefined {
    return this.clients.get(serverName);
  }

  /**
   * Cleanup and close all connections
   */
  async cleanup(): Promise<void> {
    for (const [serverName, client] of this.clients.entries()) {
      try {
        await client.close();
        console.log(`Closed connection to ${serverName}`);
      } catch (error) {
        console.error(`Error closing connection to ${serverName}:`, error);
      }
    }

    this.clients.clear();
    this.tools.clear();
  }
}
