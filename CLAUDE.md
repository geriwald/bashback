# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

bashback is a local webapp that intercepts and displays bash commands executed by Claude Code in real-time, with pedagogical flag decomposition. It helps maintain awareness of what commands are being run during pair coding sessions.

## Architecture

```
Claude Code → bashback-hook.sh → /tmp/bashback.log → Node.js server (fs.watch) → WebSocket → React UI
```

Three components:
- **hook/**: Bash script that receives Claude Code hook JSON via stdin, extracts commands with `jq`, appends to log file
- **server/**: Node.js backend (Express/Fastify) that watches `/tmp/bashback.log`, parses new lines, broadcasts via WebSocket
- **client/**: React + TypeScript + Vite frontend with Tailwind CSS, displays commands with syntax highlighting and flag explanations

## Commands

```bash
# Install all dependencies
npm run install:all

# Run both server and client in development
npm run dev

# Run individually
npm run dev:server    # Server on localhost:3001
npm run dev:client    # Client on localhost:5173
```

## Log Format

Commands are logged as:
```
[2026-02-05 14:32:01] CMD: grep -rn "useState" src/
```

## Key Files

- `client/src/lib/explainCommand.ts` - Flag decomposition logic (maps commands to flag explanations)
- `server/src/watcher.ts` - File watching logic for `/tmp/bashback.log`
- `hook/bashback-hook.sh` - Claude Code hook script

## Reference

See [bashback-spec.md](bashback-spec.md) for complete specification including planned file structure, v1 features, and future evolutions.
