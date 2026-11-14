# agenteca-copilot

The Agenteca plugin for **GitHub Copilot CLI**. It adds the `/hub` command and declares the `agenteca` MCP server, so you can search, inspect, install, update and remove AI agent packages without leaving the tool.

Agenteca is a catalog and manager for agent packages: skills, agents, commands, hooks and MCP servers, installed from git repositories into Claude Code, Codex, GitHub Copilot and Cursor. Packages follow the OpenAPM format.

## Install

```bash
copilot plugin marketplace add agenteca/agenteca-copilot
```

```bash
copilot plugin install agenteca@agenteca
```

## Use

| Command | What it does |
|---|---|
| `/hub search <words>` | Search the catalog |
| `/hub info <package>` | Show what a package contains before installing it |
| `/hub install <package>` | Install, after showing the plan and getting your agreement |
| `/hub update [package]` | Update |
| `/hub remove <package>` | Remove the package and its files |
| `/hub list`, `/hub outdated` | Installed packages, available updates |

Copilot CLI does not document a namespace for plugin skills: the skill is called `hub`.

## What this plugin runs, fetches and writes

Nothing here is hidden; this section lists all of it.

- **It starts one local program.** The MCP server is launched with `npx -y @agenteca/mcp@0.1.0`: `npx` downloads that exact version of the [`@agenteca/mcp`](https://github.com/agenteca/agenteca-mcp) package, and its dependencies `@agenteca/cli` and `@agenteca/core`, from the npm registry. All three are open source under Apache-2.0.
- **It fetches git repositories you name.** When you search, inspect or install a package, the `ahub` command reads the catalog and clones the package's repository with `git`. No code from a package is executed during installation.
- **It writes files in your project, after you agree.** Installing a package writes that package's agents, skills, commands, hooks and MCP server entries into your project (for example under `.claude/`), plus `apm.yml` and `apm.lock.yaml`. Every write is listed in a plan first, and a file you edited by hand is never overwritten without a separate agreement.
- **It sends no telemetry.** The plugin, the MCP server and the CLI collect nothing and call no Agenteca service. The only network traffic is to npm (to fetch the packages above) and to the git hosts and catalogs you point it at.
- **It reads no credentials.** Access to private repositories relies on your existing git configuration.
- **It has no hooks.** The plugin itself contains one skill and one MCP server declaration.

Each package is scanned before installation (invisible Unicode, download-and-execute commands, and similar patterns). A package with a critical finding cannot be installed from the agent. The scan catches known tricks; it does not prove a package is safe, so read what you install.

## What is in this repository

| File | Role |
|---|---|
| `plugin.json` | Manifest in the Agent Plugins standard |
| `.github/plugin/marketplace.json` | Marketplace in the Copilot CLI format |
| `skills/hub/SKILL.md` | The `hub` skill |
| `.mcp.json` | MCP server declaration (`type: local`) |

## Status

Version 0.1.0. `@agenteca/mcp` is not on npm yet: until it is, the MCP server declared here will not start. Checked: `plugin.json` validates against the official Agent Plugins 1.0.0 schema, and `scripts/validate.mjs` passes. Not checked: everything else. Copilot CLI was not installed on the development machine, so loading the plugin and calling the skill have not been tried in the tool.

## Development

```bash
node scripts/validate.mjs
```

## License

Apache-2.0.
