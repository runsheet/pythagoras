# Testing Guide

Quick guide to test individual components of the Pythagoras AI Agent.

## Quick Start

### 1. Test ToolsManager (MCP Integration)

See what tools are available from your MCP servers:

```bash
# Build and test
npm run test:tools
```

**Output:** Lists all tools discovered from configured MCP servers

### 2. Test PlanExecuteAgent

Test the agent's planning and execution:

```bash
# Build and test with default objective
npm run test:agent

# Or with custom objective
npm run test:agent -- "Fix disk space issue on build servers"
```

**Output:** Shows execution plan, step results, and generated patches

## Requirements

### Environment Variables

```bash
# Required for agent testing
export OPENAI_API_KEY=sk-your-api-key-here

# Optional - for GitHub MCP server
export GITHUB_TOKEN=ghp-your-token-here

# Optional - change model
export MODEL=gpt-4o-mini
```

Or create a `.env` file:

```bash
OPENAI_API_KEY=sk-your-api-key-here
GITHUB_TOKEN=ghp-your-token-here
MODEL=gpt-4o
```

## Examples

### Test MCP Tools

```bash
# List all available tools
npm run test:tools

# Test with custom config directory
npm run package && node scripts/test-tools-manager.js ./my-config
```

### Test Agent with Different Objectives

```bash
# Disk space issue
npm run test:agent -- "Fix disk space on build servers"

# Add feature
npm run test:agent -- "Add logging to payment processor"

# Fix bug
npm run test:agent -- "Fix timeout errors in API"

# Infrastructure
npm run test:agent -- "Set up monitoring dashboard"
```

### Test with Different Models

```bash
# GPT-4o (most capable, slower)
npm run test:agent -- "Your objective"

# GPT-4o-mini (faster, cheaper)
MODEL=gpt-4o-mini npm run test:agent -- "Your objective"
```

### Save Results to File

```bash
SAVE_RESULTS=1 npm run test:agent -- "Your objective"
# Results saved to: test-results-[timestamp].json
```

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"

Set your API key:

```bash
export OPENAI_API_KEY=sk-your-key-here
```

### "No tools found"

This is normal if:

- No MCP servers configured
- MCP servers failed to connect

Check your `example/mcp-servers/` configuration.

### Import errors

Build the project first:

```bash
npm run package
```

## What Gets Tested

### ToolsManager Test

✅ Configuration loading
✅ MCP server connections
✅ Tool discovery
✅ Tool details display
✅ Tools grouped by server

### Agent Test

✅ Configuration loading
✅ Tools initialization
✅ Memory management
✅ Plan creation
✅ Step execution
✅ Summary generation
✅ Patch creation

## Next Steps

1. **Review output** - Understand what the agent produces
2. **Adjust configuration** - Update prompts, KB, or servers
3. **Test again** - Iterate until satisfied
4. **Deploy** - Use in GitHub Actions

## More Information

- Full documentation: [scripts/README.md](scripts/README.md)
- Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Setup guide: [SETUP_GUIDE.md](SETUP_GUIDE.md)
