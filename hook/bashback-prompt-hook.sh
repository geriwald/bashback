#!/bin/bash
# =============================================================================
# bashback — Hook UserPromptSubmit pour logger les prompts utilisateur
# =============================================================================
# Ce script est appelé par Claude Code avant le traitement de chaque prompt.
# Il reçoit un JSON via stdin contenant le texte du prompt.
#
# Installation :
#   1. Copier ce fichier:
#      cp hook/bashback-prompt-hook.sh ~/.claude/hooks/
#      chmod +x ~/.claude/hooks/bashback-prompt-hook.sh
#
#   2. Ajouter dans ~/.claude/settings.json:
#      "hooks": {
#        "UserPromptSubmit": [{
#          "hooks": [{
#            "type": "command",
#            "command": "~/.claude/hooks/bashback-prompt-hook.sh"
#          }]
#        }]
#      }
# =============================================================================

LOG_FILE="/tmp/bashback.log"

# Lire le JSON depuis stdin
input=$(cat)

# Extraire le prompt avec jq
if command -v jq &>/dev/null; then
    prompt=$(echo "$input" | jq -r '.prompt // empty' 2>/dev/null)
else
    # Fallback sans jq
    prompt=$(echo "$input" | grep -o '"prompt":"[^"]*"' | head -1 | sed 's/"prompt":"//;s/"$//')
fi

# Timestamp
ts=$(date '+%Y-%m-%d %H:%M:%S')

# Logger au format JSON Lines
if [ -n "$prompt" ]; then
    jq -nc --arg ts "$ts" --arg prompt "$prompt" \
        '{type: "prompt", timestamp: $ts, prompt: $prompt}' >> "$LOG_FILE"
fi

# Exit 0 = ne pas bloquer l'exécution
exit 0
