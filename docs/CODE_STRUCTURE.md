# Code Structure

## Entry Points

### `src/index.ts`

The main entry point for the bundled GitHub Action. This file:

- Executes the `run()` function when the action is triggered
- Exports all components for testing and programmatic use
- Serves as the public API for the package

**Usage in GitHub Action:**

```typescript
// This is what gets executed in GitHub Actions
import { run } from './main.js';
run();
```

**Usage for testing/programmatic:**

```typescript
import { ConfigLoader, ToolsManager, PlanExecuteAgent } from './index.js';

// Use individual components
const config = await new ConfigLoader('./example').loadConfiguration();
// ...
```

### `src/main.ts`

Contains the GitHub Action workflow implementation. This file:

- Defines the `run()` function
- Handles GitHub Actions inputs and outputs
- Orchestrates the complete agent workflow
- Manages error handling and logging

**Separation of Concerns:**

- `main.ts` - GitHub Actions-specific logic
- `index.ts` - Entry point and exports
- Individual components - Reusable, testable modules

## Component Structure

```
src/
├── index.ts                    # Entry point + exports
├── main.ts                     # GitHub Action logic
├── config/
│   ├── types.ts               # Type definitions
│   └── config-loader.ts       # Configuration loading
├── tools/
│   └── tools-manager.ts       # MCP tools management
├── memory/
│   └── github-memory.ts       # GitHub-based memory
├── agent/
│   └── plan-execute-agent.ts  # LangChain agent
└── pr/
    └── pr-manager.ts          # PR management
```

## Build Output

The TypeScript files are bundled into:

```
dist/
└── index.js                   # Single bundled file
```

This bundle includes:

- The `run()` function that executes when the action starts
- All exported components for testing
- All dependencies rolled up

## Why This Structure?

1. **Cleaner Separation**: GitHub Action logic separated from reusable components
2. **Better Testing**: Components can be imported and tested individually
3. **Maintainability**: Easy to understand what runs in Actions vs. what's reusable
4. **Flexibility**: Components can be used in other contexts (CLI, web app, etc.)

## Examples

### Using in GitHub Action

```yaml
# .github/workflows/pythagoras.yml
- uses: ./
  # Automatically runs src/main.ts:run()
```

### Using in Tests

```javascript
// scripts/test-tools-manager.js
import { ToolsManager } from '../dist/index.js';

const toolsManager = new ToolsManager();
await toolsManager.initialize(mcpServers);
```

### Using Programmatically

```typescript
// your-script.ts
import { ConfigLoader, PlanExecuteAgent } from 'pythagoras-action';

const config = await new ConfigLoader('./config').loadConfiguration();
const agent = new PlanExecuteAgent(config, tools, memory);
const result = await agent.run(objective);
```
