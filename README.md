# bashback

Webapp locale pour visualiser en temps réel les commandes Bash exécutées par Claude Code, avec décomposition pédagogique des flags.

## Concept

Pendant une session de pair coding avec Claude Code, bashback intercepte les commandes via le système de hooks et les affiche dans une interface claire avec explication des flags, pour maintenir la compréhension de ce qui se passe.

## Architecture

```
┌─────────────────┐      hook stdin       ┌─────────────────┐
│  Claude Code    │ ───────────────────▶  │  bashback-hook  │
│  (terminal)     │                       │  (bash script)  │
└─────────────────┘                       └────────┬────────┘
                                                   │ append
                                                   ▼
                                          /tmp/bashback.log
                                                   │
                                                   │ fs.watch
                                                   ▼
┌─────────────────┐      WebSocket        ┌─────────────────┐
│  bashback UI    │ ◀────────────────────│  bashback server│
│  (React)        │                       │  (Node.js)      │
│  localhost:5173 │                       │  localhost:3001 │
└─────────────────┘                       └─────────────────┘
```

## Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js (Express/Fastify) + WebSocket
- **Hook**: Bash script + jq

## Installation

```bash
npm run install:all
```

## Usage

```bash
# Lancer bashback (serveur + client)
npm run dev

# Ouvrir http://localhost:5173
# Utiliser Claude Code normalement - les commandes apparaissent en temps réel
```

## Configuration du hook Claude Code

Voir [hook/README.md](hook/README.md) pour les instructions d'installation du hook.

## License

MIT
