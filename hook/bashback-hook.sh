#!/bin/bash
# =============================================================================
# bashback — Hook PostToolUse pour logger les commandes Bash
# =============================================================================
# Ce script est appelé par Claude Code après chaque exécution d'outil Bash.
# Il reçoit un JSON via stdin contenant les détails de la commande.
#
# Installation :
#   1. Copier ce fichier:
#      cp hook/bashback-hook.sh ~/.claude/hooks/
#      chmod +x ~/.claude/hooks/bashback-hook.sh
#
#   2. Ajouter dans ~/.claude/settings.json:
#      "hooks": {
#        "PostToolUse": [{
#          "matcher": "Bash",
#          "hooks": [{
#            "type": "command",
#            "command": "~/.claude/hooks/bashback-hook.sh"
#          }]
#        }]
#      }
# =============================================================================

LOG_FILE="/tmp/bashback.log"

# Lire le JSON depuis stdin
input=$(cat)

# Extraire la commande et le workspace avec jq
if command -v jq &>/dev/null; then
    cmd=$(echo "$input" | jq -r '.tool_input.command // .input.command // empty' 2>/dev/null)
    # Le cwd (current working directory) représente le workspace
    workspace=$(echo "$input" | jq -r '.cwd // .session.cwd // empty' 2>/dev/null)

    # Fallback: extraire le nom du dossier depuis le cwd
    if [ -n "$workspace" ]; then
        workspace=$(basename "$workspace")
    else
        workspace="unknown"
    fi
else
    # Fallback sans jq
    cmd=$(echo "$input" | grep -o '"command":"[^"]*"' | head -1 | sed 's/"command":"//;s/"$//')
    workspace="unknown"
fi

# Timestamp
ts=$(date '+%Y-%m-%d %H:%M:%S')

# Logger au format JSON Lines (préserve les commandes multilignes)
if [ -n "$cmd" ]; then
    # Utiliser jq pour créer du JSON valide avec échappement correct des newlines
    jq -nc --arg ts "$ts" --arg ws "$workspace" --arg cmd "$cmd" \
        '{timestamp: $ts, workspace: $ws, command: $cmd}' >> "$LOG_FILE"
fi

# Exit 0 = ne pas bloquer l'exécution
exit 0
