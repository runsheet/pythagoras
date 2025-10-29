# Quick Test Examples

## 1. Test ToolsManager

```bash
# Make sure you're in the project directory
cd /home/chris/workspace/runsheet/pythagoras

# Test with the example configuration
npm run test:tools
```

**Expected Output:**

```
🔧 Testing ToolsManager

Working Directory: ./example

📋 Step 1: Loading configuration...
✅ Loaded configuration
   - System prompt: You are Pythagoras, an autonomous, human-in-the-loop...
   - Knowledge bases: 1
   - MCP servers: 1

🔌 Step 2: Initializing ToolsManager...
Connecting to MCP server: test
Discovered X tool(s) from test
✅ ToolsManager initialized

📝 Step 3: Listing all tools...

Found X tool(s):
[List of tools with descriptions and schemas]
```

## 2. Test PlanExecuteAgent

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=sk-your-api-key-here

# Test with default objective
npm run test:agent

# Or with custom objective
npm run test:agent -- "Create a disk cleanup script for build servers"
```

**Expected Output:**

```
🤖 Testing Plan & Execute Agent

Working Directory: ./example
Objective: Create a disk cleanup script for build servers
Model: gpt-4o

[Configuration loading...]
[Tools initialization...]
[Memory setup...]
[Agent execution...]

📋 Execution Plan:
   Objective: Create a disk cleanup script for build servers
   Reasoning: [Agent's reasoning]

   Steps:
   1. Analyze disk usage patterns
   2. Create cleanup script
   3. Add error handling
   4. Document usage

[Step execution results...]

📄 Generated Patches:
   1. ✨ create: scripts/cleanup-disk-space.sh
   2. ✨ create: docs/cleanup-procedure.md
```

## 3. Compare Different Models

```bash
# Test with GPT-4o (default, most capable)
npm run test:agent -- "Add monitoring to API endpoints"

# Test with GPT-4o-mini (faster, cheaper)
MODEL=gpt-4o-mini npm run test:agent -- "Add monitoring to API endpoints"
```

## 4. Save Results for Analysis

```bash
# Save results to JSON file
SAVE_RESULTS=1 npm run test:agent -- "Optimize database queries"

# Results saved to: test-results-[timestamp].json
# You can then analyze the JSON file
cat test-results-*.json | jq .
```

## 5. Test with Custom Configuration

```bash
# Create custom config directory
mkdir -p ./test-config/knowledge-base
mkdir -p ./test-config/mcp-servers

# Copy and modify
cp example/system-prompt.md ./test-config/
echo "# Custom Knowledge" > ./test-config/knowledge-base/custom.md

# Test with custom config
npm run package && node scripts/test-tools-manager.js ./test-config
npm run package && node scripts/test-plan-execute-agent.js ./test-config "Test objective"
```

## 6. Debug MCP Server Issues

```bash
# Test tools to see if MCP servers are connecting
npm run test:tools

# If you see "No tools found", check:
# 1. MCP server configuration in example/mcp-servers/*.yml
# 2. Environment variables (GITHUB_TOKEN, etc.)
# 3. Docker is running (if using Docker-based servers)
```

## 7. Test Different Objectives

```bash
# Infrastructure
npm run test:agent -- "Set up automated backup system"

# Code improvements
npm run test:agent -- "Add input validation to user registration"

# Bug fixes
npm run test:agent -- "Fix memory leak in worker process"

# Documentation
npm run test:agent -- "Create API documentation for payment endpoints"

# DevOps
npm run test:agent -- "Create deployment pipeline for staging environment"
```

## Notes

- **First time?** Make sure to set `OPENAI_API_KEY`
- **No MCP servers?** That's OK, agent will still work without external tools
- **Slow?** Try `MODEL=gpt-4o-mini` for faster testing
- **Want details?** Check the full output in the terminal

## Troubleshooting Quick Reference

```bash
# Build failed?
npm install
npm run package

# Missing API key?
export OPENAI_API_KEY=sk-your-key-here

# Want verbose output?
DEBUG=* npm run test:agent -- "Your objective"

# Check what's in dist/?
ls -la dist/

# Clean build?
rm -rf dist/
npm run package
```

## Next Steps

After testing:

1. ✅ Review the generated plans and patches
2. ✅ Adjust your system prompt if needed
3. ✅ Add relevant knowledge bases
4. ✅ Configure MCP servers
5. ✅ Test in a real GitHub issue
