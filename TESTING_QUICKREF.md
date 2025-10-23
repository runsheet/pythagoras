# Testing Commands Quick Reference

## Setup (One Time)

```bash
# Install dependencies
npm install

# Set environment variables
export OPENAI_API_KEY=sk-your-key-here
export GITHUB_TOKEN=ghp-your-token-here  # Optional
```

## Test Commands

### Test ToolsManager (MCP Integration)

```bash
npm run test:tools
```

Shows all tools from MCP servers.

### Test PlanExecuteAgent

```bash
# Default objective
npm run test:agent

# Custom objective
npm run test:agent -- "Your objective here"

# Different model
MODEL=gpt-4o-mini npm run test:agent -- "Your objective"

# Save results
SAVE_RESULTS=1 npm run test:agent -- "Your objective"
```

## Example Objectives

```bash
npm run test:agent -- "Fix disk space on build servers"
npm run test:agent -- "Add logging to API endpoints"
npm run test:agent -- "Create monitoring dashboard"
npm run test:agent -- "Optimize database queries"
```

## Troubleshooting

```bash
# Rebuild
npm run package

# Check API key
echo $OPENAI_API_KEY

# View build output
ls -la dist/
```

## More Help

- Full guide: [TESTING.md](TESTING.md)
- Examples: [EXAMPLES.md](EXAMPLES.md)
- Detailed docs: [scripts/README.md](scripts/README.md)
