import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AgentConfiguration, KnowledgeBase } from './types.js';
import { Connection } from '@langchain/mcp-adapters';

/**
 * ConfigLoader loads the agent configuration from a working directory
 * It loads:
 * - System prompt from system-prompt.md
 * - Knowledge bases from knowledge-base/ directory
 * - MCP server configurations from mcp-servers/ directory
 */
export class ConfigLoader {
  private workingDirectory: string;

  constructor(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  /**
   * Load the complete agent configuration
   */
  async loadConfiguration(): Promise<AgentConfiguration> {
    const systemPrompt = await this.loadSystemPrompt();
    const knowledgeBases = await this.loadKnowledgeBases();
    const mcpServers = await this.loadMCPServers();

    return {
      systemPrompt,
      knowledgeBases,
      mcpServers,
    };
  }

  /**
   * Load the system prompt from system-prompt.md
   */
  private async loadSystemPrompt(): Promise<string> {
    const systemPromptPath = path.join(this.workingDirectory, 'system-prompt.md');

    if (!fs.existsSync(systemPromptPath)) {
      throw new Error(
        `System prompt not found at ${systemPromptPath}. Please create a system-prompt.md file in the working directory.`
      );
    }

    return fs.readFileSync(systemPromptPath, 'utf-8');
  }

  /**
   * Load all knowledge base files from the knowledge-base/ directory
   */
  private async loadKnowledgeBases(): Promise<KnowledgeBase[]> {
    const knowledgeBasePath = path.join(this.workingDirectory, 'knowledge-base');

    if (!fs.existsSync(knowledgeBasePath)) {
      console.warn(
        `Knowledge base directory not found at ${knowledgeBasePath}. Continuing without knowledge bases.`
      );
      return [];
    }

    const knowledgeBases: KnowledgeBase[] = [];
    const files = fs.readdirSync(knowledgeBasePath);

    for (const file of files) {
      const filePath = path.join(knowledgeBasePath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile() && (file.endsWith('.md') || file.endsWith('.txt'))) {
        const content = fs.readFileSync(filePath, 'utf-8');
        knowledgeBases.push({
          name: file,
          content,
        });
      }
    }

    console.log(`Loaded ${knowledgeBases.length} knowledge base(s)`);
    return knowledgeBases;
  }

  /**
   * Load all MCP server configurations from the mcp-servers/ directory
   */
  private async loadMCPServers(): Promise<Map<string, Connection>> {
    const mcpServersPath = path.join(this.workingDirectory, 'mcp-servers');

    if (!fs.existsSync(mcpServersPath)) {
      console.warn(
        `MCP servers directory not found at ${mcpServersPath}. Continuing without MCP servers.`
      );
      return new Map();
    }

    const mcpServers = new Map<string, Connection>();
    const files = fs.readdirSync(mcpServersPath);

    for (const file of files) {
      if (!file.endsWith('.yml') && !file.endsWith('.yaml')) {
        continue;
      }

      const filePath = path.join(mcpServersPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      try {
        const config = yaml.load(fileContent) as Connection;
        const serverName = path.basename(file, path.extname(file));
        mcpServers.set(serverName, config);
        console.log(`Loaded MCP server configuration: ${serverName}`);
      } catch (error) {
        console.error(`Error parsing MCP server config ${file}:`, error);
      }
    }

    console.log(`Loaded ${mcpServers.size} MCP server(s)`);
    return mcpServers;
  }
}
