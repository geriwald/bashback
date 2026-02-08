#!/bin/bash
# =============================================================================
# bashback — Hook pour monitorer le cycle de vie des subagents
# =============================================================================
# Ce script gère 3 événements Claude Code :
#   - PreToolUse (matcher: Task)  → capture la description avant le spawn
#   - SubagentStart               → subagent démarré
#   - SubagentStop                → subagent terminé
#
# Installation :
#   1. Copier ce fichier:
#      cp hook/bashback-subagent-hook.sh ~/.claude/hooks/
#      chmod +x ~/.claude/hooks/bashback-subagent-hook.sh
#
#   2. Ajouter dans ~/.claude/settings.json:
#      "hooks": {
#        "PreToolUse": [{
#          "matcher": "Task",
#          "hooks": [{ "type": "command", "command": "~/.claude/hooks/bashback-subagent-hook.sh" }]
#        }],
#        "SubagentStart": [{
#          "hooks": [{ "type": "command", "command": "~/.claude/hooks/bashback-subagent-hook.sh" }]
#        }],
#        "SubagentStop": [{
#          "hooks": [{ "type": "command", "command": "~/.claude/hooks/bashback-subagent-hook.sh" }]
#        }]
#      }
# =============================================================================

LOG_FILE="/tmp/bashback.log"

# Lire le JSON depuis stdin
input=$(cat)

# jq est requis pour ce hook (pas de fallback grep pour du JSON complexe)
if ! command -v jq &>/dev/null; then
    exit 0
fi

event=$(echo "$input" | jq -r '.hook_event_name // empty' 2>/dev/null)

# Extraire le workspace depuis cwd
workspace_cwd=$(echo "$input" | jq -r '.cwd // empty' 2>/dev/null)
if [ -n "$workspace_cwd" ]; then
    gitroot=$(git -C "$workspace_cwd" rev-parse --show-toplevel 2>/dev/null)
    if [ -n "$gitroot" ]; then
        workspace=$(basename "$gitroot")
        ws_source="git"
    else
        workspace=$(basename "$workspace_cwd")
        ws_source="dir"
    fi
else
    workspace="unknown"
    ws_source="dir"
fi

ts=$(date '+%Y-%m-%d %H:%M:%S')

case "$event" in
    PreToolUse)
        # Capture la description de la tâche avant le spawn du subagent
        tool_name=$(echo "$input" | jq -r '.tool_name // empty' 2>/dev/null)
        [ "$tool_name" = "Task" ] || exit 0

        tool_use_id=$(echo "$input" | jq -r '.tool_use_id // empty' 2>/dev/null)
        description=$(echo "$input" | jq -r '.tool_input.description // empty' 2>/dev/null)
        subagent_type=$(echo "$input" | jq -r '.tool_input.subagent_type // empty' 2>/dev/null)

        [ -n "$description" ] || exit 0

        jq -nc \
            --arg type "subagent_task" \
            --arg ts "$ts" \
            --arg tuid "$tool_use_id" \
            --arg desc "$description" \
            --arg stype "$subagent_type" \
            --arg ws "$workspace" \
            --arg wss "$ws_source" \
            '{type: $type, timestamp: $ts, tool_use_id: $tuid, description: $desc, subagent_type: $stype, workspace: $ws, workspace_source: $wss}' \
            >> "$LOG_FILE"
        ;;

    SubagentStart)
        agent_id=$(echo "$input" | jq -r '.agent_id // empty' 2>/dev/null)
        agent_type=$(echo "$input" | jq -r '.agent_type // empty' 2>/dev/null)

        [ -n "$agent_id" ] || exit 0

        jq -nc \
            --arg type "subagent_start" \
            --arg ts "$ts" \
            --arg aid "$agent_id" \
            --arg atype "$agent_type" \
            --arg ws "$workspace" \
            --arg wss "$ws_source" \
            '{type: $type, timestamp: $ts, agent_id: $aid, agent_type: $atype, workspace: $ws, workspace_source: $wss}' \
            >> "$LOG_FILE"
        ;;

    SubagentStop)
        agent_id=$(echo "$input" | jq -r '.agent_id // empty' 2>/dev/null)
        agent_type=$(echo "$input" | jq -r '.agent_type // empty' 2>/dev/null)

        [ -n "$agent_id" ] || exit 0

        jq -nc \
            --arg type "subagent_stop" \
            --arg ts "$ts" \
            --arg aid "$agent_id" \
            --arg atype "$agent_type" \
            --arg ws "$workspace" \
            --arg wss "$ws_source" \
            '{type: $type, timestamp: $ts, agent_id: $aid, agent_type: $atype, workspace: $ws, workspace_source: $wss}' \
            >> "$LOG_FILE"
        ;;

    *)
        # Événement non géré, ignorer
        ;;
esac

exit 0
