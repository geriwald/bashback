# bashback hook

Ce hook Claude Code intercepte les commandes Bash et les envoie à bashback.

## Installation

### 1. Copier le hook

```bash
cp hook/bashback-hook.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/bashback-hook.sh
```

### 2. Configurer Claude Code

Ajouter dans `~/.claude/settings.json` :

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/bashback-hook.sh"
          }
        ]
      }
    ]
  }
}
```

## Format de log

Les commandes sont loggées dans `/tmp/bashback.log` au format :

```
[2026-02-05 14:32:01] [mon-projet] CMD: grep -rn "useState" src/
[2026-02-05 14:32:15] [mon-projet] CMD: find . -name "*.ts" -type f
```

Le workspace correspond au nom du dossier de travail courant.

## Dépendances

- `jq` (recommandé) pour parser le JSON correctement
- Fallback basique disponible sans jq
