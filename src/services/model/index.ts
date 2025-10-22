import { request } from 'https';

// ----- Types -----
export interface Patch {
  file: string;
  action: 'create' | 'update' | 'delete';
  content?: string;
}

export interface ModelResponse {
  reasoning: string;
  patches: Patch[];
}

export interface IModelClient {
  generate(systemPrompt: string, userPrompt: string, model: string): Promise<ModelResponse>;
}

// ----- Implementation -----
export class GitHubModelClient implements IModelClient {
  constructor(private endpoint: string, private token: string) {}

  async generate(systemPrompt: string, userPrompt: string, model: string): Promise<ModelResponse> {
    // Dummy mode: skip remote call for local development.
    if (this.token === 'dummy') {
      return {
        reasoning: 'Local test mode; skipping real model call.',
        patches: [
          { file: 'scripts/cleanup.sh', action: 'create', content: '#!/bin/bash\necho test' }
        ]
      };
    }

    const finalUser = `${userPrompt}\n\nReturn a JSON object in a fenced code block with keys reasoning and patches (array of {file, action, content}).`;
    const body = JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: finalUser }
      ],
      temperature: 0.2
    });

    const raw = await httpPostJson(this.endpoint, body, {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });

    const data = JSON.parse(raw);
    const content: string = data.choices?.[0]?.message?.content || '';
    const jsonStr = extractJson(content);
    const parsed: ModelResponse = JSON.parse(jsonStr);
    if (!parsed.patches) parsed.patches = [];
    return parsed;
  }
}

// ----- Helpers -----
function extractJson(md: string): string {
  const fenced = md.match(/```json\n([\s\S]*?)```/i) || md.match(/```\n([\s\S]*?)```/);
  return fenced ? fenced[1] : md.trim();
}

function httpPostJson(urlStr: string, body: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(urlStr);
      const opts = {
        method: 'POST',
        hostname: u.hostname,
        path: u.pathname + (u.search || ''),
        headers: {
          'Content-Length': Buffer.byteLength(body),
          ...headers
        }
      };
      const req = request(opts, (res: any) => {
        let d = '';
        res.on('data', (c: any) => (d += c));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Model API HTTP ${res.statusCode}: ${d.substring(0, 500)}`));
          }
          resolve(d);
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}
