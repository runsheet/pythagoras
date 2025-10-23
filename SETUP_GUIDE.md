# Pythagoras AI Agent - Setup & Usage Guide

## 🎯 What You Have

A fully functional, configurable AI Agent with:

✅ **Configurable Components**:
- System prompts
- Knowledge bases
- MCP server integrations

✅ **LangChain Integration**:
- Plan and Execute agent pattern
- Structured reasoning and execution

✅ **GitHub Integration**:
- Issues/comments as persistent memory
- Automatic PR creation for human review

✅ **MCP Tool Discovery**:
- Automatic connection to MCP servers
- Tool listing and execution

## 🚀 Quick Start

### 1. Set Up Secrets

In your GitHub repository, add these secrets:

```
Settings → Secrets and variables → Actions → New repository secret
```

- `OPENAI_API_KEY`: Your OpenAI API key
- `GITHUB_TOKEN` is automatically provided by GitHub Actions

### 2. Configure Your Agent

The agent is configured via the `example/` directory:

**example/system-prompt.md** - Agent behavior:
```markdown
You are Pythagoras, an AI agent that helps diagnose and fix issues.

Core Principles:
1. Safety First - never execute destructive commands without approval
2. Human in the Loop - always present changes via PR
3. Clear Reasoning - explain your approach
...
```

**example/knowledge-base/*.md** - Domain knowledge:
```
example/knowledge-base/
├── disk_space.md       # Disk diagnostics
├── deployment.md       # Deployment procedures
└── troubleshooting.md  # Common issues
```

**example/mcp-servers/*.yml** - Tool configurations:
```yaml
# example/mcp-servers/github.yml
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

### 3. Enable the Workflow

The workflow at `.github/workflows/pythagoras.yml` is already configured.

It triggers when:
- Issue is labeled with `pythagoras`
- Comment contains `@pythagoras`

### 4. Test It!

1. **Create an Issue**:
   ```
   Title: Build server out of disk space

   Description:
   Our build server is constantly running out of disk space.
   Builds fail with "No space left on device" errors.

   Please help diagnose and create a fix.
   ```

2. **Label it**: Add the `pythagoras` label

3. **Watch the Magic** ✨:
   - Agent loads configuration
   - Connects to MCP servers
   - Loads issue as conversation context
   - Creates execution plan
   - Executes steps
   - Generates file patches
   - Creates Pull Request

4. **Review PR**:
   - Check proposed changes
   - Review reasoning
   - Approve or request changes
   - Merge when ready

## 📁 Project Structure

```
pythagoras/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── config/
│   │   ├── types.ts                # Type definitions
│   │   └── config-loader.ts        # Configuration loader
│   ├── tools/
│   │   └── tools-manager.ts        # MCP tools manager
│   ├── memory/
│   │   └── github-memory.ts        # GitHub memory integration
│   ├── agent/
│   │   └── plan-execute-agent.ts   # LangChain agent
│   └── pr/
│       └── pr-manager.ts           # PR management
├── example/                         # Configuration
│   ├── system-prompt.md
│   ├── knowledge-base/
│   │   └── disk_space.md
│   └── mcp-servers/
│       └── test.yml
├── docs/
│   ├── ARCHITECTURE.md             # Architecture details
│   └── QUICKSTART.md               # Detailed guide
├── dist/                            # Built action
└── .github/workflows/
    └── pythagoras.yml              # Workflow definition
```

## 🔧 How It Works

### Complete Flow

```
┌───────────────────┐
│  GitHub Issue     │
│  (labeled or      │
│   @mentioned)     │
└─────────┬─────────┘
          │
          ▼
┌────────────────────────────────┐
│ 1. Load Configuration          │
│    - System Prompt             │
│    - Knowledge Bases           │
│    - MCP Servers               │
└─────────┬──────────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ 2. Initialize Tools            │
│    - Connect to MCP Servers    │
│    - Discover Available Tools  │
└─────────┬──────────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ 3. Load Memory                 │
│    - Issue body                │
│    - All comments              │
│    - User/AI history           │
└─────────┬──────────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ 4. Plan & Execute              │
│                                │
│  ┌──────────────────────────┐ │
│  │ A. Create Plan           │ │
│  │    - Analyze issue       │ │
│  │    - Review context      │ │
│  │    - Generate steps      │ │
│  └────────┬─────────────────┘ │
│           │                    │
│           ▼                    │
│  ┌──────────────────────────┐ │
│  │ B. Execute Steps         │ │
│  │    - Run each step       │ │
│  │    - Update memory       │ │
│  │    - Handle errors       │ │
│  └────────┬─────────────────┘ │
│           │                    │
│           ▼                    │
│  ┌──────────────────────────┐ │
│  │ C. Generate Summary      │ │
│  │    - Summarize results   │ │
│  │    - Create patches      │ │
│  └──────────────────────────┘ │
└─────────┬──────────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ 5. Create Pull Request         │
│    - Create branch             │
│    - Apply file changes        │
│    - Link to issue             │
│    - Add review guidelines     │
└─────────┬──────────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ Human Review & Approval        │
│  → Approve & Merge             │
│  → Request Changes             │
│  → Close if incorrect          │
└────────────────────────────────┘
```

## 💡 Usage Examples

### Example 1: Disk Space Issue

**Issue**:
```
Title: Build agents running out of disk space

Description:
Build agents keep running out of disk space.
Need to diagnose and create cleanup automation.
```

**Agent Response**:
1. Creates execution plan with steps
2. Reviews disk space diagnostics knowledge
3. Proposes:
   - Cleanup script
   - Scheduled workflow
   - Documentation
4. Creates PR with all changes

### Example 2: Deployment Problem

**Issue**:
```
Title: Deployment failing on production

Description:
Production deployments fail with connection timeout.
Need to investigate and fix.
```

**Agent Response**:
1. Analyzes deployment procedures
2. Reviews logs (via MCP tools if configured)
3. Identifies root cause
4. Proposes configuration fixes
5. Creates PR with updates

### Example 3: Custom Request

**Comment on existing issue**:
```
@pythagoras Can you create a monitoring dashboard
for our API endpoints?
```

**Agent Response**:
1. Loads conversation history
2. Reviews monitoring guidelines
3. Creates dashboard configuration
4. Adds documentation
5. Creates PR

## 🎨 Customization

### Add Knowledge Base

Create new markdown files in `example/knowledge-base/`:

```markdown
# example/knowledge-base/security.md

## Security Best Practices

1. Always validate inputs
2. Use parameterized queries
3. Keep dependencies updated
...
```

### Add MCP Server

Create new YAML file in `example/mcp-servers/`:

```yaml
# example/mcp-servers/aws.yml
command: /usr/local/bin/aws-mcp-server
args:
  - --region
  - us-east-1
env:
  AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
  AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
```

### Customize System Prompt

Edit `example/system-prompt.md` to change agent behavior:

```markdown
You are a specialized agent for [your domain].

Guidelines:
- Focus on [specific area]
- Always consider [important factor]
- Prefer [approach]
...
```

### Change Model

Use different OpenAI models:

```yaml
- uses: ./
  with:
    model: 'gpt-4o-mini'  # Faster, cheaper
    # or
    model: 'gpt-4o'       # More capable
```

## 🔍 Monitoring & Debugging

### View Logs

Check GitHub Actions logs:
1. Go to Actions tab
2. Find the workflow run
3. Click on the job
4. Review detailed logs

### Check Errors

If something fails:
1. Check workflow logs for errors
2. Verify secrets are set correctly
3. Ensure MCP servers are accessible
4. Check OpenAI API status

### Enable Debug Mode

Add to workflow for more verbose logs:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
```

## 🔒 Security

### Secrets Management
- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate tokens regularly

### Permissions
Workflow has minimal required permissions:
```yaml
permissions:
  contents: write      # Create branches
  pull-requests: write # Create PRs
  issues: write        # Comment on issues
```

### Review Process
- All changes go through PR
- Human approval required
- Easy to revert if needed

## 📊 What Gets Created

When agent runs, it creates:

1. **Issue Comments**:
   - Plan acknowledgment
   - Step-by-step progress
   - Final summary

2. **Pull Request**:
   - Unique branch
   - File changes
   - Detailed description
   - Review guidelines

3. **Files** (examples):
   - `scripts/cleanup.sh`
   - `docs/procedures.md`
   - `.github/workflows/monitoring.yml`
   - Configuration updates

## 🚨 Troubleshooting

### "No issue number provided"
- Ensure workflow is triggered by issue event
- Or provide `issue_number` input

### "MCP server connection failed"
- Check server command/args
- Verify environment variables
- Ensure docker/binary is available

### "OpenAI API error"
- Verify `OPENAI_API_KEY` secret is set
- Check API key is valid
- Check for rate limits

### "Permission denied"
- Ensure workflow has correct permissions
- Check GitHub token has repo access

## 📈 Best Practices

1. **Start Simple**: Test with simple issues first
2. **Clear Issues**: Write clear, specific issue descriptions
3. **Review PRs**: Always review before merging
4. **Iterate**: Improve prompts based on results
5. **Update KB**: Keep knowledge bases current
6. **Monitor Costs**: Watch OpenAI API usage
7. **Test Safely**: Use non-production repos initially

## 📚 Next Steps

1. **Read Documentation**:
   - [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
   - [QUICKSTART.md](docs/QUICKSTART.md) - Detailed setup

2. **Customize**:
   - Update system prompt for your domain
   - Add relevant knowledge bases
   - Configure needed MCP servers

3. **Extend**:
   - Add custom MCP servers
   - Create domain-specific workflows
   - Build on top of the agent

4. **Share**:
   - Document your use cases
   - Share improvements
   - Contribute back

## 🎉 You're Ready!

Your AI Agent is fully configured and ready to use. Just:

1. Create an issue
2. Add the `pythagoras` label
3. Let the agent work
4. Review and merge the PR

Happy automating! 🚀
