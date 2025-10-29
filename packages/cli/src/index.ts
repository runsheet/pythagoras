#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { loadTools } from '@runsheet/pythagoras-core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('pythagoras')
  .description('Pythagoras AI Agent CLI - MCP server integration and tool management')
  .version('0.1.0');

// List tools command
program
  .command('list-tools')
  .description('List all available MCP servers and their tools')
  .option('-d, --dir <directory>', 'Directory containing MCP server configurations', './mcp')
  .action(async (options) => {
    try {
      const configDir = path.resolve(process.cwd(), options.dir);
      
      if (!fs.existsSync(configDir)) {
        console.error(chalk.red(`Error: Configuration directory not found: ${configDir}`));
        process.exit(1);
      }

      console.log(chalk.blue('Loading MCP server configurations...\n'));
      
      const toolsManager = loadTools({
        dir: configDir,
        inputVars: process.env,
      });

      const servers = toolsManager.list();
      
      if (servers.length === 0) {
        console.log(chalk.yellow('No MCP servers found in the configuration directory.'));
        return;
      }

      console.log(chalk.green(`Found ${servers.length} MCP server(s):\n`));

      for (const server of servers) {
        console.log(chalk.bold(`📦 ${server.name}`) + chalk.gray(` (${server.server.kind})`));
        
        if (server.envKeys.length > 0) {
          console.log(chalk.gray(`   Environment variables: ${server.envKeys.join(', ')}`));
        }

        try {
          const tools = await toolsManager.listServerTools(server.name);
          console.log(chalk.cyan(`   Tools (${tools.length}):`));
          
          tools.forEach((tool) => {
            console.log(chalk.gray(`     - ${tool.name}`));
            if (tool.description) {
              console.log(chalk.gray(`       ${tool.description}`));
            }
          });
        } catch (error) {
          console.log(chalk.red(`   Error loading tools: ${error instanceof Error ? error.message : String(error)}`));
        }
        
        console.log('');
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Run agent command
program
  .command('run')
  .description('Run the Pythagoras AI agent')
  .option('-c, --config <path>', 'Path to configuration directory', '.')
  .option('-m, --model <name>', 'Model to use', 'gpt-4o')
  .argument('[objective]', 'The objective for the agent to accomplish')
  .action(async (objective, options) => {
    if (!objective) {
      console.error(chalk.red('Error: Objective is required'));
      program.help();
    }

    console.log(chalk.blue('🤖 Starting Pythagoras AI Agent...\n'));
    console.log(chalk.gray(`Configuration: ${options.config}`));
    console.log(chalk.gray(`Model: ${options.model}`));
    console.log(chalk.gray(`Objective: ${objective}\n`));

    // TODO: Implement agent execution
    console.log(chalk.yellow('Agent execution not yet implemented.'));
  });

// Init command to scaffold configuration
program
  .command('init')
  .description('Initialize Pythagoras configuration in the current directory')
  .option('-d, --dir <directory>', 'Directory to create configurations in', './mcp')
  .action(async (options) => {
    const configDir = path.resolve(process.cwd(), options.dir);
    
    try {
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
        console.log(chalk.green(`✓ Created configuration directory: ${configDir}`));
      }

      // Create example configuration
      const exampleConfig = `# Example MCP Server Configuration
name: example
kind: stdio
command: npx
args:
  - -y
  - @modelcontextprotocol/server-filesystem
  - /tmp
env:
  # Add any required environment variables here
`;

      const examplePath = path.join(configDir, 'example.yml');
      if (!fs.existsSync(examplePath)) {
        fs.writeFileSync(examplePath, exampleConfig);
        console.log(chalk.green(`✓ Created example configuration: ${examplePath}`));
      }

      console.log(chalk.blue('\n📝 Next steps:'));
      console.log(chalk.gray('1. Edit the MCP server configurations in:'), chalk.cyan(configDir));
      console.log(chalk.gray('2. Run'), chalk.cyan('pythagoras list-tools'), chalk.gray('to verify your setup'));
      console.log(chalk.gray('3. Run'), chalk.cyan('pythagoras run "your objective"'), chalk.gray('to start the agent'));
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
