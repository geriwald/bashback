# bashback

> Webapp locale pour visualiser en temps réel les commandes Bash exécutées par Claude Code, avec décomposition pédagogique.

## Objectif

Pendant une session de pair coding avec Claude Code, je ne regarde plus les commandes exécutées. bashback intercepte ces commandes via le système de hooks de Claude Code et les affiche dans une interface claire avec explication des flags, pour maintenir ma compréhension de ce qui se passe.

## Stack

- **Frontend** : React + TypeScript + Vite
- **Backend** : Node.js (Express ou Fastify)
- **Communication** : WebSocket pour le temps réel
- **Styling** : Tailwind CSS

## Architecture

```
┌─────────────────┐      hook stdin       ┌─────────────────┐
│  Claude Code    │ ───────────────────▶  │  log-bash-cmd   │
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

## Fonctionnalités v1

### Backend (`/server`)

- Surveiller `/tmp/bashback.log` avec `chokidar` ou `fs.watch`
- Parser chaque nouvelle ligne (format : `[timestamp] CMD: <command>`)
- Broadcast via WebSocket à tous les clients connectés
- Endpoint REST `GET /api/history` pour charger l'historique au démarrage

### Frontend (`/client`)

- Connexion WebSocket au serveur
- Affichage d'une liste scrollable de commandes
- Chaque commande affiche :
  - Timestamp
  - Commande complète avec syntax highlighting (utiliser `highlight.js` ou `prism` pour bash)
  - Décomposition des flags (tooltip ou inline)
- Auto-scroll vers le bas (désactivable)
- Bouton "Clear" pour vider l'affichage (pas le fichier)

### Hook Claude Code (`/hook`)

- Script bash `bashback-hook.sh` 
- Reçoit le JSON de Claude Code en stdin
- Extrait la commande avec `jq`
- Append dans `/tmp/bashback.log`
- Instructions d'installation dans le README

## Structure de fichiers

```
bashback/
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── CommandList.tsx
│   │   │   ├── CommandCard.tsx
│   │   │   └── FlagExplainer.tsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── lib/
│   │   │   └── explainCommand.ts   # décomposition des flags
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── watcher.ts              # surveille le fichier log
│   │   ├── parser.ts               # parse les lignes
│   │   └── websocket.ts            # broadcast
│   ├── package.json
│   └── tsconfig.json
├── hook/
│   ├── bashback-hook.sh
│   └── README.md                   # instructions d'install du hook
├── package.json                    # workspace root (optionnel)
└── README.md
```

## Format du log

```
[2026-02-05 14:32:01] CMD: grep -rn "useState" src/
[2026-02-05 14:32:15] CMD: find . -name "*.ts" -type f
[2026-02-05 14:33:02] CMD: docker compose up -d
```

## Décomposition des flags

Dans `explainCommand.ts`, une map des commandes courantes et leurs flags :

```typescript
const FLAGS: Record<string, Record<string, string>> = {
  grep: {
    '-r': 'récursif',
    '-n': 'affiche les numéros de ligne',
    '-i': 'insensible à la casse',
    '-l': 'affiche seulement les noms de fichiers',
    '-v': 'inverse la recherche (exclut)',
    '-E': 'regex étendue',
    '-c': 'compte les occurrences',
  },
  find: {
    '-name': 'cherche par nom',
    '-type': 'f=fichier, d=dossier',
    '-mtime': 'modifié il y a N jours',
    '-mmin': 'modifié il y a N minutes',
    '-exec': 'exécute une commande sur chaque résultat',
  },
  // ... etc
};
```

## Scripts npm

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install"
  }
}
```

## Pour lancer

```bash
# Terminal 1 : lancer bashback
npm run dev

# Terminal 2 : ouvrir http://localhost:5173

# Terminal 3 : utiliser Claude Code normalement
# Les commandes apparaissent dans bashback en temps réel
```

## Évolutions futures (hors v1)

- Mode quiz : masquer la commande, montrer ce qu'elle fait, deviner la syntaxe
- Stats : commandes les plus fréquentes, flags jamais vus
- Filtres : par commande de base (grep, git, docker...)
- Export : générer un markdown des commandes de la session
- LLM local : explication enrichie via Ollama
