// Static validation of the plugin, with no dependency: run by CI and before each release.
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const errors = [];
const check = (ok, message) => { if (!ok) errors.push(message); };
const readJson = (file) => {
  if (!existsSync(file)) { errors.push(`${file}: missing file`); return undefined; }
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch (e) { errors.push(`${file}: invalid JSON (${e.message})`); return undefined; }
};
const config = JSON.parse(readFileSync(new URL('./expected.json', import.meta.url), 'utf8'));

// Manifest following the Agent Plugins standard (https://agent-plugins.org/schemas/1.0.0/plugin.schema.json).
if (config.agentPlugins) {
  const m = readJson('plugin.json');
  if (m) {
    const allowed = ['$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'extensions'];
    check(m.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', 'plugin.json: Agent Plugins $schema expected');
    check(typeof m.name === 'string' && /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(m.name) && m.name.length <= 64, 'plugin.json: invalid name');
    for (const k of Object.keys(m)) check(allowed.includes(k), `plugin.json: key "${k}" is outside the Agent Plugins standard`);
  }
}
for (const file of config.manifests ?? []) {
  const m = readJson(file);
  if (m) check(m.name === config.name, `${file}: name must be "${config.name}"`);
}
const versions = [...(config.agentPlugins ? ['plugin.json'] : []), ...(config.manifests ?? [])].map((f) => readJson(f)?.version).filter(Boolean);
check(new Set(versions).size <= 1, `inconsistent versions between manifests: ${versions.join(', ')}`);

// Marketplace: each listed plugin must point to an existing folder.
const mk = readJson(config.marketplace);
if (mk) {
  check(typeof mk.name === 'string' && mk.name.length > 0, `${config.marketplace}: missing name`);
  check(Array.isArray(mk.plugins) && mk.plugins.length > 0, `${config.marketplace}: missing plugins`);
  for (const p of mk.plugins ?? []) {
    check(typeof p.name === 'string', `${config.marketplace}: plugin without a name`);
    const path = typeof p.source === 'string' ? p.source : p.source?.path;
    check(typeof path === 'string' && path.startsWith('./') && existsSync(path), `${config.marketplace}: source ${JSON.stringify(p.source)} not found`);
  }
}

// Skills: Agent Skills front matter, name equal to the folder.
for (const dir of readdirSync('skills', { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const file = `skills/${dir.name}/SKILL.md`;
  if (!existsSync(file)) { errors.push(`${file}: missing file`); continue; }
  const text = readFileSync(file, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? '';
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  const description = /^description:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? '';
  check(name === dir.name, `${file}: name (${name}) must be the name of the folder`);
  check(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name ?? '') && (name ?? '').length <= 64, `${file}: name is outside the Agent Skills standard`);
  check(description.length > 0 && description.length <= 1024, `${file}: description of 1 to 1024 characters expected`);
  // No invisible character in a text meant for a model.
  check(!/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]/u.test(text), `${file}: invisible character found`);
}

// Declared MCP server.
const mcp = readJson(config.mcp);
if (mcp) {
  const server = mcp.mcpServers?.agenteca;
  check(server && typeof server.command === 'string' && Array.isArray(server.args), `${config.mcp}: "agenteca" server badly declared`);
  const pkg = (server?.args ?? []).find((a) => a.startsWith('@agenteca/mcp'));
  check(/^@agenteca\/mcp@\d+\.\d+\.\d+$/.test(pkg ?? ''), `${config.mcp}: @agenteca/mcp must be pinned to an exact version (found: ${pkg})`);
}

if (errors.length > 0) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('Plugin is valid.');
