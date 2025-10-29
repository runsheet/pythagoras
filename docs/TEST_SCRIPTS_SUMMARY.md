# Testing Your Pythagoras AI Agent

I've created standalone test scripts so you can easily test individual components!

## 🎯 What's Available

### 1. Test ToolsManager (`npm run test:tools`)

This tests your MCP server connections and shows all available tools.

**What it does:**

- Loads configuration from your working directory
- Connects to all MCP servers
- Lists all discovered tools with descriptions and schemas
- Shows tools grouped by server

**Usage:**

```bash
npm run test:tools
```

### 2. Test PlanExecuteAgent (`npm run test:agent`)

This tests the complete agent workflow with a mock memory system (no GitHub required!).

**What it does:**

- Loads configuration
- Initializes tools
- Creates execution plan
- Executes each step
- Generates file patches
- Shows complete results

**Usage:**

```bash
# Default objective
npm run test:agent

# Custom objective
npm run test:agent -- "Your objective here"

# With different model
MODEL=gpt-4o-mini npm run test:agent -- "Your objective"
```

## 🚀 Quick Start

### Prerequisites

```bash
# Required for agent testing
export OPENAI_API_KEY=sk-your-key-here

# Optional (for GitHub MCP server)
export GITHUB_TOKEN=ghp-your-token-here
```

### Run Tests

```bash
# Test MCP tools
npm run test:tools

# Test agent
npm run test:agent -- "Fix disk space on build servers"
```

## 📝 Example Outputs

### ToolsManager Test Output

```
🔧 Testing ToolsManager

Working Directory: ./example

📋 Step 1: Loading configuration...
✅ Loaded configuration

🔌 Step 2: Initializing ToolsManager...
✅ ToolsManager initialized

📝 Step 3: Listing all tools...

Found 5 tool(s):

1. create_issue
   Description: Create a new issue in a repository
   Input Schema: {...}

2. list_issues
   Description: List issues in a repository
   Input Schema: {...}

[etc...]
```

### PlanExecuteAgent Test Output

```
🤖 Testing Plan & Execute Agent

Objective: Fix disk space on build servers

[Loading and initialization...]

═══════════════════════════════════════════════
EXECUTION RESULTS
═══════════════════════════════════════════════

📋 Execution Plan:
   Objective: Fix disk space on build servers

   Steps:
   1. Diagnose disk usage
   2. Create cleanup script
   3. Add scheduled workflow
   4. Update documentation

📊 Step Results:
   ✅ Step 1: Success
   ✅ Step 2: Success
   ✅ Step 3: Success
   ✅ Step 4: Success

📄 Generated Patches:
   1. ✨ create: scripts/cleanup-disk-space.sh
   2. ✨ create: .github/workflows/cleanup.yml
   3. 📝 update: docs/maintenance.md
```

## 📚 Documentation

- **[TESTING.md](TESTING.md)** - Testing guide
- **[EXAMPLES.md](EXAMPLES.md)** - Example commands
- **[scripts/README.md](scripts/README.md)** - Detailed script documentation
- **[TESTING_QUICKREF.md](TESTING_QUICKREF.md)** - Quick reference card

## 🎨 Example Test Commands

```bash
# Test different objectives
npm run test:agent -- "Add logging to payment API"
npm run test:agent -- "Create monitoring dashboard"
npm run test:agent -- "Optimize database queries"

# Test with different models
MODEL=gpt-4o npm run test:agent -- "Your objective"
MODEL=gpt-4o-mini npm run test:agent -- "Your objective"

# Save results to file
SAVE_RESULTS=1 npm run test:agent -- "Your objective"
```

## 🔧 Files Created

```
scripts/
├── README.md                      # Detailed documentation
├── test-tools-manager.js         # Test ToolsManager
└── test-plan-execute-agent.js    # Test PlanExecuteAgent

TESTING.md                         # Testing guide
EXAMPLES.md                        # Example commands
TESTING_QUICKREF.md               # Quick reference
```

## 💡 Why This is Useful

1. **Fast Iteration** - Test changes without GitHub Actions
2. **No GitHub Required** - Agent test uses mock memory
3. **See Everything** - Detailed output of plans and patches
4. **Cost Control** - Test locally before production
5. **Debug Easily** - See exactly what the agent produces

## 🎯 Next Steps

1. **Test ToolsManager** to see your MCP tools:

   ```bash
   npm run test:tools
   ```

2. **Test Agent** with a simple objective:

   ```bash
   npm run test:agent -- "Create a hello world script"
   ```

3. **Review output** and iterate on your configuration

4. **Deploy to GitHub Actions** when satisfied

Enjoy testing! 🚀
