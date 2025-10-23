# Test Scripts

This directory contains standalone test scripts for individual components of the Pythagoras AI Agent.

## Available Scripts

### 1. Test ToolsManager

Test the MCP server connection and tool discovery.

**Usage:**

```bash
# Using npm script (recommended)
npm run test:tools

# Or directly with node
npm run package && node scripts/test-tools-manager.js [working-directory]
```

**Example:**

```bash
npm run test:tools

# Or with custom working directory
npm run package && node scripts/test-tools-manager.js ./example
```

**What it does:**

1. Loads configuration from working directory
2. Connects to all configured MCP servers
3. Lists all available tools from all servers
4. Displays tool details (name, description, input schema)
5. Shows tools grouped by server

**Sample Output:**

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
Discovered 5 tool(s) from test
✅ ToolsManager initialized

📝 Step 3: Listing all tools...

Found 5 tool(s):

════════════════════════════════════════════════════════════════════════════════

1. create_issue
────────────────────────────────────────────────────────────────────────────────
Description: Create a new issue in a repository
Input Schema:
{
  "type": "object",
  "properties": {
    "repo": { "type": "string" },
    "title": { "type": "string" },
    "body": { "type": "string" }
  }
}
════════════════════════════════════════════════════════════════════════════════
...
```

**Environment Variables:**

- `GITHUB_TOKEN` - Required if using GitHub MCP server
- Other env vars as needed by your MCP servers

---

### 2. Test PlanExecuteAgent

Test the complete agent planning and execution workflow.

**Usage:**

```bash
# Using npm script (recommended)
npm run test:agent -- "Your objective here"

# Or directly with node
npm run package && node scripts/test-plan-execute-agent.js [working-directory] [objective]
```

**Examples:**

```bash
# Test with default objective
npm run test:agent

# Test with custom objective
npm run test:agent -- "Fix disk space issues on build servers"

# Test with custom working directory and objective
npm run package && node scripts/test-plan-execute-agent.js ./example "Add logging to payment processor"
```

**What it does:**

1. Loads configuration from working directory
2. Initializes ToolsManager and connects to MCP servers
3. Creates a mock memory manager (no GitHub required)
4. Creates the PlanExecuteAgent
5. Runs the agent with your objective
6. Displays:
   - Execution plan with steps
   - Step-by-step results
   - Summary of execution
   - Generated file patches

**Sample Output:**

```
🤖 Testing Plan & Execute Agent

Working Directory: ./example
Objective: Fix disk space issues on build servers
Model: gpt-4o

📋 Step 1: Loading configuration...
✅ Configuration loaded
   - System prompt length: 4523 chars
   - Knowledge bases: 1
   - MCP servers: 1

🔧 Step 2: Initializing ToolsManager...
✅ ToolsManager initialized (5 tools)

💭 Step 3: Creating mock memory...
✅ Mock memory created

🧠 Step 4: Creating PlanExecuteAgent...
✅ Agent created with model: gpt-4o

🚀 Step 5: Running agent (this may take a minute)...

════════════════════════════════════════════════════════════════════════════════
AGENT EXECUTION LOG
════════════════════════════════════════════════════════════════════════════════

🤖 AI: 📋 **Execution Plan Created**

**Objective:** Fix disk space issues on build servers...

════════════════════════════════════════════════════════════════════════════════
EXECUTION RESULTS
════════════════════════════════════════════════════════════════════════════════

📋 Execution Plan:
   Objective: Fix disk space issues on build servers
   Reasoning: Need to diagnose root cause and implement automated cleanup

   Steps:
   1. Diagnose disk space usage
      Reasoning: Identify what's consuming space
   2. Create cleanup script
      Reasoning: Automate cleanup of temporary files
   3. Add scheduled workflow
      Reasoning: Prevent future issues
   4. Update documentation
      Reasoning: Document procedure for team

📊 Step Results:

   ✅ Step 1: Success
      Output: Analyzed disk usage patterns. Found /tmp and build cache...

   ✅ Step 2: Success
      Output: Created cleanup script with safe deletion logic...

   ✅ Step 3: Success
      Output: Added GitHub Actions workflow for scheduled cleanup...

   ✅ Step 4: Success
      Output: Updated documentation with maintenance procedures...

📝 Summary:
## Execution Summary

**Objective:** Fix disk space issues on build servers

**Completed:** 4/4 steps
...

📄 Generated Patches:

   1. ✨ create: scripts/cleanup-disk-space.sh
      Content preview: #!/bin/bash
set -euo pipefail

# Cleanup script for build servers...
      Content length: 1234 bytes

   2. ✨ create: .github/workflows/cleanup.yml
      Content preview: name: Disk Space Cleanup

on:
  schedule:
    - cron: '0 2 * * *'...
      Content length: 567 bytes

   3. 📝 update: docs/maintenance.md
      Content preview: # Maintenance Procedures

## Disk Space Management...
      Content length: 890 bytes

════════════════════════════════════════════════════════════════════════════════

🧹 Step 6: Cleaning up...
✅ Cleanup completed

✨ PlanExecuteAgent test completed successfully!
```

**Required Environment Variables:**

- `OPENAI_API_KEY` - **Required** for LLM inference
- `GITHUB_TOKEN` - Required if using GitHub MCP server

**Optional Environment Variables:**

- `MODEL` - Override the model (default: `gpt-4o`)
  ```bash
  MODEL=gpt-4o-mini npm run test:agent -- "Your objective"
  ```
- `SAVE_RESULTS` - Save results to JSON file
  ```bash
  SAVE_RESULTS=1 npm run test:agent -- "Your objective"
  ```

---

## Prerequisites

### For Both Scripts

1. **Build the project first:**

   ```bash
   npm run package
   ```

2. **Environment variables:**
   - Create a `.env` file or export variables
   - Required: `OPENAI_API_KEY` (for agent test)
   - Optional: `GITHUB_TOKEN`, model-specific vars

### Example .env file

```bash
# Required for agent testing
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional - for GitHub MCP server
GITHUB_TOKEN=ghp_your-github-token-here

# Optional - override model
MODEL=gpt-4o

# Optional - save agent results to file
SAVE_RESULTS=1
```

---

## Tips

### Testing Without MCP Servers

If you don't have MCP servers configured:

1. The ToolsManager test will show 0 tools (expected)
2. The Agent will still work, just without external tools

### Testing with Mock Data

The agent test uses a mock memory manager, so it doesn't require:

- Active GitHub repository
- GitHub issue
- GitHub token (unless using GitHub MCP server)

### Saving Results

To save agent execution results:

```bash
SAVE_RESULTS=1 npm run test:agent -- "Your objective"
```

Results saved to: `test-results-[timestamp].json`

### Custom Working Directory

Both scripts support custom working directories:

```bash
npm run package && node scripts/test-tools-manager.js ./my-config
npm run package && node scripts/test-plan-execute-agent.js ./my-config "My objective"
```

---

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"

**Solution:** Set your OpenAI API key

```bash
export OPENAI_API_KEY=sk-your-key-here
```

### "Failed to connect to MCP server"

**Possible causes:**

1. MCP server command not found
2. Missing environment variables
3. Docker not running (if using Docker-based servers)

**Solution:** Check your `mcp-servers/*.yml` configuration

### "No tools found"

**This is normal if:**

1. No MCP servers are configured
2. MCP server failed to connect (check logs)

**Solution:** Configure MCP servers in your working directory

### Import errors

**Solution:** Make sure to build first:

```bash
npm run package
```

---

## Examples

### Quick Test of Everything

```bash
# Build and test tools
npm run test:tools

# Build and test agent
npm run test:agent
```

### Test with Custom Configuration

```bash
# Create custom config
mkdir -p ./custom-config/mcp-servers
cp example/system-prompt.md ./custom-config/
cp -r example/knowledge-base ./custom-config/

# Test with custom config
npm run package && node scripts/test-tools-manager.js ./custom-config
npm run package && node scripts/test-plan-execute-agent.js ./custom-config "Custom objective"
```

### Test Different Models

```bash
# Test with GPT-4o (default)
npm run test:agent -- "Your objective"

# Test with GPT-4o-mini (faster, cheaper)
MODEL=gpt-4o-mini npm run test:agent -- "Your objective"
```

---

## Development Workflow

1. **Make changes to source code**
2. **Build**: `npm run package`
3. **Test individual components**:
   - `npm run test:tools` - Test MCP integration
   - `npm run test:agent -- "objective"` - Test agent logic
4. **Iterate** based on results

---

## Next Steps

After testing:

1. Review the output to understand component behavior
2. Adjust your configuration as needed
3. Test in a real GitHub Action workflow
4. Monitor performance and costs

---

## Questions?

- See [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for component details
- See [SETUP_GUIDE.md](../SETUP_GUIDE.md) for usage guide
- Check the main [README.md](../README.md) for overview
