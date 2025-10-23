# Pythagoras AI Agent - Visual Architecture

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    PYTHAGORAS AI AGENT                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   Configuration                         │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │   │
│  │  │ System       │  │ Knowledge   │  │ MCP          │  │   │
│  │  │ Prompt       │  │ Bases       │  │ Servers      │  │   │
│  │  │              │  │             │  │              │  │   │
│  │  │ .md file     │  │ .md files   │  │ .yml files   │  │   │
│  │  └──────────────┘  └─────────────┘  └──────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   Tools Manager                         │   │
│  │                                                          │   │
│  │  • Connects to MCP Servers                              │   │
│  │  • Discovers Available Tools                            │   │
│  │  • Provides listTools() API                             │   │
│  │  • Executes Tool Calls                                  │   │
│  └────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                   Memory Manager                        │   │
│  │                                                          │   │
│  │  • Loads Issue Body                                     │   │
│  │  • Loads Comments as History                            │   │
│  │  • Distinguishes User/AI Messages                       │   │
│  │  • Posts New Comments                                   │   │
│  └────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                Plan & Execute Agent                     │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │            PLANNING PHASE                         │  │   │
│  │  │                                                    │  │   │
│  │  │  1. Analyze Objective                             │  │   │
│  │  │  2. Review Context (prompt, KB, history)          │  │   │
│  │  │  3. Consider Available Tools                      │  │   │
│  │  │  4. Generate Execution Plan                       │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                         ↓                               │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │           EXECUTION PHASE                         │  │   │
│  │  │                                                    │  │   │
│  │  │  For Each Step:                                   │  │   │
│  │  │    • Execute Action                               │  │   │
│  │  │    • Update Memory (post comment)                 │  │   │
│  │  │    • Handle Errors                                │  │   │
│  │  │    • Continue to Next Step                        │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │                         ↓                               │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │            SUMMARY PHASE                          │  │   │
│  │  │                                                    │  │   │
│  │  │  1. Generate Execution Summary                    │  │   │
│  │  │  2. Create File Patches                           │  │   │
│  │  │  3. Prepare PR Description                        │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
│                            ↓                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                    PR Manager                           │   │
│  │                                                          │   │
│  │  • Create Unique Branch                                 │   │
│  │  • Apply File Patches                                   │   │
│  │  • Generate PR Description                              │   │
│  │  • Link to Issue                                        │   │
│  │  • Post Comment on Issue                                │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                  ┌────────────────────────┐
                  │   Pull Request         │
                  │   (Human Review)       │
                  └────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│ GitHub Issue │
│   + Label    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    GitHub Action Trigger                     │
└──────┬───────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    src/index.ts (Main)                       │
│                                                              │
│  1. Get inputs (working_directory, model, issue_number)     │
│  2. Initialize all components                               │
│  3. Orchestrate workflow                                    │
│  4. Handle errors                                           │
│  5. Set outputs (pr_number, pr_url)                         │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────┐
       │                                      │
       ▼                                      ▼
┌─────────────────┐                  ┌──────────────────┐
│ ConfigLoader    │                  │ ToolsManager     │
│                 │                  │                  │
│ Load:           │                  │ • Connect to     │
│ • system-prompt │                  │   MCP servers    │
│ • knowledge-base│                  │ • List tools     │
│ • mcp-servers   │                  │ • Call tools     │
└────────┬────────┘                  └─────────┬────────┘
         │                                     │
         └──────────────┬──────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ GitHubMemoryManager   │
            │                       │
            │ • Load issue          │
            │ • Load comments       │
            │ • Parse as messages   │
            │ • Post new comments   │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ PlanExecuteAgent      │
            │                       │
            │ • Create plan         │
            │ • Execute steps       │
            │ • Generate patches    │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ PRManager             │
            │                       │
            │ • Create branch       │
            │ • Apply patches       │
            │ • Create PR           │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ Pull Request Created  │
            └───────────────────────┘
```

## MCP Integration

```
┌────────────────────────────────────────────────────────────┐
│                     MCP Servers                            │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   GitHub     │  │     AWS      │  │    Slack     │   │
│  │   Server     │  │    Server    │  │   Server     │   │
│  │              │  │              │  │              │   │
│  │  Tools:      │  │  Tools:      │  │  Tools:      │   │
│  │  • issues    │  │  • ec2       │  │  • message   │   │
│  │  • prs       │  │  • s3        │  │  • channel   │   │
│  │  • repos     │  │  • lambda    │  │  • user      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │           │
│         └──────────────────┴──────────────────┘           │
│                            │                              │
└────────────────────────────┼──────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   ToolsManager       │
                  │                      │
                  │   Map<serverName,    │
                  │        client>       │
                  │                      │
                  │   Map<serverName,    │
                  │        tools[]>      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  listTools() API     │
                  │                      │
                  │  Returns all tools   │
                  │  from all servers    │
                  └──────────────────────┘
```

## Memory System

```
┌──────────────────────────────────────────────────────────────┐
│                        GitHub Issue                          │
│                                                              │
│  Title: Build server out of disk space                      │
│  Body:  Our build agents keep running out...                │
│  Labels: [pythagoras]                                        │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                     Comment Thread                           │
│                                                              │
│  User: We need to diagnose and fix this                     │
│  ↓                                                           │
│  Bot: 🤖 Pythagoras has started working on this issue       │
│  ↓                                                           │
│  Bot: 📋 Execution Plan Created                             │
│      1. Check disk usage                                    │
│      2. Create cleanup script                               │
│      3. Add scheduled workflow                              │
│  ↓                                                           │
│  Bot: ✅ Step 1: Check disk usage                           │
│       Identified /tmp and build cache as issues             │
│  ↓                                                           │
│  Bot: ✅ Step 2: Create cleanup script                      │
│       Created scripts/cleanup-disk-space.sh                 │
│  ↓                                                           │
│  Bot: ✅ Step 3: Add scheduled workflow                     │
│       Created .github/workflows/cleanup.yml                 │
│  ↓                                                           │
│  Bot: 🤖 Pythagoras has created a proposal                  │
│       Pull Request: #123                                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
           ┌───────────────────────┐
           │ GitHubMemoryManager   │
           │                       │
           │ messages: [           │
           │   HumanMessage(...),  │
           │   AIMessage(...),     │
           │   HumanMessage(...),  │
           │   AIMessage(...)      │
           │ ]                     │
           └───────────────────────┘
```

## File Structure

```
pythagoras/
│
├── src/                              # Source code
│   ├── index.ts                      # Main entry point
│   ├── exports.ts                    # Public API
│   │
│   ├── config/                       # Configuration
│   │   ├── types.ts                  # Type definitions
│   │   └── config-loader.ts          # Loader implementation
│   │
│   ├── tools/                        # Tool management
│   │   └── tools-manager.ts          # MCP integration
│   │
│   ├── memory/                       # Memory management
│   │   └── github-memory.ts          # GitHub integration
│   │
│   ├── agent/                        # Agent logic
│   │   └── plan-execute-agent.ts     # LangChain agent
│   │
│   └── pr/                           # PR management
│       └── pr-manager.ts             # PR creation
│
├── example/                          # Example configuration
│   ├── system-prompt.md              # Agent prompt
│   ├── knowledge-base/               # Domain knowledge
│   │   └── disk_space.md
│   └── mcp-servers/                  # Tool configs
│       └── test.yml
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md               # System design
│   └── QUICKSTART.md                 # Setup guide
│
├── dist/                             # Built output
│   └── index.js                      # Bundled action
│
├── .github/workflows/                # Workflows
│   └── pythagoras.yml                # Main workflow
│
├── action.yml                        # Action definition
├── package.json                      # Dependencies
├── rollup.config.ts                  # Build config
└── tsconfig.json                     # TypeScript config
```

## Execution Timeline

```
Time: 0s
│
├─ Load Configuration (1-2s)
│  └─ Read system-prompt.md
│  └─ Read knowledge-base/*.md
│  └─ Read mcp-servers/*.yml
│
├─ Initialize Tools (2-5s)
│  └─ Connect to MCP server 1
│  └─ Connect to MCP server 2
│  └─ List all tools
│
├─ Load Memory (1-2s)
│  └─ Fetch issue
│  └─ Fetch comments
│  └─ Parse as messages
│
├─ Planning Phase (5-15s)
│  └─ Analyze objective
│  └─ Review context
│  └─ Generate plan
│  └─ Post plan to issue
│
├─ Execution Phase (10-60s)
│  └─ Execute step 1
│  │  └─ Run LLM inference
│  │  └─ Post result to issue
│  └─ Execute step 2
│  │  └─ Run LLM inference
│  │  └─ Post result to issue
│  └─ Execute step N
│     └─ Run LLM inference
│     └─ Post result to issue
│
├─ Summary Phase (5-10s)
│  └─ Generate summary
│  └─ Create file patches
│
├─ PR Phase (2-5s)
│  └─ Create branch
│  └─ Apply patches
│  └─ Create PR
│  └─ Link to issue
│
└─ Complete
   Total: 25-100s depending on complexity
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     Technology Stack                        │
│                                                             │
│  Frontend: N/A (GitHub Actions only)                       │
│                                                             │
│  Backend:                                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ TypeScript      - Type-safe implementation           │ │
│  │ Node.js 24+     - Runtime environment                │ │
│  │ LangChain       - Agent framework                    │ │
│  │ OpenAI API      - LLM inference                      │ │
│  │ MCP SDK         - Tool protocol                      │ │
│  │ GitHub API      - Issues, PRs, comments              │ │
│  │ Rollup          - Build system                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Infrastructure:                                           │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ GitHub Actions  - CI/CD platform                     │ │
│  │ GitHub Secrets  - Credential storage                 │ │
│  │ GitHub Issues   - Memory/conversation                │ │
│  │ GitHub PRs      - Change proposals                   │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

This visual architecture document provides a comprehensive view of how all components work together in the Pythagoras AI Agent system.
