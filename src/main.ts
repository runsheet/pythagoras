import * as core from '@actions/core';
import * as github from '@actions/github';
import { ConfigLoader } from './config/config-loader.js';
import { ToolsManager } from './tools/tools-manager.js';
import { GitHubMemoryManager } from './memory/github-memory.js';
import { PlanExecuteAgent } from './agent/plan-execute-agent.js';
import { PRManager } from './pr/pr-manager.js';

/**
 * Main entry point for the Pythagoras AI Agent GitHub Action
 */
export async function run(): Promise<void> {
  try {
    // Get inputs
    const workingDirectory = core.getInput('working_directory') || './example';
    const model = core.getInput('model') || 'gpt-4o';
    const issueNumberStr = core.getInput('issue_number');
    const userPromptPath = core.getInput('user_prompt_path');

    // Get GitHub context
    const token = process.env.GITHUB_TOKEN || '';
    const context = github.context;
    const owner = context.repo.owner;
    const repo = context.repo.repo;

    console.log('🚀 Starting Pythagoras AI Agent');
    console.log(`Working Directory: ${workingDirectory}`);
    console.log(`Model: ${model}`);

    // Determine issue number
    let issueNumber: number;
    if (issueNumberStr) {
      issueNumber = parseInt(issueNumberStr, 10);
    } else if (context.payload.issue?.number) {
      issueNumber = context.payload.issue.number;
    } else {
      throw new Error(
        'No issue number provided. Please specify issue_number input or trigger from an issue event.'
      );
    }

    console.log(`Issue Number: #${issueNumber}`);

    // Step 1: Load configuration
    console.log('\n📋 Step 1: Loading configuration...');
    const configLoader = new ConfigLoader(workingDirectory);
    const config = await configLoader.loadConfiguration();
    console.log('✅ Configuration loaded');

    // Step 2: Initialize Tools Manager
    console.log('\n🔧 Step 2: Initializing tools...');
    const toolsManager = new ToolsManager();
    await toolsManager.initialize(config.mcpServers);
    const tools = toolsManager.listTools();
    console.log(`✅ Initialized ${tools.length} tool(s)`);

    // Step 3: Initialize GitHub Memory
    console.log('\n💭 Step 3: Loading conversation history...');
    const memory = new GitHubMemoryManager(token, owner, repo, issueNumber);
    await memory.loadMessages();
    console.log('✅ Memory loaded');

    // Step 4: Create and run the agent
    console.log('\n🤖 Step 4: Creating execution plan...');
    const agent = new PlanExecuteAgent(config, toolsManager, memory, model);

    // Get objective from issue or user prompt
    let objective = '';
    if (userPromptPath) {
      const fs = await import('fs');
      objective = fs.readFileSync(userPromptPath, 'utf-8');
    } else {
      const octokit = github.getOctokit(token);
      const issue = await octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });
      objective = `${issue.data.title}\n\n${issue.data.body || ''}`;
    }

    // Run the agent
    const result = await agent.run(objective);
    console.log('✅ Agent execution completed');

    // Step 5: Create Pull Request
    if (result.patches.length > 0) {
      console.log('\n📝 Step 5: Creating Pull Request...');
      const prManager = new PRManager(token, owner, repo);
      const prInfo = await prManager.createPR(
        issueNumber,
        `Fix for issue #${issueNumber}`,
        result.summary,
        result.patches
      );

      console.log(`✅ PR created: #${prInfo.number}`);
      console.log(`   URL: ${prInfo.url}`);

      // Set output
      core.setOutput('pr_number', prInfo.number.toString());
      core.setOutput('pr_url', prInfo.url);
    } else {
      console.log('\n⚠️ No patches generated, skipping PR creation');
      await memory.addAIMessage(
        `⚠️ **No Changes Required**\n\nThe analysis is complete, but no file changes are needed at this time.\n\n${result.summary}`
      );
    }

    // Step 6: Cleanup
    console.log('\n🧹 Cleaning up...');
    await toolsManager.cleanup();
    console.log('✅ Cleanup completed');

    console.log('\n✨ Pythagoras AI Agent completed successfully!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', errorMessage);
    core.setFailed(errorMessage);
  }
}
