const FLAGS: Record<string, Record<string, string>> = {
  grep: {
    '-r': 'Récursif dans les sous-dossiers',
    '-R': 'Récursif (suit les liens symboliques)',
    '-n': 'Affiche les numéros de ligne',
    '-i': 'Insensible à la casse',
    '-l': 'Affiche seulement les noms de fichiers',
    '-L': 'Affiche les fichiers sans correspondance',
    '-v': 'Inverse la recherche (exclut)',
    '-E': 'Regex étendue (ERE)',
    '-P': 'Regex Perl (PCRE)',
    '-c': 'Compte les occurrences',
    '-w': 'Mot entier uniquement',
    '-x': 'Ligne entière uniquement',
    '-A': 'Affiche N lignes après',
    '-B': 'Affiche N lignes avant',
    '-C': 'Affiche N lignes avant et après',
    '-q': 'Mode silencieux',
    '-s': 'Supprime les erreurs',
    '-h': 'Cache les noms de fichiers',
    '-H': 'Affiche les noms de fichiers',
    '--include': 'Inclut seulement ces fichiers',
    '--exclude': 'Exclut ces fichiers',
    '--exclude-dir': 'Exclut ces dossiers',
  },
  find: {
    '-name': 'Cherche par nom (sensible à la casse)',
    '-iname': 'Cherche par nom (insensible à la casse)',
    '-type': 'Type: f=fichier, d=dossier, l=lien',
    '-mtime': 'Modifié il y a N jours',
    '-mmin': 'Modifié il y a N minutes',
    '-atime': 'Accédé il y a N jours',
    '-ctime': 'Métadonnées changées il y a N jours',
    '-size': 'Taille (+N plus grand, -N plus petit)',
    '-exec': 'Exécute une commande sur chaque résultat',
    '-delete': 'Supprime les fichiers trouvés',
    '-print': 'Affiche les résultats',
    '-maxdepth': 'Profondeur maximale de recherche',
    '-mindepth': 'Profondeur minimale de recherche',
    '-empty': 'Fichiers/dossiers vides',
    '-newer': 'Plus récent que le fichier donné',
    '-perm': 'Permissions spécifiques',
    '-user': 'Appartient à cet utilisateur',
    '-group': 'Appartient à ce groupe',
  },
  git: {
    '-m': 'Message de commit',
    '-a': 'Ajoute tous les fichiers modifiés',
    '-b': 'Crée une nouvelle branche',
    '-d': 'Supprime une branche',
    '-D': 'Force la suppression de branche',
    '-f': 'Force l\'opération',
    '-u': 'Configure le upstream',
    '-p': 'Pousse toutes les branches',
    '--amend': 'Modifie le dernier commit',
    '--force': 'Force le push',
    '--hard': 'Reset dur (perd les changements)',
    '--soft': 'Reset doux (garde les changements)',
    '--mixed': 'Reset mixte (défaut)',
    '--no-verify': 'Ignore les hooks',
    '--oneline': 'Affichage compact',
    '--graph': 'Affiche le graphe des branches',
    '--all': 'Toutes les branches',
    '--stat': 'Statistiques des changements',
    '--patch': 'Mode interactif par hunks',
    '-v': 'Mode verbeux',
  },
  ls: {
    '-l': 'Format long (détails)',
    '-a': 'Affiche les fichiers cachés',
    '-h': 'Tailles lisibles (Ko, Mo)',
    '-R': 'Récursif',
    '-t': 'Trie par date de modification',
    '-S': 'Trie par taille',
    '-r': 'Ordre inverse',
    '-1': 'Un fichier par ligne',
    '-d': 'Dossiers seulement (pas leur contenu)',
    '--color': 'Colorise la sortie',
  },
  rm: {
    '-r': 'Récursif (supprime les dossiers)',
    '-f': 'Force (pas de confirmation)',
    '-i': 'Demande confirmation',
    '-v': 'Mode verbeux',
    '-d': 'Supprime les dossiers vides',
  },
  cp: {
    '-r': 'Récursif (copie les dossiers)',
    '-R': 'Récursif (identique à -r)',
    '-i': 'Demande confirmation avant écrasement',
    '-n': 'Ne pas écraser',
    '-u': 'Copie seulement si plus récent',
    '-v': 'Mode verbeux',
    '-p': 'Préserve les attributs',
    '-a': 'Archive (préserve tout)',
  },
  mv: {
    '-i': 'Demande confirmation avant écrasement',
    '-n': 'Ne pas écraser',
    '-u': 'Déplace seulement si plus récent',
    '-v': 'Mode verbeux',
    '-f': 'Force (pas de confirmation)',
  },
  cat: {
    '-n': 'Numérote les lignes',
    '-b': 'Numérote les lignes non vides',
    '-s': 'Réduit les lignes vides consécutives',
    '-A': 'Affiche tous les caractères',
    '-E': 'Affiche $ en fin de ligne',
    '-T': 'Affiche les tabulations comme ^I',
  },
  docker: {
    '-d': 'Mode détaché (arrière-plan)',
    '-it': 'Mode interactif avec terminal',
    '-p': 'Mapping de ports',
    '-v': 'Monte un volume',
    '-e': 'Variable d\'environnement',
    '--rm': 'Supprime le conteneur à l\'arrêt',
    '--name': 'Nom du conteneur',
    '-f': 'Fichier Dockerfile ou force',
    '-t': 'Tag de l\'image',
    '--build': 'Reconstruit les images',
    '--no-cache': 'Sans cache',
    '-q': 'Mode silencieux',
  },
  npm: {
    '-g': 'Installation globale',
    '-D': 'Dépendance de développement',
    '--save-dev': 'Dépendance de développement',
    '--save': 'Dépendance de production',
    '-f': 'Force',
    '--force': 'Force l\'installation',
    '--legacy-peer-deps': 'Ignore les conflits de peer deps',
  },
  curl: {
    '-X': 'Méthode HTTP (GET, POST, etc.)',
    '-H': 'Header personnalisé',
    '-d': 'Données POST',
    '-o': 'Fichier de sortie',
    '-O': 'Garde le nom du fichier',
    '-L': 'Suit les redirections',
    '-s': 'Mode silencieux',
    '-v': 'Mode verbeux',
    '-k': 'Ignore les erreurs SSL',
    '-u': 'Authentification user:password',
    '-i': 'Inclut les headers dans la sortie',
    '--data-raw': 'Données brutes',
    '-F': 'Données multipart/form-data',
  },
  chmod: {
    '-R': 'Récursif',
    '-v': 'Mode verbeux',
    '+x': 'Ajoute permission d\'exécution',
    '-x': 'Retire permission d\'exécution',
    '+r': 'Ajoute permission de lecture',
    '+w': 'Ajoute permission d\'écriture',
  },
  chown: {
    '-R': 'Récursif',
    '-v': 'Mode verbeux',
    '--reference': 'Copie les permissions d\'un autre fichier',
  },
  tar: {
    '-c': 'Crée une archive',
    '-x': 'Extrait une archive',
    '-v': 'Mode verbeux',
    '-f': 'Fichier d\'archive',
    '-z': 'Compression gzip',
    '-j': 'Compression bzip2',
    '-J': 'Compression xz',
    '-t': 'Liste le contenu',
    '-C': 'Change de répertoire',
  },
  ssh: {
    '-p': 'Port',
    '-i': 'Fichier de clé privée',
    '-v': 'Mode verbeux',
    '-L': 'Tunnel local',
    '-R': 'Tunnel distant',
    '-N': 'Pas de commande (tunnel seulement)',
    '-f': 'Passe en arrière-plan',
  },
  sed: {
    '-i': 'Modifie le fichier en place',
    '-e': 'Expression à exécuter',
    '-n': 'Supprime l\'affichage par défaut',
    '-r': 'Regex étendue',
    '-E': 'Regex étendue (alias)',
  },
  awk: {
    '-F': 'Séparateur de champs',
    '-v': 'Définit une variable',
    '-f': 'Fichier de script AWK',
  },
  ps: {
    '-a': 'Tous les processus',
    '-u': 'Format utilisateur',
    '-x': 'Inclut les processus sans terminal',
    '-e': 'Tous les processus',
    '-f': 'Format complet',
    '--forest': 'Arborescence des processus',
  },
  kill: {
    '-9': 'SIGKILL (force)',
    '-15': 'SIGTERM (défaut, propre)',
    '-HUP': 'SIGHUP (recharge config)',
  },
};

export interface FlagExplanation {
  flag: string;
  value?: string;
  explanation: string;
}

export interface CommandExplanation {
  baseCommand: string;
  flags: FlagExplanation[];
  args: string[];
}

export function explainCommand(command: string): CommandExplanation {
  const parts = command.trim().split(/\s+/);
  const baseCommand = parts[0];
  const flags: FlagExplanation[] = [];
  const args: string[] = [];

  const commandFlags = FLAGS[baseCommand] || {};

  let i = 1;
  while (i < parts.length) {
    const part = parts[i];

    if (part.startsWith('-')) {
      // Check for --flag=value format
      const eqIndex = part.indexOf('=');
      if (eqIndex !== -1) {
        const flag = part.slice(0, eqIndex);
        const value = part.slice(eqIndex + 1);
        flags.push({
          flag,
          value,
          explanation: commandFlags[flag] || 'Flag inconnu',
        });
      }
      // Check if next part is a value for this flag
      else if (
        i + 1 < parts.length &&
        !parts[i + 1].startsWith('-') &&
        (part === '-o' ||
          part === '-f' ||
          part === '-p' ||
          part === '-v' ||
          part === '-e' ||
          part === '-H' ||
          part === '-X' ||
          part === '-d' ||
          part === '-u' ||
          part === '-i' ||
          part === '-m' ||
          part === '-t' ||
          part === '-C' ||
          part === '-A' ||
          part === '-B' ||
          part === '-F' ||
          part === '--name' ||
          part === '--include' ||
          part === '--exclude' ||
          part === '--exclude-dir' ||
          part === '-name' ||
          part === '-iname' ||
          part === '-type' ||
          part === '-mtime' ||
          part === '-mmin' ||
          part === '-exec' ||
          part === '-maxdepth' ||
          part === '-mindepth' ||
          part === '-size' ||
          part === '-perm' ||
          part === '-user' ||
          part === '-group')
      ) {
        flags.push({
          flag: part,
          value: parts[i + 1],
          explanation: commandFlags[part] || 'Flag inconnu',
        });
        i++;
      }
      // Handle combined flags like -rn
      else if (part.length > 2 && !part.startsWith('--')) {
        const combinedFlags = part.slice(1).split('');
        for (const f of combinedFlags) {
          const fullFlag = `-${f}`;
          flags.push({
            flag: fullFlag,
            explanation: commandFlags[fullFlag] || 'Flag inconnu',
          });
        }
      } else {
        flags.push({
          flag: part,
          explanation: commandFlags[part] || 'Flag inconnu',
        });
      }
    } else {
      args.push(part);
    }

    i++;
  }

  return { baseCommand, flags, args };
}
