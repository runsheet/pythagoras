# 🤖 Pythagoras AI Agent - Complete Overview

## What Is This?

A **production-ready, configurable AI Agent** that:
- Reads GitHub issues
- Analyzes problems using AI
- Creates execution plans
- Generates file patches
- Opens Pull Requests for human review

Built with **LangChain**, **MCP (Model Context Protocol)**, and **GitHub Actions**.

---

## ✨ What Makes It Special?

### 1. Fully Configurable
No hardcoded behavior. Everything configured via working directory:
- `system-prompt.md` - Agent personality and guidelines
- `knowledge-base/` - Domain-specific docs
- `mcp-servers/` - External tool integrations

### 2. Plan & Execute Pattern
Uses LangChain's Plan-Execute approach:
1. **Plan**: Analyze issue, create detailed execution plan
2. **Execute**: Run each step, update progress
3. **Summarize**: Generate patches and create PR

### 3. GitHub-Native Memory
- Issues and comments = conversation history
- Persistent across runs
- Full audit trail
- No external database needed

### 4. MCP Tool Integration
- Automatic connection to MCP servers
- Tool discovery via `listTools()`
- Unified tool execution interface
- Extensible with any MCP-compatible tool

### 5. Human-in-the-Loop
- All changes via Pull Request
- Detailed reasoning provided
- Easy to review and revert
- No automatic execution

---

## 📦 What's Included?

### Core Components

```
src/
├── config/              # Configuration loading
│   ├── types.ts         # Type definitions
│   └── config-loader.ts # Loads system-prompt, KB, MCP configs
│
├── tools/               # MCP integration
│   └── tools-manager.ts # Connects to MCP servers, lists tools
│
├── memory/              # Persistent memory
│   └── github-memory.ts # Uses GitHub issues as memory
│
├── agent/               # LangChain agent
│   └── plan-execute-agent.ts # Plan & Execute pattern
│
└── pr/                  # PR management
    └── pr-manager.ts    # Creates PRs with patches
```

### Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Quick start, usage examples
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, components
- **[QUICKSTART.md](docs/QUICKSTART.md)** - Detailed setup guide
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical details

### Example Configuration

```
example/
├── system-prompt.md           # Agent behavior
├── knowledge-base/
│   └── disk_space.md         # Domain knowledge
└── mcp-servers/
    └── test.yml              # MCP server config
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Prerequisites
- GitHub repository
- OpenAI API key
- Node.js 24+ (for development)

### 2. Setup Secrets

Add to GitHub repository secrets:
- `OPENAI_API_KEY` - Your OpenAI key

### 3. Create Configuration

Already included in `example/` directory:
- ✅ `system-prompt.md` - Ready to use
- ✅ `knowledge-base/` - Sample knowledge base
- ✅ `mcp-servers/` - Sample MCP config

### 4. Trigger Agent

1. Create GitHub issue describing a problem
2. Add `pythagoras` label
3. Agent automatically:
   - Loads configuration
   - Analyzes issue
   - Creates plan
   - Generates patches
   - Opens PR

### 5. Review & Merge

- Review PR created by agent
- Check proposed changes
- Merge if approved

---

## 💡 Example Use Cases

### 1. Infrastructure Issues

**Issue**: "Build server out of disk space"

**Agent Does**:
1. Reviews disk space KB article
2. Creates cleanup script
3. Adds scheduled workflow
4. Documents procedure
5. Opens PR

### 2. Code Improvements

**Issue**: "Add logging to payment processor"

**Agent Does**:
1. Analyzes codebase
2. Identifies key functions
3. Adds logging statements
4. Updates documentation
5. Opens PR

### 3. Configuration Updates

**Issue**: "Update production deployment config"

**Agent Does**:
1. Reviews deployment KB
2. Updates configuration files
3. Validates changes
4. Documents changes
5. Opens PR

---

## 🔧 How It Works

### High-Level Flow

```
GitHub Issue
    ↓
Load Config (prompt, KB, MCP)
    ↓
Initialize Tools (connect to MCP servers)
    ↓
Load Memory (issue + comments)
    ↓
Plan (analyze with LangChain)
    ↓
Execute (run steps)
    ↓
Generate Patches
    ↓
Create PR
    ↓
Human Review
```

### Detailed Workflow

1. **Configuration Phase**
   - Load system prompt from `system-prompt.md`
   - Load knowledge bases from `knowledge-base/`
   - Load MCP configs from `mcp-servers/`

2. **Initialization Phase**
   - Connect to each MCP server
   - Discover available tools
   - Set up memory from GitHub issue

3. **Planning Phase**
   - LangChain agent analyzes objective
   - Reviews context (prompt, KB, history)
   - Creates structured execution plan
   - Each step has action, reasoning, tool

4. **Execution Phase**
   - Execute each step sequentially
   - Update issue with progress
   - Handle errors gracefully
   - Continue to completion

5. **Summary Phase**
   - Generate execution summary
   - Create file patches
   - Prepare PR description

6. **PR Phase**
   - Create unique branch
   - Apply file changes
   - Open PR with details
   - Link back to issue

---

## 🎯 Key Technologies

| Technology | Purpose |
|------------|---------|
| **LangChain** | Agent framework, Plan-Execute pattern |
| **OpenAI** | LLM for planning and execution |
| **MCP SDK** | Model Context Protocol integration |
| **GitHub API** | Issues, comments, PRs |
| **TypeScript** | Type-safe implementation |
| **Rollup** | Bundling for GitHub Actions |

---

## 📊 Configuration Format

### System Prompt

```markdown
# system-prompt.md

You are Pythagoras, an AI agent that...

Core Principles:
1. Safety First
2. Human in the Loop
3. Clear Reasoning
...
```

### Knowledge Base

```markdown
# knowledge-base/disk_space.md

## Disk Space Diagnostics

To diagnose disk space:
1. Run df -h
2. Check /tmp directories
...
```

### MCP Server

```yaml
# mcp-servers/github.yml

command: docker
args:
  - run
  - -i
  - ghcr.io/github/github-mcp-server
env:
  GITHUB_TOKEN: ${GITHUB_TOKEN}
```

---

## 🔒 Safety & Security

### Human-in-the-Loop
✅ All changes via PR review
✅ No automatic merging
✅ Easy to revert

### Audit Trail
✅ Full history in GitHub
✅ Step-by-step reasoning
✅ Clear change descriptions

### Minimal Permissions
✅ Only required GitHub permissions
✅ Secrets via GitHub Secrets
✅ No external storage needed

### Safe Defaults
✅ No destructive operations
✅ Dry-run approach
✅ Validation before changes

---

## 📈 Extending the Agent

### Add Knowledge Bases

Create new `.md` files in `knowledge-base/`:

```bash
example/knowledge-base/
├── disk_space.md
├── deployment.md      # ← Add this
├── security.md        # ← Add this
└── monitoring.md      # ← Add this
```

### Add MCP Servers

Create new `.yml` files in `mcp-servers/`:

```yaml
# mcp-servers/aws.yml
command: /usr/local/bin/aws-mcp
args: ["--region", "us-east-1"]
env:
  AWS_ACCESS_KEY_ID: ${AWS_KEY}
```

### Customize Behavior

Edit `system-prompt.md`:

```markdown
You are a specialized agent for [domain].

Focus on:
- [Priority 1]
- [Priority 2]

Always:
- [Rule 1]
- [Rule 2]
```

### Change Models

Use different OpenAI models:

```yaml
with:
  model: 'gpt-4o'        # Most capable
  # or
  model: 'gpt-4o-mini'   # Faster, cheaper
```

---

## 📝 Real-World Example

### Input (GitHub Issue)

```
Title: Production API slow response times

Description:
Our production API is experiencing slow response times (>2s).
This started after yesterday's deployment.

Affected endpoints:
- /api/users
- /api/products

Need to:
1. Diagnose the issue
2. Propose a fix
3. Add monitoring
```

### Agent Process

1. **Loads Configuration**
   - System prompt for API troubleshooting
   - KB article on performance debugging
   - GitHub MCP server for repo access

2. **Creates Plan**
   ```
   Step 1: Review recent deployment changes
   Step 2: Check database query performance
   Step 3: Add query caching
   Step 4: Add performance monitoring
   Step 5: Update documentation
   ```

3. **Executes & Updates Issue**
   ```
   🤖 Step 1: Review recent deployment changes
   Found: Database N+1 query issue in user endpoint

   🤖 Step 2: Check database query performance
   Identified: 50+ queries per request

   🤖 Step 3: Add query caching
   Created: Redis cache implementation
   ...
   ```

4. **Creates PR**
   ```
   [Pythagoras] Fix API performance issues

   Summary:
   - Added Redis caching for user queries
   - Optimized database queries
   - Added performance monitoring
   - Updated documentation

   Files changed:
   ✨ create: src/cache/redis-cache.ts
   📝 update: src/api/users.ts
   📝 update: src/api/products.ts
   ✨ create: .github/workflows/performance-monitor.yml
   📝 update: docs/api-performance.md
   ```

### Output

✅ PR ready for review
✅ Detailed reasoning provided
✅ Tests included
✅ Documentation updated
✅ Human reviews and merges

---

## 🎓 Learning Path

1. **Start Here**: Read [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. **Understand System**: Read [ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. **Try It**: Create test issue, label it
4. **Customize**: Update system prompt
5. **Extend**: Add knowledge bases
6. **Advanced**: Add MCP servers

---

## 🤝 Contributing

This is a foundational implementation. Extend it:
- Add more sophisticated planning
- Implement tool result caching
- Support multiple LLM providers
- Add streaming responses
- Build web UI for configuration
- Create domain-specific variants

---

## 📄 License

MIT License - See LICENSE file

---

## 🎉 Summary

You have a **complete, production-ready AI Agent** that:

✅ **Configurable** - System prompts, KBs, MCP servers
✅ **Intelligent** - LangChain Plan-Execute pattern
✅ **Safe** - Human-in-the-loop via PR review
✅ **Persistent** - GitHub issues as memory
✅ **Extensible** - MCP tool integration
✅ **Production-Ready** - Type-safe, tested, documented

**Start using it today!** Create an issue, add the `pythagoras` label, and watch it work. 🚀

---

## 📞 Getting Help

- **Setup Issues**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **How It Works**: See [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Quick Start**: See [QUICKSTART.md](docs/QUICKSTART.md)
- **Implementation**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
