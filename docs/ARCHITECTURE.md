# Pythagoras AI Agent Architecture

This document describes the architecture of the Pythagoras AI Agent, a configurable autonomous agent with human-in-the-loop capabilities.

## Overview

Pythagoras is built with a modular architecture that supports:

- Configurable system prompts, knowledge bases, and MCP servers
- LangChain-based Plan and Execute agent pattern
- GitHub issues/comments as persistent memory
- Automatic PR creation for human review

## Components

### 1. Configuration Loader (`src/config/`)

**ConfigLoader** loads the agent configuration from a working directory:

```typescript
const configLoader = new ConfigLoader('./example');
const config = await configLoader.loadConfiguration();
```

Configuration includes:

- **system-prompt.md**: Defines agent behavior and guidelines
- **knowledge-base/**: Domain-specific documentation (markdown/text files)
- **mcp-servers/**: YAML configurations for MCP server connections

### 2. Tools Manager (`src/tools/`)

**ToolsManager** manages Model Context Protocol (MCP) server connections:

```typescript
const toolsManager = new ToolsManager();
await toolsManager.initialize(config.mcpServers);

// List all available tools
const tools = toolsManager.listTools();

// Call a specific tool
const result = await toolsManager.callTool('tool-name', { arg: 'value' });
```

Features:

- Connects to MCP servers via StdioClientTransport
- Discovers available tools from each server
- Provides unified interface for tool execution
- Automatic cleanup on shutdown

### 3. Memory Manager (`src/memory/`)

**GitHubMemoryManager** uses GitHub issues and comments as persistent memory:

```typescript
const memory = new GitHubMemoryManager(token, owner, repo, issueNumber);
await memory.loadMessages();

// Get conversation history
const messages = await memory.getMessages();

// Add new messages (automatically posts as comments)
await memory.addAIMessage('Agent response here');
await memory.addUserMessage('User feedback here');
```

Features:

- Loads issue body and comments as conversation history
- Automatically distinguishes between user and bot messages
- Persists new messages as GitHub comments
- Compatible with LangChain's BaseChatMessageHistory

### 4. Plan and Execute Agent (`src/agent/`)

**PlanExecuteAgent** implements the Plan-Execute pattern with LangChain:

```typescript
const agent = new PlanExecuteAgent(config, toolsManager, memory, 'gpt-4o');

// Run the agent with an objective
const result = await agent.run('Fix disk space issue on build servers');
```

The agent workflow:

1. **Planning Phase**:
   - Analyzes the objective with context (system prompt, knowledge bases, conversation history)
   - Creates a detailed execution plan with numbered steps
   - Each step includes action, reasoning, and optional tool reference

2. **Execution Phase**:
   - Executes each step sequentially
   - Updates memory with step results
   - Continues even if individual steps fail

3. **Summary Phase**:
   - Generates execution summary
   - Creates file patches for proposed changes
   - Returns complete ExecutionResult

### 5. PR Manager (`src/pr/`)

**PRManager** handles Pull Request creation for human-in-the-loop review:

```typescript
const prManager = new PRManager(token, owner, repo);

// Create a PR with patches
const prInfo = await prManager.createPR(issueNumber, 'Fix disk space issues', summary, patches);

// Update an existing PR
await prManager.updatePR(prNumber, newSummary, newPatches);
```

Features:

- Creates a unique branch for each proposal
- Applies file patches (create/update/delete)
- Generates detailed PR description with change summary
- Links PR back to the original issue
- Supports PR updates with new changes

## Workflow

### Complete Agent Workflow

```
┌─────────────────┐
│  GitHub Issue   │
│   + Comments    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         1. Load Configuration           │
│  - System Prompt                        │
│  - Knowledge Bases                      │
│  - MCP Server Configs                   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      2. Initialize Tools Manager        │
│  - Connect to MCP Servers               │
│  - Discover Available Tools             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│       3. Load Memory from Issue         │
│  - Issue body as initial message        │
│  - Comments as conversation history     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         4. Plan and Execute             │
│  ┌─────────────────────────────┐       │
│  │  A. Create Plan             │       │
│  │   - Analyze objective       │       │
│  │   - Review context          │       │
│  │   - Generate steps          │       │
│  └──────────┬──────────────────┘       │
│             │                           │
│             ▼                           │
│  ┌─────────────────────────────┐       │
│  │  B. Execute Steps           │       │
│  │   - For each step:          │       │
│  │     * Execute action        │       │
│  │     * Update memory         │       │
│  │     * Handle errors         │       │
│  └──────────┬──────────────────┘       │
│             │                           │
│             ▼                           │
│  ┌─────────────────────────────┐       │
│  │  C. Generate Summary        │       │
│  │   - Summarize results       │       │
│  │   - Create file patches     │       │
│  └──────────┬──────────────────┘       │
└─────────────┼───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│        5. Create Pull Request           │
│  - Create branch                        │
│  - Apply patches                        │
│  - Generate PR description              │
│  - Link to issue                        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Human Review   │
│   & Approval    │
└─────────────────┘
```

## Usage

### As a GitHub Action

```yaml
- name: Run Pythagoras Agent
  uses: ./
  with:
    working_directory: './example'
    model: 'gpt-4o'
    issue_number: ${{ github.event.issue.number }}
```

### Programmatic Usage

```typescript
import {
  ConfigLoader,
  ToolsManager,
  GitHubMemoryManager,
  PlanExecuteAgent,
  PRManager,
} from './exports.js';

// Initialize components
const config = await new ConfigLoader('./example').loadConfiguration();
const tools = new ToolsManager();
await tools.initialize(config.mcpServers);
const memory = new GitHubMemoryManager(token, owner, repo, issueNumber);
await memory.loadMessages();

// Run agent
const agent = new PlanExecuteAgent(config, tools, memory);
const result = await agent.run(objective);

// Create PR
if (result.patches.length > 0) {
  const prManager = new PRManager(token, owner, repo);
  await prManager.createPR(issueNumber, title, result.summary, result.patches);
}

// Cleanup
await tools.cleanup();
```

## Configuration Format

### System Prompt (system-prompt.md)

Plain text/markdown file defining agent behavior, principles, and guidelines.

### Knowledge Base (knowledge-base/\*.md)

Directory of markdown/text files with domain-specific knowledge:

```
knowledge-base/
  ├── disk_space.md       # Disk space diagnostics
  ├── deployment.md       # Deployment procedures
  └── monitoring.md       # Monitoring guidelines
```

### MCP Servers (mcp-servers/\*.yml)

YAML files configuring MCP server connections:

```yaml
# mcp-servers/github.yml
command: docker
args:
  - run
  - -i
  - --rm
  - -e
  - GITHUB_PERSONAL_ACCESS_TOKEN
  - ghcr.io/github/github-mcp-server
env:
  GITHUB_PERSONAL_ACCESS_TOKEN: ${GITHUB_TOKEN}
```

## Environment Variables

- `GITHUB_TOKEN`: GitHub token for API access (required)
- `OPENAI_API_KEY`: OpenAI API key for LangChain (required)
- MCP server-specific env vars as configured

## Extension Points

### Custom Tools

Add new MCP server configurations in `mcp-servers/`:

```yaml
# mcp-servers/custom-tool.yml
command: /path/to/tool
args:
  - --mode
  - server
env:
  TOOL_API_KEY: ${TOOL_API_KEY}
```

### Custom Knowledge

Add domain-specific docs in `knowledge-base/`:

```markdown
# knowledge-base/custom-domain.md

## Custom Domain Guidelines

Your guidelines here...
```

### Custom System Prompt

Modify `system-prompt.md` to change agent behavior:

```markdown
You are a specialized agent for [specific domain].

Core principles:

1. [Principle 1]
2. [Principle 2]
   ...
```

## Safety & Best Practices

1. **Human Review Required**: All changes go through PR review before execution
2. **Auditability**: Full conversation history in GitHub issues
3. **Reversibility**: Changes are in branches, easy to revert
4. **Rate Limiting**: Consider GitHub API rate limits
5. **Token Limits**: Monitor LLM token usage for long conversations
6. **Error Handling**: Agent continues on step failures, logs errors

## Troubleshooting

### MCP Server Connection Issues

- Check command path and arguments
- Verify environment variables are set
- Check server logs for errors
- Ensure docker/command is available

### Memory/API Issues

- Verify GITHUB_TOKEN has required permissions
- Check issue number is valid
- Ensure repo access is granted

### Agent Execution Issues

- Check OPENAI_API_KEY is set
- Verify model name is correct
- Review system prompt for clarity
- Check knowledge base files exist

## Future Enhancements

- [ ] Support for multiple LLM providers
- [ ] Streaming responses for long-running operations
- [ ] Tool result caching
- [ ] Advanced planning with backtracking
- [ ] Parallel step execution
- [ ] Custom tool definition without MCP
- [ ] Web UI for configuration
