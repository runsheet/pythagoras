#!/usr/bin/env node

/**
 * Test script for PlanExecuteAgent
 *
 * Usage:
 *   npm run test:agent -- "Your objective here"
 *   # or
 *   node scripts/test-plan-execute-agent.js [working-directory] [objective]
 *
 * Example:
 *   node scripts/test-plan-execute-agent.js ./example "Fix disk space issue"
 *
 * Environment Variables:
 *   OPENAI_API_KEY - Required for LLM inference
 *   GITHUB_TOKEN - Required for GitHub API access (if using GitHub MCP server)
 */

import * as pythagoras from '../dist/index.js';

const { ConfigLoader, ToolsManager, PlanExecuteAgent } = pythagoras;

// Mock memory manager for testing (doesn't require GitHub)
class MockMemoryManager {
  constructor() {
    this.messages = [];
    this.lc_namespace = ['langchain', 'stores', 'message', 'mock'];
  }

  async getMessages() {
    return this.messages;
  }

  async addMessage(message) {
    this.messages.push(message);
    const role = message._getType() === 'ai' ? '🤖 AI' : '👤 User';
    const content =
      typeof message.content === 'string'
        ? message.content.substring(0, 100)
        : String(message.content).substring(0, 100);
    console.log(`\n${role}: ${content}${content.length >= 100 ? '...' : ''}\n`);
  }

  async addMessages(messages) {
    for (const message of messages) {
      await this.addMessage(message);
    }
  }

  async clear() {
    this.messages = [];
  }

  async addUserMessage(content) {
    const { HumanMessage } = await import('@langchain/core/messages');
    await this.addMessage(new HumanMessage({ content }));
  }

  async addAIMessage(content) {
    const { AIMessage } = await import('@langchain/core/messages');
    await this.addMessage(new AIMessage({ content }));
  }
}

async function testPlanExecuteAgent() {
  console.log('🤖 Testing Plan & Execute Agent\n');

  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    console.error('   Set it with: export OPENAI_API_KEY=your-api-key');
    process.exit(1);
  }

  // Get working directory and objective from args
  const workingDirectory = process.argv[2] || './example';
  const objective =
    process.argv[3] || 'Analyze disk space issues on build servers and create a cleanup solution';

  console.log(`Working Directory: ${workingDirectory}`);
  console.log(`Objective: ${objective}`);
  console.log(`Model: ${process.env.MODEL || 'gpt-4o'}\n`);

  try {
    // Step 1: Load configuration
    console.log('📋 Step 1: Loading configuration...');
    const configLoader = new ConfigLoader(workingDirectory);
    const config = await configLoader.loadConfiguration();
    console.log('✅ Configuration loaded');
    console.log(`   - System prompt length: ${config.systemPrompt.length} chars`);
    console.log(`   - Knowledge bases: ${config.knowledgeBases.length}`);
    console.log(`   - MCP servers: ${config.mcpServers.size}\n`);

    // Step 2: Initialize ToolsManager
    console.log('🔧 Step 2: Initializing ToolsManager...');
    const toolsManager = new ToolsManager();
    await toolsManager.initialize(config.mcpServers);
    const tools = toolsManager.listTools();
    console.log(`✅ ToolsManager initialized (${tools.length} tools)\n`);

    // Step 3: Create mock memory
    console.log('💭 Step 3: Creating mock memory...');
    const memory = new MockMemoryManager();
    await memory.addUserMessage(`Issue: ${objective}`);
    console.log('✅ Mock memory created\n');

    // Step 4: Create agent
    console.log('🧠 Step 4: Creating PlanExecuteAgent...');
    const model = process.env.MODEL || 'gpt-4o';
    const agent = new PlanExecuteAgent(config, toolsManager, memory, model);
    console.log(`✅ Agent created with model: ${model}\n`);

    // Step 5: Run agent
    console.log('🚀 Step 5: Running agent (this may take a minute)...\n');
    console.log('═'.repeat(80));
    console.log('AGENT EXECUTION LOG');
    console.log('═'.repeat(80));

    const result = await agent.run(objective);

    console.log('\n═'.repeat(80));
    console.log('EXECUTION RESULTS');
    console.log('═'.repeat(80));

    // Display plan
    console.log('\n📋 Execution Plan:');
    console.log(`   Objective: ${result.plan.objective}`);
    console.log(`   Reasoning: ${result.plan.reasoning}`);
    console.log(`\n   Steps:`);
    result.plan.steps.forEach((step) => {
      console.log(`   ${step.step}. ${step.action}`);
      console.log(`      Reasoning: ${step.reasoning}`);
      if (step.tool) {
        console.log(`      Tool: ${step.tool}`);
      }
    });

    // Display results
    console.log('\n📊 Step Results:');
    result.results.forEach((stepResult) => {
      const status = stepResult.success ? '✅' : '❌';
      console.log(
        `\n   ${status} Step ${stepResult.step}: ${stepResult.success ? 'Success' : 'Failed'}`
      );
      if (stepResult.error) {
        console.log(`      Error: ${stepResult.error}`);
      }
      console.log(
        `      Output: ${stepResult.output.substring(0, 200)}${stepResult.output.length > 200 ? '...' : ''}`
      );
    });

    // Display summary
    console.log('\n📝 Summary:');
    console.log(result.summary);

    // Display patches
    console.log('\n📄 Generated Patches:');
    if (result.patches.length === 0) {
      console.log('   No patches generated');
    } else {
      result.patches.forEach((patch, index) => {
        const emoji = patch.action === 'create' ? '✨' : patch.action === 'update' ? '📝' : '🗑️';
        console.log(`\n   ${index + 1}. ${emoji} ${patch.action}: ${patch.file}`);
        if (patch.content) {
          console.log(`      Content preview: ${patch.content.substring(0, 100)}...`);
          console.log(`      Content length: ${patch.content.length} bytes`);
        }
      });
    }

    console.log('\n═'.repeat(80));

    // Step 6: Cleanup
    console.log('\n🧹 Step 6: Cleaning up...');
    await toolsManager.cleanup();
    console.log('✅ Cleanup completed\n');

    console.log('✨ PlanExecuteAgent test completed successfully!');

    // Optional: Save results to file
    if (process.env.SAVE_RESULTS) {
      const fs = await import('fs');
      const outputFile = `test-results-${Date.now()}.json`;
      fs.writeFileSync(
        outputFile,
        JSON.stringify(
          {
            plan: result.plan,
            results: result.results,
            summary: result.summary,
            patches: result.patches,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
      console.log(`\n💾 Results saved to: ${outputFile}`);
    }
  } catch (error) {
    console.error('\n❌ Error testing PlanExecuteAgent:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testPlanExecuteAgent();
