# Pythagoras AI Fixer GitHub Action

Pythagoras is a human-in-the-loop AI automation action. It reads a prompt (and optionally an issue), gathers repository context, knowledge base documents, and MCP (Model Context Protocol) server configurations, then proposes changes via a Pull Request. After human review & merge, a follow-up workflow can apply runtime fixes (e.g., executing scripts, SSH diagnostics) using the merged artifacts.

## Key Features
- Uses GitHub Models (default: `gpt-4.1-mini`) with optional override input.
- Knowledge base ingestion from `knowledge_base/` plain text/markdown files.
- MCP server configuration ingestion from `config/mcp/*.yml`.
- Safety guard: limit number of changed files (`max_patch_files`).
- Dry-run mode produces a PR without any apply phase.
- Designed for a two-phase flow: Proposal (PR) -> Application (post-merge workflow).

## Inputs
| Name | Description | Default |
|------|-------------|---------|
| `prompt` | High-level request or issue description for AI. | (required) |
| `model` | GitHub Model ID to use. | `gpt-4.1-mini` |
| `max_patch_files` | Maximum files allowed per proposal. | `25` |
| `dry_run` | If `true`, only create PR, don't apply. | `false` |
| `issue_number` | Repo issue number for extra context. | (optional) |
| `mcp_config_path` | Path to MCP config directory. | `config/mcp` |
| `knowledge_base_path` | Path to knowledge base. | `knowledge_base` |
| `models_endpoint` | Optional override of GitHub Models API endpoint. | (blank) |

## Outputs
| Name | Description |
|------|-------------|
| `pr_number` | The created PR number (if any). |
| `applied` | `true` if apply phase executed (proposal workflow sets `false`). |

## Example Workflow (Proposal Phase)
```yaml
name: Pythagoras Proposal
on:
  workflow_dispatch:
    inputs:
      prompt:
        description: 'Prompt for Pythagoras'
        required: true
      model:
        description: 'Optional model override'
        required: false
  issues:
    types: [opened]

jobs:
  propose:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: read
    steps:
      - uses: actions/checkout@v4
      - name: Run Pythagoras (issue triggered)
        if: github.event_name == 'issues'
        uses: ./. # local action
        with:
          prompt: ${{ github.event.issue.title }}
          issue_number: ${{ github.event.issue.number }}
      - name: Run Pythagoras (manual prompt)
        if: github.event_name == 'workflow_dispatch'
        uses: ./. # local action
        with:
          prompt: ${{ inputs.prompt }}
          model: ${{ inputs.model }}
```

## Example Workflow (Apply Phase After Merge)
Trigger on `pull_request` closed & merged to perform runtime actions using merged scripts/configs.
```yaml
name: Pythagoras Apply
on:
  pull_request:
    types: [closed]
jobs:
  apply:
    if: github.event.pull_request.merged == true && startsWith(github.event.pull_request.head.ref, 'pythagoras/proposal-')
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - name: Execute Fixes
        run: |
          if [ -f scripts/cleanup.sh ]; then
            bash scripts/cleanup.sh
          else
            echo 'No cleanup script found.'
          fi
```

## Knowledge Base
Place markdown or text files in `knowledge_base/`. These become part of the model context. Keep them concise; large files may need chunking in a future enhancement.

## MCP Server Configuration
Add YAML files to `config/mcp/` describing available servers/tools (schema evolves). These are surfaced to the model prompting layer for tool selection.

Example: `config/mcp/disk_inspector.yml`
```yaml
name: disk_inspector
endpoint: ssh
commands:
  - name: df
    cmd: df -h
  - name: du_tmp
    cmd: du -sh /opt/teamcity-agent/temp
```

## Human-in-the-Loop Flow (TeamCity Agent Example)
1. User opens issue: "TeamCity Agent out of disk space" (body lists agent hostname).
2. Proposal workflow runs action; model suggests adding a cleanup script + diagnostic steps.
3. PR is created with script & reasoning.
4. Reviewer approves & merges.
5. Apply workflow runs: executes `scripts/cleanup.sh`, potentially extended to SSH into agent (future enhancement: add secrets & remote execution logic).

## Model Call Implementation
The action now performs a real HTTPS POST (Node `https` core module) to the GitHub Models API (default endpoint `https://api.githubcopilot.com/chat/completions`). It:
1. Sends system + user messages.
2. Instructs the model to return a fenced JSON block with keys `reasoning` and `patches`.
3. Extracts and parses the JSON block.
4. Uses `patches` to build a tree for the proposal PR.

If your enterprise or preview setup uses a different endpoint, pass `models_endpoint` input.

## Safety & Limits
- `max_patch_files` prevents runaway edits.
- Future improvements: size diff limit, semantic approval labels, test run gating.

## Dry Run
Set `dry_run: true` to only create the proposal PR.

## Roadmap
- Real model integration
- Chunking & embedding for large KB
- Tool execution orchestration (SSH, diagnostics) via MCP server adapters
- Apply mode inside the same action (input: `mode=apply`)
- Automated test harness & linter
 - Issue & PR comment memory (implemented for issue comments)
 - PR comment memory & state persistence

## Production Build
The action now bundles source with esbuild. Regenerate `dist/index.js` after changes:
```bash
npm run build
```
Commit the updated `dist/index.js` so GitHub Actions runners can execute without installing dev dependencies.

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
