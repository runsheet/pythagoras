# @runsheet/pythagoras-cli

Command-line interface for the Pythagoras AI agent framework.

## Installation

```bash
pnpm install -g @runsheet/pythagoras-cli
```

## Usage

### Initialize Configuration

Create a new Pythagoras configuration in your project:

```bash
pythagoras init
```

This will create a `./mcp` directory with example MCP server configurations.

### List Available Tools

View all configured MCP servers and their available tools:

```bash
pythagoras list-tools

# Specify a custom configuration directory
pythagoras list-tools --dir ./my-mcp-config
```

### Run the Agent

Execute the Pythagoras AI agent with an objective:

```bash
pythagoras run "Analyze the codebase and suggest improvements"

# With custom options
pythagoras run "Create a new feature" --config ./config --model gpt-4o
```

## Configuration

MCP server configurations are YAML files placed in the `./mcp` directory (or a custom directory).

Example configuration (`mcp/github.yml`):

```yaml
name: github
kind: stdio
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

## Commands

- `pythagoras init` - Initialize configuration directory
- `pythagoras list-tools` - List all MCP servers and tools
- `pythagoras run <objective>` - Run the AI agent with an objective
- `pythagoras --help` - Show help information
- `pythagoras --version` - Show version information

## Environment Variables

Configure the CLI behavior with environment variables:

- `OPENAI_API_KEY` - OpenAI API key for the agent
- `GITHUB_TOKEN` - GitHub token for GitHub MCP server
- Custom environment variables as defined in your MCP configurations
