# Garder la structure documentée à jour

La structure du repo est décrite à 2 endroits :

- l'arborescence de `CLAUDE.md`, qui liste les fichiers suivis par git ;
- le schéma de `src/` dans `.claude/rules/architecture-backend.md`, qui liste les dossiers de premier niveau et leur rôle.

**Toute modification qui change la structure met à jour ces 2 endroits dans le même lot de changements**, sans attendre qu'on le demande : ajout, suppression, renommage ou déplacement d'un fichier ou d'un dossier.

- Un fichier ajouté, supprimé ou renommé n'importe où dans le repo → mettre à jour l'arborescence de `CLAUDE.md`.
- Un dossier de premier niveau sous `src/` ajouté, supprimé ou renommé → mettre aussi à jour le schéma et la section « Le rôle de chaque emplacement » de `architecture-backend.md`.

Les fichiers ignorés par git (`node_modules/`, `dist/`, `src/generated/`, `.env`) n'apparaissent pas dans l'arborescence.
