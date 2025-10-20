import { describe, it, expect, beforeEach, vi } from 'vitest';
import core from '@actions/core';
import { run } from '../src/index.js';

// Mock @actions/core methods that interact with GitHub Actions runtime
vi.mock('@actions/core', () => ({
    default: {
        getInput: vi.fn(),
        setFailed: vi.fn(),
        setOutput: vi.fn(),
        info: vi.fn(),
        warning: vi.fn()
    }
}));

// Mock @actions/github to prevent real API calls
vi.mock('@actions/github', () => ({
    default: {
        getOctokit: () => ({
            rest: {
                git: {
                    getRef: vi.fn().mockResolvedValue({ data: { object: { sha: 'base-sha' } } }),
                    createTree: vi.fn().mockResolvedValue({ data: { sha: 'tree-sha' } }),
                    createCommit: vi.fn().mockResolvedValue({ data: { sha: 'commit-sha' } }),
                    createRef: vi.fn().mockResolvedValue({})
                },
                pulls: {
                    create: vi.fn().mockResolvedValue({ data: { number: 123 } })
                },
                issues: {
                    get: vi.fn().mockResolvedValue({ data: { number: 1, title: 'Issue', body: 'Body' } })
                }
            }
        }),
        context: {
            repo: { owner: 'o', repo: 'r' },
            ref: 'refs/heads/main'
        }
    }
}));

describe('run action', () => {
    beforeEach(() => {
        process.env.GITHUB_TOKEN = 'dummy'; // triggers local test mode bypass
        core.getInput.mockImplementation((name) => {
            const map = {
                prompt: 'Test prompt',
                model: 'gpt-4.1-mini',
                max_patch_files: '25',
                dry_run: 'true',
                issue_number: '',
                mcp_config_path: 'config/mcp',
                knowledge_base_path: 'knowledge_base',
                mode: 'propose',
                models_endpoint: ''
            };
            return map[name];
        });
    });

    it('produces outputs in dummy mode without failure', async () => {
        await run();
        expect(core.setFailed).not.toHaveBeenCalled();
        expect(core.setOutput).toHaveBeenCalledWith('pr_number', '0');
        expect(core.setOutput).toHaveBeenCalledWith('applied', 'false');
    });
});
