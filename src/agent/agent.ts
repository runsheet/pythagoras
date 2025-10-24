import { createAgent, createMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { InMemoryStore, MemorySaver } from "@langchain/langgraph";

import { AgentConfiguration } from '../config/types.js';
import { ExecutionResult, PythangorasAgent } from "./types.js";
import { ToolsManager } from '../tools/tools-manager.js';
import { GitHubMemoryManager } from '../memory/github-memory.js';
import { BaseMessage, HumanMessage, Message, SystemMessage } from "@langchain/core/messages";

/**
 * Plan and Execute Agent using LangChain
 */
export class ToolsAgent implements PythangorasAgent {
  private model: ChatOpenAI;
  private config: AgentConfiguration;
  private toolsManager: ToolsManager;
  private memory: GitHubMemoryManager;

  constructor(
    config: AgentConfiguration,
    toolsManager: ToolsManager,
    memory: GitHubMemoryManager,
    modelName = 'gpt-4o'
  ) {
    this.config = config;
    this.toolsManager = toolsManager;
    this.memory = memory;

    // Initialize OpenAI model
    this.model = new ChatOpenAI({
      modelName,
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Run the complete agent workflow: plan and execute
   */
  async run(objective: string): Promise<ExecutionResult> {
    console.log(`Starting agent workflow for: ${objective}`);

    const checkpointer = new MemorySaver();
    const store = new InMemoryStore();

    const tools = await this.toolsManager.getTools();
    const agent = createAgent({
      model: this.model,
      tools: tools,
      checkpointer,
      store,
    });

    const messages: BaseMessage[] = [
      new SystemMessage(`You are a helpful AI agent designed to assist with the following objective: ${objective}`),
      new HumanMessage(`Please assist with the objective: ${objective}`),
    ]

    const result = await agent.invoke({ messages })
    console.log(result)

    console.log('Agent workflow completed');
    throw new Error("Not implemented")
  }
}
