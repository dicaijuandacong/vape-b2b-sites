import { promises as fs } from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { SITES, REQUIRED_SITE_ENV, type SiteInfo } from './sites';

const execFileP = promisify(execFile);

export interface SiteStatus {
  key: string;
  label: string;
  prodUrl: string;
  github: string;
  gscUrl: string;
  vercelUrl: string;
  domainPending?: string;
  managed: boolean;
  health: { ok: boolean; httpStatus: number | null; latencyMs: number | null; checkedAt: string };
  env: { key: string; label: string; present: boolean; optional: boolean }[];
  envMissingRequired: number;
  latestCommit: string | null;
}

function sitesRoot(): string {
  return path.join(process.cwd(), '..', 'sites');
}

/** curl (curl.exe on Windows) — Next's Node fetch ignores the system proxy env. */
async function curlCode(url: string): Promise<number> {
  const args = [
    '-s',
    '-o',
    process.platform === 'win32' ? 'NUL' : '/dev/null',
    '-w',
    '%{http_code}',
    '--max-time',
    '20',
    '-A',
    'vape-ops-healthcheck/1.0',
    '-L',
    url
  ];
  for (const bin of process.platform === 'win32' ? ['curl.exe', 'curl'] : ['curl']) {
    try {
      const { stdout } = await execFileP(bin, args);
      const code = parseInt(stdout.trim(), 10);
      if (Number.isFinite(code)) return code;
    } catch {
      /* try next */
    }
  }
  return NaN;
}

async function checkHealth(url: string): Promise<SiteStatus['health']> {
  const started = Date.now();
  const code = await curlCode(url);
  const ok = Number.isFinite(code) && code >= 200 && code < 400;
  return {
    ok,
    httpStatus: Number.isFinite(code) ? code : null,
    latencyMs: ok ? Date.now() - started : null,
    checkedAt: new Date().toISOString()
  };
}

async function readEnvPresence(repoDir: string): Promise<SiteStatus['env']> {
  let content = '';
  try {
    content = await fs.readFile(path.join(sitesRoot(), repoDir, '.env.local'), 'utf8');
  } catch {
    content = '';
  }
  const present = new Set(
    content
      .split('\n')
      .map((l) => l.split('=')[0]?.trim())
      .filter((k) => k && !k.startsWith('#'))
  );
  return REQUIRED_SITE_ENV.map((e) => ({
    key: e.key,
    label: e.label,
    present: present.has(e.key) || !!process.env[e.key],
    optional: 'optional' in e && !!e.optional
  }));
}

async function latestCommit(repoDir: string): Promise<string | null> {
  try {
    const head = await fs.readFile(path.join(sitesRoot(), repoDir, '.git', 'HEAD'), 'utf8');
    const m = head.match(/ref: (.+)/);
    const sha = m
      ? (await fs.readFile(path.join(sitesRoot(), repoDir, '.git', m[1].trim()), 'utf8')).trim()
      : head.trim();
    return sha.slice(0, 7);
  } catch {
    return null;
  }
}

export async function getSitesStatus(): Promise<SiteStatus[]> {
  return Promise.all(
    SITES.map(async (s: SiteInfo) => {
      const managed = !!s.repoDir;
      const [health, env, commit] = await Promise.all([
        checkHealth(s.prodUrl),
        managed ? readEnvPresence(s.repoDir) : Promise.resolve([]),
        managed ? latestCommit(s.repoDir) : Promise.resolve(null)
      ]);
      return {
        key: s.key,
        label: s.label,
        prodUrl: s.prodUrl,
        github: s.github,
        gscUrl: s.gscUrl,
        vercelUrl: s.vercelUrl,
        domainPending: s.domainPending,
        managed,
        health,
        env,
        envMissingRequired: env.filter((e) => !e.optional && !e.present).length,
        latestCommit: commit
      } satisfies SiteStatus;
    })
  );
}
