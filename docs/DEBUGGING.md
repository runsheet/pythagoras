# VS Code Debugging Guide

This guide explains how to debug the Pythagoras AI Agent using VS Code's built-in debugger.

## Prerequisites

1. Ensure you've built the project at least once:

   ```bash
   npm run package
   ```

2. Set up your environment variables:
   - `OPENAI_API_KEY` - Required for agent debugging
   - `GITHUB_TOKEN` - Optional, required for full workflow debugging

## Available Debug Configurations

Open the **Run and Debug** panel in VS Code (Ctrl+Shift+D / Cmd+Shift+D) to access these configurations:

### 1. Debug Tools Manager

**Purpose:** Step through MCP server initialization and tool discovery.

**What it does:**

- Loads configuration from `example/` directory
- Initializes MCP servers defined in `example/mcp-servers/*.yml`
- Lists all available tools with their schemas
- Allows you to inspect tool definitions and MCP client connections

**Use this when:**

- Testing MCP server configurations
- Debugging tool loading issues
- Inspecting tool schemas and descriptions
- Verifying MCP client connections

**Breakpoint suggestions:**

- `src/tools/tools-manager.ts:initialize()` - Watch MCP server startup
- `src/tools/tools-manager.ts:listTools()` - See tool discovery
- `src/config/config-loader.ts:loadMCPServers()` - Inspect config parsing

### 2. Debug Plan Execute Agent

**Purpose:** Step through the full agent planning and execution cycle.

**What it does:**

- Runs the agent with a test objective (customizable in launch.json args)
- Uses mock memory (no GitHub API calls)
- Creates plan, executes steps, generates patches
- Saves results to `agent-test-results.json`

**Use this when:**

- Testing agent planning logic
- Debugging step execution
- Inspecting LangChain prompt construction
- Verifying patch generation

**Breakpoint suggestions:**

- `src/agent/plan-execute-agent.ts:run()` - Start of agent workflow
- `src/agent/plan-execute-agent.ts:createPlan()` - Watch planning phase
- `src/agent/plan-execute-agent.ts:executePlan()` - Step through execution
- `src/agent/plan-execute-agent.ts:generatePatches()` - See patch creation

**Customizing the objective:**
Edit the `args` array in `.vscode/launch.json`:

```json
"args": [
  "Your custom objective here"
]
```

### 3. Debug Main Workflow (run)

**Purpose:** Debug the full GitHub Action workflow end-to-end.

**What it does:**

- Runs the complete `run()` function from `src/main.ts`
- Simulates GitHub Actions environment with env vars
- Loads config, initializes tools, runs agent, creates PR
- Automatically builds the project before launching (preLaunchTask)

**Use this when:**

- Testing the full integration workflow
- Debugging PR creation logic
- Verifying GitHub API interactions
- Testing with actual GitHub tokens

**Required environment variables:**

- `OPENAI_API_KEY` - Your OpenAI API key
- `GITHUB_TOKEN` - Your GitHub personal access token (for PR creation)

**Breakpoint suggestions:**

- `src/main.ts:run()` - Start of workflow
- `src/pr/pr-manager.ts:createPR()` - Watch PR creation
- `src/memory/github-memory.ts:loadMessages()` - See memory loading

### 4. Debug Tools Manager (TypeScript)

**Purpose:** Debug the TypeScript source directly without building.

**Note:** Requires `ts-node` to be installed. This configuration runs the script directly from TypeScript source files, which can be slower but allows you to modify code without rebuilding.

### 5. Debug Agent (TypeScript)

**Purpose:** Debug the agent TypeScript source directly without building.

**Note:** Same as above, runs directly from TypeScript source using `ts-node`.

### 6. Debug Tools + Agent (Compound)

**Purpose:** Run both the Tools Manager and Agent debuggers simultaneously.

**Use this when:**

- Comparing tool loading vs agent execution
- Testing parallel scenarios
- Debugging interactions between components

## Debugging Workflow

### Basic Debugging

1. **Set Breakpoints:**
   - Click in the gutter (left of line numbers) to set breakpoints
   - Red dots indicate active breakpoints

2. **Start Debugging:**
   - Select a configuration from the dropdown
   - Press F5 or click the green play button

3. **Debug Controls:**
   - **Continue (F5):** Resume execution until next breakpoint
   - **Step Over (F10):** Execute current line, don't enter functions
   - **Step Into (F11):** Enter into function calls
   - **Step Out (Shift+F11):** Exit current function
   - **Restart (Ctrl+Shift+F5):** Restart debug session
   - **Stop (Shift+F5):** Stop debugging

4. **Inspect Variables:**
   - View local variables in the **Variables** panel
   - Hover over variables in the editor
   - Use the **Watch** panel to monitor specific expressions
   - Use the **Debug Console** to evaluate expressions

### Advanced Techniques

#### Conditional Breakpoints

Right-click a breakpoint → "Edit Breakpoint" → Add condition:

```javascript
toolName === 'filesystem';
step.name === 'Analyze codebase';
```

#### Logpoints

Right-click in gutter → "Add Logpoint":

```javascript
Tool loaded: {toolInfo.name}
Executing step: {step.name}
```

#### Debug Console

While paused, use the Debug Console to:

- Evaluate expressions: `console.log(tools.length)`
- Call functions: `await this.listTools()`
- Inspect objects: `JSON.stringify(config, null, 2)`

## Common Debugging Scenarios

### Debugging MCP Server Connections

1. Select **Debug Tools Manager**
2. Set breakpoint in `src/tools/tools-manager.ts:initialize()`
3. Step through to watch each MCP server connect
4. Inspect `this.clients` to see active connections

### Debugging Agent Planning

1. Select **Debug Plan Execute Agent**
2. Set breakpoint in `src/agent/plan-execute-agent.ts:createPlan()`
3. Watch the LLM prompt construction
4. Inspect the returned plan structure

### Debugging Tool Execution

1. Select **Debug Plan Execute Agent**
2. Set breakpoint in `src/agent/plan-execute-agent.ts:executePlan()`
3. Step through each tool call
4. Inspect tool results in the variables panel

### Debugging PR Creation

1. Select **Debug Main Workflow**
2. Ensure `GITHUB_TOKEN` is set
3. Set breakpoint in `src/pr/pr-manager.ts:createPR()`
4. Watch file operations and GitHub API calls

## Troubleshooting

### Source Maps Not Working

If breakpoints show as unverified or you can't see source code:

1. Rebuild with source maps:

   ```bash
   npm run package
   ```

2. Verify `rollup.config.ts` has `sourcemap: true`

3. Check that `.vscode/launch.json` includes:
   ```json
   "sourceMaps": true,
   "outFiles": ["${workspaceFolder}/dist/**/*.js"]
   ```

### Environment Variables Not Loading

1. Check your system environment variables
2. Add them directly to the configuration in `.vscode/launch.json`:

   ```json
   "env": {
     "OPENAI_API_KEY": "your-key-here"
   }
   ```

3. Use a `.env` file (requires dotenv package)

### Debugger Won't Start

1. Ensure Node.js is installed: `node --version`
2. Build the project first: `npm run package`
3. Check for TypeScript errors: `npm run lint`
4. Restart VS Code

## Tips

1. **Use Smart Step:** Enabled by default, skips over property getters/setters
2. **Skip Node Internals:** `"skipFiles": ["<node_internals>/**"]` is already configured
3. **Console Output:** Set `"console": "integratedTerminal"` to see rich output
4. **Auto Build:** The "Debug Main Workflow" config automatically builds before launching
5. **Multiple Sessions:** You can run multiple debug sessions simultaneously

## Example Debug Session

Here's a typical debugging workflow:

1. **Start with Tools Manager:**

   ```
   F5 → Select "Debug Tools Manager"
   Set breakpoint in tools-manager.ts:listTools()
   Watch tool discovery process
   ```

2. **Move to Agent:**

   ```
   F5 → Select "Debug Plan Execute Agent"
   Set breakpoint in plan-execute-agent.ts:createPlan()
   Inspect generated plan
   Step through execution
   ```

3. **Test Full Workflow:**
   ```
   F5 → Select "Debug Main Workflow"
   Set breakpoints in main.ts
   Watch entire process end-to-end
   ```

## Related Documentation

- [Testing Guide](../TESTING.md) - Non-debug testing approaches
- [Architecture](ARCHITECTURE.md) - System design and components
- [Code Structure](CODE_STRUCTURE.md) - File organization

## Next Steps

After debugging:

1. Fix any issues found
2. Run tests: `npm run test:tools` and `npm run test:agent`
3. Build: `npm run package`
4. Deploy to GitHub Actions

Happy debugging! 🐛🔍
