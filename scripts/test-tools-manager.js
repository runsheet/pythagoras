#!/usr/bin/env node

/**
 * Test script for ToolsManager
 *
 * Usage:
 *   npm run test:tools
 *   # or
 *   node scripts/test-tools-manager.js [working-directory]
 *
 * Example:
 *   node scripts/test-tools-manager.js ./example
 */

import * as pythagoras from '../dist/index.js';

const { ConfigLoader, ToolsManager } = pythagoras;

async function testToolsManager() {
  console.log('🔧 Testing ToolsManager\n');

  // Get working directory from args or use default
  const workingDirectory = process.argv[2] || './example';
  console.log(`Working Directory: ${workingDirectory}\n`);

  try {
    // Step 1: Load configuration
    console.log('📋 Step 1: Loading configuration...');
    const configLoader = new ConfigLoader(workingDirectory);
    const config = await configLoader.loadConfiguration();
    console.log(`✅ Loaded configuration`);
    console.log(`   - System prompt: ${config.systemPrompt.substring(0, 100)}...`);
    console.log(`   - Knowledge bases: ${config.knowledgeBases.length}`);
    console.log(`   - MCP servers: ${config.mcpServers.size}\n`);

    // Step 2: Initialize ToolsManager
    console.log('🔌 Step 2: Initializing ToolsManager...');
    const toolsManager = new ToolsManager();
    await toolsManager.initialize(config.mcpServers);
    console.log('✅ ToolsManager initialized\n');

    // Step 3: List all tools
    console.log('📝 Step 3: Listing all tools...\n');
    const tools = toolsManager.listTools();

    if (tools.length === 0) {
      console.log('⚠️  No tools found. Make sure MCP servers are configured correctly.\n');
      console.log('Available MCP servers:');
      for (const [name, config] of config.mcpServers.entries()) {
        console.log(`  - ${name}: ${config.command} ${(config.args || []).join(' ')}`);
      }
    } else {
      console.log(`Found ${tools.length} tool(s):\n`);
      console.log('═'.repeat(80));

      tools.forEach((tool, index) => {
        console.log(`\n${index + 1}. ${tool.name}`);
        console.log('─'.repeat(80));
        console.log(`Description: ${tool.description || 'No description'}`);
        console.log(`\nInput Schema:`);
        console.log(JSON.stringify(tool.inputSchema, null, 2));
        console.log('═'.repeat(80));
      });

      // Step 4: Show tools by server
      console.log('\n\n📊 Tools by Server:\n');
      for (const [serverName] of config.mcpServers.entries()) {
        const serverTools = toolsManager.getServerTools(serverName);
        console.log(`${serverName}: ${serverTools.length} tool(s)`);
        serverTools.forEach((tool) => {
          console.log(`  - ${tool.name}`);
        });
        console.log();
      }
    }

    // Step 5: Cleanup
    console.log('🧹 Step 5: Cleaning up...');
    await toolsManager.cleanup();
    console.log('✅ Cleanup completed\n');

    console.log('✨ ToolsManager test completed successfully!');
  } catch (error) {
    console.error('\n❌ Error testing ToolsManager:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testToolsManager();
