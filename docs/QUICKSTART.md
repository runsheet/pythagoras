# Pythagoras AI Agent - Quick Start Guide

This guide will help you get started with the Pythagoras AI Agent.

## Prerequisites

- Node.js 24.0.0 or higher
- GitHub repository with Actions enabled
- OpenAI API key
- GitHub token with repo and issues permissions

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Working Directory

Create a working directory (e.g., `example/`) with the following structure:

```
example/
├── system-prompt.md           # Agent behavior and guidelines
├── knowledge-base/            # Domain-specific knowledge
│   ├── disk_space.md
│   └── deployment.md
└── mcp-servers/               # MCP server configurations
    └── github.yml
```

### 3. Create System Prompt

Create `example/system-prompt.md`:

```markdown
You are Pythagoras, an AI agent that helps diagnose and fix issues.

Core Principles:

1. Safety First - never execute destructive commands without approval
2. Human in the Loop - always present changes via PR
3. Clear Reasoning - explain your approach
4. Minimal Changes - smallest fix that addresses the root cause

Your task is to:

1. Analyze the issue
2. Create a plan
3. Generate file patches
4. Present via Pull Request for review
```

### 4. Add Knowledge Base

Create `example/knowledge-base/disk_space.md`:

```markdown
# Disk Space Diagnostics

To diagnose disk space issues:

1. Run `df -h` to view disk usage
2. Check `/tmp` and log directories
3. Clean old files older than 7 days
4. Verify artifact cleanup is configured
```

### 5. Configure MCP Server

Create `example/mcp-servers/github.yml`:

```yaml
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

### 6. Set Environment Variables

Create `.env` file (for local testing):

```bash
GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 7. Create GitHub Workflow

Create `.github/workflows/pythagoras.yml`:

```yaml
name: Pythagoras AI Agent

on:
  issues:
    types: [opened, labeled]
  issue_comment:
    types: [created]

jobs:
  run-agent:
    # Only run when issue is labeled with 'pythagoras' or comment contains '@pythagoras'
    if: |
      (github.event_name == 'issues' && contains(github.event.issue.labels.*.name, 'pythagoras')) ||
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@pythagoras'))

    runs-on: ubuntu-latest

    permissions:
      contents: write
      pull-requests: write
      issues: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run Pythagoras Agent
        uses: ./
        with:
          working_directory: './example'
          model: 'gpt-4o'
          issue_number: ${{ github.event.issue.number }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### 8. Build the Action

```bash
npm run bundle
```

## Usage

### Triggering the Agent

1. **Create an Issue**: Create a new issue describing the problem
2. **Label it**: Add the `pythagoras` label to the issue
3. **Wait**: The agent will:
   - Analyze the issue
   - Create an execution plan
   - Generate file patches
   - Create a Pull Request for review

### Example Issue

```markdown
Title: Build server running out of disk space

Description:
Our build server (build-01.example.com) is constantly running out of disk space.
The builds are failing with "No space left on device" errors.

We need to:

- Diagnose what's consuming the space
- Create a cleanup script
- Set up automated cleanup
```

### Agent Response Flow

1. **Initial Comment**: Agent acknowledges the issue
2. **Planning**: Agent posts the execution plan
3. **Step Updates**: Agent posts progress for each step
4. **PR Creation**: Agent creates a PR with proposed fixes
5. **Human Review**: Team reviews and approves/rejects

### Example PR Content

The agent will create a PR with:

```markdown
## 🤖 Pythagoras AI Proposal

This PR addresses issue #123

### Summary

Analyzed disk space issue on build-01.example.com and created automated cleanup solution.

### Changes

- ✨ create: `scripts/cleanup-disk-space.sh` - Automated cleanup script
- 📝 update: `.github/workflows/cleanup.yml` - Scheduled cleanup workflow
- ✨ create: `docs/disk-maintenance.md` - Documentation

### Review Guidelines

1. Verify the cleanup script is safe
2. Check cron schedule is appropriate
3. Ensure no critical files are deleted
4. Test on non-production server first
```

## Testing Locally

### Run Tests

```bash
npm test
```

### Test the Action Locally

```bash
npm run local-action
```

This requires:

- A test issue in your repository
- `.env` file with credentials
- `src/main.ts` as entry point (or adjust command)

## Configuration Options

### Action Inputs

| Input               | Description              | Required | Default  |
| ------------------- | ------------------------ | -------- | -------- |
| `working_directory` | Path to config directory | No       | `.`      |
| `model`             | OpenAI model to use      | No       | `gpt-4o` |
| `issue_number`      | GitHub issue number      | Yes      | -        |
| `user_prompt_path`  | Alternative to issue     | No       | -        |

### Action Outputs

| Output      | Description       |
| ----------- | ----------------- |
| `pr_number` | Created PR number |
| `pr_url`    | URL of created PR |

## Advanced Usage

### Multiple Knowledge Bases

Add multiple files to `knowledge-base/`:

```
knowledge-base/
├── disk_space.md
├── deployment.md
├── monitoring.md
├── security.md
└── troubleshooting.md
```

All files are automatically loaded and provided as context.

### Multiple MCP Servers

Add multiple server configs:

```
mcp-servers/
├── github.yml
├── jira.yml
├── slack.yml
└── aws.yml
```

Each server's tools are discovered and made available.

### Custom Models

Use different models for different scenarios:

```yaml
- name: Run with GPT-4o
  with:
    model: 'gpt-4o'

- name: Run with GPT-4o-mini
  with:
    model: 'gpt-4o-mini'
```

### Programmatic Usage

Use the agent in your own code:

```typescript
import {
  ConfigLoader,
  ToolsManager,
  GitHubMemoryManager,
  PlanExecuteAgent,
  PRManager,
} from 'pythagoras-action';

async function runAgent() {
  // Load config
  const config = await new ConfigLoader('./config').loadConfiguration();

  // Initialize tools
  const tools = new ToolsManager();
  await tools.initialize(config.mcpServers);

  // Setup memory
  const memory = new GitHubMemoryManager(token, owner, repo, issueNumber);
  await memory.loadMessages();

  // Run agent
  const agent = new PlanExecuteAgent(config, tools, memory);
  const result = await agent.run('Your objective here');

  // Create PR
  const prManager = new PRManager(token, owner, repo);
  await prManager.createPR(issueNumber, 'Fix title', result.summary, result.patches);

  // Cleanup
  await tools.cleanup();
}
```

## Troubleshooting

### Common Issues

#### "No issue number provided"

- Ensure the workflow is triggered by an issue event
- Or provide `issue_number` input explicitly

#### "Failed to connect to MCP server"

- Verify MCP server command is correct
- Check environment variables are set
- Ensure docker/command is available in runner

#### "OpenAI API error"

- Check `OPENAI_API_KEY` is set
- Verify API key is valid
- Check for rate limiting

#### "GitHub API rate limit"

- Use authenticated requests
- Consider using GitHub Apps for higher limits
- Add delays between requests

### Debug Mode

Enable debug logging:

```yaml
- name: Run Pythagoras Agent
  uses: ./
  env:
    ACTIONS_STEP_DEBUG: true
```

### Check Logs

Review the action logs in GitHub Actions UI for detailed execution traces.

## Best Practices

1. **Start Small**: Test with simple issues first
2. **Clear Prompts**: Write clear, specific issue descriptions
3. **Review PRs**: Always review agent-generated PRs before merging
4. **Iterate**: Improve system prompt based on results
5. **Knowledge Base**: Keep knowledge bases up-to-date
6. **Security**: Never commit credentials to repository
7. **Testing**: Test on non-production environments first

## Next Steps

- Read the [Architecture Guide](./ARCHITECTURE.md)
- Customize your system prompt
- Add domain-specific knowledge bases
- Configure additional MCP servers
- Set up monitoring and alerting

## Getting Help

- Check the documentation in `docs/`
- Review example configurations in `example/`
- Open an issue for bugs or feature requests

## Security Considerations

- Store sensitive tokens in GitHub Secrets
- Use minimal permissions for GitHub token
- Review all generated code before merging
- Test in isolated environments
- Monitor agent actions and costs
- Implement approval workflows for critical changes

## License

MIT
