// Validation statique du plugin, sans dépendance : lancée par la CI et avant chaque version.
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const errors = [];
const check = (ok, message) => { if (!ok) errors.push(message); };
const readJson = (file) => {
  if (!existsSync(file)) { errors.push(`${file} : fichier manquant`); return undefined; }
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch (e) { errors.push(`${file} : JSON invalide (${e.message})`); return undefined; }
};
const config = JSON.parse(readFileSync(new URL('./expected.json', import.meta.url), 'utf8'));

// Manifeste au standard Agent Plugins (https://agent-plugins.org/schemas/1.0.0/plugin.schema.json).
if (config.agentPlugins) {
  const m = readJson('plugin.json');
  if (m) {
    const allowed = ['$schema', 'name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'extensions'];
    check(m.$schema === 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', 'plugin.json : $schema Agent Plugins attendu');
    check(typeof m.name === 'string' && /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(m.name) && m.name.length <= 64, 'plugin.json : name invalide');
    for (const k of Object.keys(m)) check(allowed.includes(k), `plugin.json : clé « ${k} » hors du standard Agent Plugins`);
  }
}
for (const file of config.manifests ?? []) {
  const m = readJson(file);
  if (m) check(m.name === config.name, `${file} : name doit valoir « ${config.name} »`);
}
const versions = [...(config.agentPlugins ? ['plugin.json'] : []), ...(config.manifests ?? [])].map((f) => readJson(f)?.version).filter(Boolean);
check(new Set(versions).size <= 1, `versions incohérentes entre manifestes : ${versions.join(', ')}`);

// Marketplace : chaque plugin listé doit pointer vers un dossier existant.
const mk = readJson(config.marketplace);
if (mk) {
  check(typeof mk.name === 'string' && mk.name.length > 0, `${config.marketplace} : name manquant`);
  check(Array.isArray(mk.plugins) && mk.plugins.length > 0, `${config.marketplace} : plugins manquant`);
  for (const p of mk.plugins ?? []) {
    check(typeof p.name === 'string', `${config.marketplace} : plugin sans name`);
    const path = typeof p.source === 'string' ? p.source : p.source?.path;
    check(typeof path === 'string' && path.startsWith('./') && existsSync(path), `${config.marketplace} : source « ${JSON.stringify(p.source)} » introuvable`);
  }
}

// Skills : frontmatter Agent Skills, nom égal au dossier.
for (const dir of readdirSync('skills', { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const file = `skills/${dir.name}/SKILL.md`;
  if (!existsSync(file)) { errors.push(`${file} : fichier manquant`); continue; }
  const text = readFileSync(file, 'utf8');
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? '';
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  const description = /^description:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? '';
  check(name === dir.name, `${file} : name (${name}) doit être le nom du dossier`);
  check(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name ?? '') && (name ?? '').length <= 64, `${file} : name hors du standard Agent Skills`);
  check(description.length > 0 && description.length <= 1024, `${file} : description de 1 à 1024 caractères attendue`);
  // Aucun caractère invisible dans un texte destiné à un modèle.
  check(!/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]|[\u{E0000}-\u{E007F}]/u.test(text), `${file} : caractère invisible détecté`);
}

// Serveur MCP déclaré.
const mcp = readJson(config.mcp);
if (mcp) {
  const server = mcp.mcpServers?.agenteca;
  check(server && typeof server.command === 'string' && Array.isArray(server.args), `${config.mcp} : serveur « agenteca » mal déclaré`);
  const pkg = (server?.args ?? []).find((a) => a.startsWith('@agenteca/mcp'));
  check(/^@agenteca\/mcp@\d+\.\d+\.\d+$/.test(pkg ?? ''), `${config.mcp} : @agenteca/mcp doit être épinglé à une version exacte (trouvé : ${pkg})`);
}

if (errors.length > 0) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  process.exit(1);
}
console.log('Plugin valide.');
