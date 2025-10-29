# Pythagoras

A TypeScript library for building AI agent systems with MCP (Model Context Protocol) server integration, LangGraph orchestration, and dynamic tool management.

## 📦 Monorepo Structure

This repository is a pnpm + Turborepo monorepo:

```
pythagoras/
├── packages/
│   └── core/          # @runsheet/pythagoras-core - Main library package
├── pnpm-workspace.yaml
├── turbo.json
└── package.json       # Root workspace coordinator
```

## Features

- **MCP Server Integration**: Connect to stdio and HTTP/SSE MCP servers
- **Tool Management**: Discover and load tool configurations from YAML
- **LangGraph Support**: Built-in adapters for LangChain and LangGraph workflows
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Flexible Configuration**: Convention-based config discovery with override options
- **Memory Management**: Context and conversation memory utilities

## Installation

```bash
npm install @runsheet/pythagoras-core
```

## Development

This project uses pnpm and Turborepo for monorepo management.

### Prerequisites

- Node.js >= 24.0.0
- pnpm >= 9.15.0

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint

# Format code
pnpm format
```

### Working with the Core Package

```bash
# Navigate to core package
cd packages/core

# Build only core
pnpm build

# Watch mode for development
pnpm build:watch

# Run tests for core
pnpm test
```

## Quick Start

### Basic Tool Manager Usage

```typescript
import { loadTools } from '@runsheet/pythagoras-core/tools';
import { join } from 'path';

// Load MCP server configurations from a directory
const tm = loadTools({
  dir: join(process.cwd(), 'config/mcp'),
  inputVars: {}
});

// List all discovered servers
for (const tool of tm.list()) {
  console.log(`${tool.name} (${tool.server.kind}): ${tool.envKeys.join(', ')}`);
}

// List tools provided by a specific server
const tools = await tm.listServerTools('github');
console.log('GitHub server tools:', tools);
```

### MCP Server Configuration

Create YAML files in your config directory (e.g., `config/mcp/github.yml`):

```yaml
name: github
command: docker
args:
  - run
  - -i
  - --rm
  - -e
  - GITHUB_PERSONAL_ACCESS_TOKEN
  - ghcr.io/github/github-mcp-server
env:
  GITHUB_PERSONAL_ACCESS_TOKEN: '${input:github_token}'
```

### Server Kind Resolution

| kind value | resolved implementation |
| ---------- | ----------------------- |
| (missing) / '' | stdio |
| stdio | stdio |
| http | http |
| sse | http (SSE streamed over HTTP) |

## API Reference

### Tools Module

```typescript
import { loadTools, ToolsManager } from '@runsheet/pythagoras-core/tools';
```

**`loadTools(opts: LoadToolsOptions): ToolsManager`**

Discovers and loads MCP server configurations from YAML files.

**`ToolsManager`**

Main class for managing MCP servers:
- `list()`: Get all registered tool records
- `get(name: string)`: Get a specific tool by name
- `listServerTools(name: string)`: List tools exposed by a server
- `addConfig(cfg: MCPServerConfig)`: Manually register a server config

### Config Module

```typescript
import { loadConfig } from '@runsheet/pythagoras-core/config';
```

Configuration management utilities for loading application settings.

### Memory Module

```typescript
import { MemoryManager } from '@runsheet/pythagoras/memory';
```

Context and conversation memory management for AI agents.

## Development

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage
```

### Building

```bash
# Build the package
npm run build

# Watch mode
npm run package:watch
```

### MCP Harness

Test MCP server connections:

```bash
npm run mcp:harness
```

Or use the VS Code launch configuration to debug the harness.

## Advanced Usage

### Custom MCP Server Configuration

You can create custom MCP server configs for various runtime environments:

**Docker-based server:**
```yaml
name: my-service
command: docker
args:
  - run
  - -i
  - --rm
  - my-mcp-server:latest
env:
  API_KEY: '${input:api_key}'
```

**HTTP/SSE server:**
```yaml
name: remote-api
kind: http
url: https://api.example.com/mcp
env:
  Authorization: 'Bearer ${input:token}'
```

**Stdio server:**
```yaml
name: local-tool
kind: stdio
command: node
args:
  - ./tools/my-mcp-server.js
```

### Tool Schema Generation

Build a schema of all available tools with their input requirements:

```typescript
import { loadTools, buildToolsSchema } from '@runsheet/pythagoras/tools';

const tm = loadTools({ dir: './config/mcp', inputVars: {} });
const schema = buildToolsSchema(tm);

console.log(JSON.stringify(schema, null, 2));
// {
//   "tools": [
//     {
//       "name": "github",
//       "inputs": [
//         { "name": "github_token", "required": false },
//         { "name": "github_host", "required": false }
//       ]
//     }
//   ]
// }
```

## Contributing

Contributions welcome! Please ensure:
- All tests pass: `npm test`
- Code is formatted: `npm run format:write`
- Linting passes: `npm run lint`

## License

MIT

- Hard cap: 25 files per proposal.
- Per-file size limit: 50KB.
- Future improvements: aggregate size diff limit, semantic approval labels, test run gating.

## Dry Run (Deprecated)

Earlier versions supported `dry_run`; current design always proposes. An apply phase is handled by a separate workflow after merge.

## Roadmap

- Embedding & chunking for large knowledge base docs.
- MCP tool invocation simulation & structured tool results.
- Apply workflow integration (automated execution frameworks).
- PR comment memory & state persistence.
- Risk scoring & automatic test gating.
- Dependency injection improvements for easier testing.

## Production Build

Bundled via Rollup + TypeScript. Rebuild after changes:

```bash
npm run package
```

Commit the updated `dist/index.js` so runners execute without dev dependency installs.

## Release Process (Suggested)

1. Update version in `package.json`.
2. Run `npm run build`.
3. Commit and push.
4. Tag release: `git tag -a v0.1.0 -m 'v0.1.0'; git push --tags`.
5. Create GitHub Release describing changes.

## .gitignore Notes

`node_modules/` is ignored; `dist/` is committed for reliability. Avoid committing large model responses or secrets.

## License

MIT
