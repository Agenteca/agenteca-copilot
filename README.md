# agenteca-copilot

Plugin Agenteca pour **GitHub Copilot CLI**. Il ajoute la commande `/hub` et déclare le serveur MCP `agenteca`, qui permet de chercher, lire, installer, mettre à jour et retirer des paquets d'agents IA sans quitter l'outil.

Le plugin ne contient aucune logique : un skill (des consignes) et une déclaration de serveur MCP. Le travail est fait par [`@agenteca/mcp`](https://github.com/agenteca/agenteca-mcp), qui appelle la CLI `ahub`.

> État : 0.1.0, non publié. `@agenteca/mcp` n'est pas encore sur npm : tant que ce n'est pas le cas, le serveur MCP déclaré par ce plugin ne démarrera pas.

## Installer

```bash
copilot plugin marketplace add agenteca/agenteca-copilot
```

```bash
copilot plugin install agenteca@agenteca
```

## Utiliser

| Commande | Effet |
|---|---|
| `/hub search <mots>` | Cherche dans le catalogue |
| `/hub info <paquet>` | Montre le contenu d'un paquet avant installation |
| `/hub install <paquet>` | Installe, après affichage du plan et accord |
| `/hub update [paquet]` | Met à jour |
| `/hub remove <paquet>` | Retire le paquet et ses fichiers |
| `/hub list`, `/hub outdated` | Paquets installés, mises à jour disponibles |

Copilot CLI ne documente pas d'espace de noms pour les skills de plugin : le skill s'appelle `hub`.

Toute installation se fait en deux temps : le plan d'abord (fichiers, hooks, serveurs MCP, scan de sécurité), l'application ensuite, après votre accord. Un paquet dont le scan relève un problème critique ne peut pas être installé depuis l'agent.

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `plugin.json` | Manifeste au standard Agent Plugins |
| `.github/plugin/marketplace.json` | Marketplace au format Copilot CLI |
| `skills/hub/SKILL.md` | Le skill `hub` |
| `.mcp.json` | Déclaration du serveur MCP (`type: local`) |

## Vérifié, non vérifié

- Vérifié : `plugin.json` est valide contre le schéma officiel Agent Plugins 1.0.0 ; `scripts/validate.mjs` passe.
- Non vérifié : tout le reste. Copilot CLI n'est pas installé sur la machine de développement : le chargement du plugin et l'appel du skill n'ont pas été essayés dans l'outil.

## Développement

```bash
node scripts/validate.mjs
```

## Licence

Apache-2.0.
