# Pythagoras AI Fixer GitHub Action

Pythagoras is a human-in-the-loop AI automation action. It reads a prompt (and optionally an issue), gathers repository context, knowledge base documents, and MCP (Model Context Protocol) server configurations, then proposes changes via a Pull Request. After human review & merge, a follow-up workflow can apply runtime fixes (e.g., executing scripts, SSH diagnostics) using the merged artifacts.

## Key Features

- Uses GitHub Models (default: `gpt-4.1-mini`) with optional override input.
- Knowledge base ingestion from `knowledge_base/` plain text/markdown files.
- MCP server configuration ingestion from `config/mcp/*.yml`.
- Safety guards: limit number of changed files (hard limit 25) and per-file size (50KB).
- Human-in-the-loop: always proposes via PR; a separate workflow can perform apply phase.
- Convention over configuration: minimal action inputs, relies on repo structure.
- Extensible architecture (SOLID services: config, memory, model, git, render).

## Inputs (Current Minimal Set)

| Name                | Description                                                | Default        |
| ------------------- | ---------------------------------------------------------- | -------------- |
| `working_directory` | Root path for conventions (KB, MCP, system prompt).        | `.`            |
| `model`             | GitHub Model ID to use.                                    | `gpt-4.1-mini` |
| `issue_number`      | Issue number to seed memory context (title/body/comments). | (optional)     |
| `user_prompt_path`  | File path containing a user prompt (fallback if no issue). | (optional)     |

## Outputs

| Name        | Description                                  |
| ----------- | -------------------------------------------- |
| `pr_number` | The created (or updated) proposal PR number. |

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
          working_directory: .
          issue_number: ${{ github.event.issue.number }}
      - name: Run Pythagoras (manual prompt file)
        if: github.event_name == 'workflow_dispatch'
        uses: ./. # local action
        with:
          working_directory: .
          model: ${{ inputs.model }}
          user_prompt_path: prompts/request.md
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

## Model Call Implementation & Endpoint/Token Resolution

During `loadConfig()` the action resolves:

- Bearer token from `GITHUB_TOKEN` env (required unless using dummy mode).
- Model endpoint from `PYTHAGORAS_MODEL_ENDPOINT` (falls back to `https://models.github.ai/inference/chat/completions`).

It then performs a real HTTPS POST (Node `https`) to the endpoint.

Override example:

```yaml
env:
  PYTHAGORAS_MODEL_ENDPOINT: https://my-proxy.internal/inference/chat/completions
```

The model is instructed to return a fenced JSON block with keys `reasoning` and `patches`; these patches become proposed file changes. In local development you can set `GITHUB_TOKEN=dummy` to exercise logic without remote calls.

## Safety & Limits

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
