import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { AgentConfiguration } from '../config/types.js';
import { ToolsManager, ToolInfo } from '../tools/tools-manager.js';
import { GitHubMemoryManager } from '../memory/github-memory.js';

/**
 * Represents a step in the execution plan
 */
export interface PlanStep {
  step: number;
  action: string;
  reasoning: string;
  tool?: string;
  completed: boolean;
}

/**
 * Represents the complete execution plan
 */
export interface ExecutionPlan {
  objective: string;
  steps: PlanStep[];
  reasoning: string;
}

/**
 * Result of executing a plan
 */
export interface ExecutionResult {
  plan: ExecutionPlan;
  results: StepResult[];
  summary: string;
  patches: FilePatch[];
}

/**
 * Result of executing a single step
 */
export interface StepResult {
  step: number;
  success: boolean;
  output: string;
  error?: string;
}

/**
 * File patch to be applied
 */
export interface FilePatch {
  file: string;
  action: 'create' | 'update' | 'delete';
  content?: string;
}

/**
 * Plan and Execute Agent using LangChain
 */
export class PlanExecuteAgent {
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
   * Create a plan based on the objective and context
   */
  async createPlan(objective: string): Promise<ExecutionPlan> {
    console.log('Creating execution plan...');

    // Get available tools
    const tools = this.toolsManager.listTools();
    const toolDescriptions = tools
      .map((tool: ToolInfo) => `- ${tool.name}: ${tool.description || 'No description'}`)
      .join('\n');

    // Get knowledge base context
    const knowledgeContext = this.config.knowledgeBases
      .map((kb) => `### ${kb.name}\n${kb.content}`)
      .join('\n\n');

    // Get conversation history
    const history = await this.memory.getMessages();
    const historyText = history
      .map((msg) => {
        const role = msg._getType() === 'human' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    // Escape any template syntax in the system prompt
    const systemPrompt2 = `
AVAILABLE TOOLS:
${toolDescriptions}

KNOWLEDGE BASE:
${knowledgeContext}

CONVERSATION HISTORY:
${historyText}
`;

    const userPrompt = `
Objective: ${objective}

Create a detailed execution plan to address this objective. Return a JSON object with:
{
  "objective": "restated objective",
  "reasoning": "high-level reasoning about approach",
  "steps": [
    {
      "step": 1,
      "action": "description of action",
      "reasoning": "why this step",
      "tool": "tool name if applicable",
      "completed": false
    }
  ]
}

Consider:
1. What diagnostic information is needed?
2. What tools or commands should be used?
3. What files need to be created/modified?
4. What are the potential risks?
5. How to ensure the fix is safe and reversible?

Return ONLY the JSON, no markdown formatting.
`;

    // Create planning prompt
    const planningPrompt = ChatPromptTemplate.fromMessages([
      ['system', this.escapeTemplateSyntax(this.config.systemPrompt)],
      ['system', this.escapeTemplateSyntax(systemPrompt2)],
      ['user', this.escapeTemplateSyntax(userPrompt)],
    ]);

    const chain = RunnableSequence.from([planningPrompt, this.model]);

    const response = await chain.invoke({});
    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Parse the plan
    const plan = this.parsePlan(content);
    console.log(`Created plan with ${plan.steps.length} steps`);

    // Save plan to memory
    await this.memory.addAIMessage(
      `📋 **Execution Plan Created**\n\n**Objective:** ${plan.objective}\n\n**Reasoning:** ${plan.reasoning}\n\n**Steps:**\n${plan.steps.map((s) => `${s.step}. ${s.action}`).join('\n')}`
    );

    return plan;
  }

  /**
   * Execute the plan step by step
   */
  async executePlan(plan: ExecutionPlan): Promise<ExecutionResult> {
    console.log('Executing plan...');
    const results: StepResult[] = [];

    for (const step of plan.steps) {
      console.log(`Executing step ${step.step}: ${step.action}`);

      try {
        const result = await this.executeStep(step, plan.objective);
        results.push(result);

        // Update memory with step result
        const status = result.success ? '✅' : '❌';
        await this.memory.addAIMessage(
          `${status} **Step ${step.step}:** ${step.action}\n\n${result.output}`
        );

        if (!result.success) {
          console.error(`Step ${step.step} failed:`, result.error);
          // Continue with remaining steps or decide to stop
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error executing step ${step.step}:`, error);

        results.push({
          step: step.step,
          success: false,
          output: '',
          error: errorMsg,
        });

        await this.memory.addAIMessage(`❌ **Step ${step.step} Failed:** ${errorMsg}`);
      }
    }

    // Generate final summary and patches
    const summary = await this.generateSummary(plan, results);
    const patches = await this.generatePatches(plan, results);

    return {
      plan,
      results,
      summary,
      patches,
    };
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: PlanStep, objective: string): Promise<StepResult> {
    const userPrompt = `
Objective: ${objective}
Current Step: ${step.action}
Reasoning: ${step.reasoning}

Execute this step and provide the result. If you need to use a tool, describe what you would do.
Focus on safety and explain any commands or changes you would make.

Provide a detailed output of what was done or what should be done.
`;

    // Create execution prompt
    const executionPrompt = ChatPromptTemplate.fromMessages([
      ['system', this.escapeTemplateSyntax(this.config.systemPrompt)],
      ['user', this.escapeTemplateSyntax(userPrompt)],
    ]);

    const chain = RunnableSequence.from([executionPrompt, this.model]);
    const response = await chain.invoke({});

    const output =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    return {
      step: step.step,
      success: true,
      output,
    };
  }

  /**
   * Generate summary of execution
   */
  private async generateSummary(plan: ExecutionPlan, results: StepResult[]): Promise<string> {
    const successCount = results.filter((r) => r.success).length;
    const totalSteps = results.length;

    let summary = `## Execution Summary\n\n`;
    summary += `**Objective:** ${plan.objective}\n\n`;
    summary += `**Completed:** ${successCount}/${totalSteps} steps\n\n`;
    summary += `### Results\n\n`;

    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      const step = plan.steps.find((s) => s.step === result.step);
      summary += `${status} **Step ${result.step}:** ${step?.action || 'Unknown'}\n`;
      if (result.error) {
        summary += `   Error: ${result.error}\n`;
      }
      summary += `\n`;
    }

    return summary;
  }

  /**
   * Generate file patches from execution results
   */
  private async generatePatches(plan: ExecutionPlan, results: StepResult[]): Promise<FilePatch[]> {
    console.log('Generating patches...');

    // Create prompt to generate patches
    const resultsText = results
      .map((r) => `Step ${r.step}: ${r.success ? 'Success' : 'Failed'}\nOutput: ${r.output}`)
      .join('\n\n');

    const userPrompt = `
Based on the following execution results, generate file patches that implement the fixes.

Execution Results:
${resultsText}

Return a JSON array of patches:
[
  {
    "file": "path/to/file",
    "action": "create or update or delete",
    "content": "file content (for create/update)"
  }
]

Guidelines:
- Create scripts in scripts/ directory with clear comments
- Use idempotent operations when possible
- Include error handling
- Add logging for observability
- Keep files under 50KB
- Maximum 25 files

Return ONLY the JSON array, no markdown formatting.
    `;

    const patchPrompt = ChatPromptTemplate.fromMessages([
      ['system', this.escapeTemplateSyntax(this.config.systemPrompt)],
      ['user', this.escapeTemplateSyntax(userPrompt)],
    ]);

    const chain = RunnableSequence.from([patchPrompt, this.model]);
    const response = await chain.invoke({});

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Parse patches
    try {
      const patches = JSON.parse(content) as FilePatch[];
      console.log(`Generated ${patches.length} patch(es)`);
      return patches;
    } catch (error) {
      console.error('Failed to parse patches:', error);
      return [];
    }
  }

  /**
   * Parse plan from LLM response
   */
  private parsePlan(content: string): ExecutionPlan {
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;

      const parsed = JSON.parse(jsonStr);
      return {
        objective: parsed.objective || 'Unknown objective',
        reasoning: parsed.reasoning || '',
        steps: parsed.steps || [],
      };
    } catch (error) {
      console.error('Failed to parse plan:', error);
      // Return a default plan
      return {
        objective: 'Failed to parse objective',
        reasoning: 'Error parsing plan from LLM response',
        steps: [
          {
            step: 1,
            action: 'Manual intervention required',
            reasoning: 'Could not parse automated plan',
            completed: false,
          },
        ],
      };
    }
  }

  /**
   * Escape template syntax to prevent LangChain from interpreting
   * curly braces in the content as template variables
   */
  private escapeTemplateSyntax(content: string): string {
    // Replace single { with {{ and single } with }} so LangChain treats them as literals
    // This regex uses negative lookahead/lookbehind to only match single braces
    const escapedContent = content
      .replace(/\{(?!\{)/g, '{{') // { not followed by {
      .replace(/(?<!\})\}/g, '}}'); // } not preceded by }
    return escapedContent;
  }

  /**
   * Run the complete agent workflow: plan and execute
   */
  async run(objective: string): Promise<ExecutionResult> {
    console.log(`Starting agent workflow for: ${objective}`);

    // Step 1: Create plan
    const plan = await this.createPlan(objective);

    // Step 2: Execute plan
    const result = await this.executePlan(plan);

    console.log('Agent workflow completed');
    return result;
  }
}
