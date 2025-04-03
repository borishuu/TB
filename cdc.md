# Cahier des charges

## Decription du projet
Le projet consiste à développer une application web interactive permettant aux utilisateurs de générer des évaluations automatiquement en utilisant des technologies basées sur les LLMs. Grâce à cela, les étudiants et enseignants pourront concevoir des évaluations en quelques clics à partir d'un sujet et des fichiers de référence.

## Contexte
Aujourd'hui, de nombreux enseigants passent un temps considérable à préparer des quiz et évaluations, en parallèle des étudiants qui manquent souvent des évaluations d'entraînement pour leurs cours. Ce projet vise à fournir un outil efficace permettant de combler ces besoins.

## Cas d'utilisation

### Enseignants
Création rapide de quiz et d'évaluations pour les étudiants

### Étudiants
Révision de cours facilitée en générant des évaluations à partir du contenu de cours/évaluations de référence

## Stack technologique

### Développement WebApp
- NextJS (développement WebApp backend + frontend)
- TypeScript (langage de développement)
- Tailwind CSS (styling)

### Base de Données
- Prisma (ORM)
- PostgreSQL (BD)
- pgvector (BD vectorielle)

### Intelligence Artificielle
- Gemini API - modèle gemini-2.0-flash (llm assistant à la génération de quiz)

### Version Control
- Git via GitHub

### Hébergement et Déploiement
- Vercel (hébergement WebApp) ?
- Neon (hébergement BD) ?
- GitHub Actions (CI/CD) ?

### Authentification
- bcrypt (hachage/vérification de mdp)
- Jose (signer/vérifier JWT pour authentification)

## Spécifications fonctionnelles

### Gestion des fichiers
- Utilisateur upload ses fichiers qui sont stockés dans son "pool" personnel
- Les fichiers uploadés sont vectorisés et stockés dans pgvector
- Utilisateur peut supprimer/adapter les fichiers dans son pool

### Génération d'évaluations
- Génération d'évaluations depuis un prompt utilisateur pour récupérer les passages pertinents dans son pool de fichiers sur lesquels gemini va se baser
- Génération d'évaluations inspirées d'un fichier d'évaluation fourni (pas stocké dans pool?)
- Choix des types de questions pouvant être générées (QCM, question ouverte, ecriture de code, etc..)
- Choix de la difficulté des questions générées

### Edition des évalutations
- Système de feedback sur les évaluations générés, l'utilisateur peut décrire son problème sur chaque question spécifique et envoyer une demande de regénération
- Edition/suppression des questions générées.
- Possibilité de générer des questions en plus

### Utilisation des évaluations
- Mode test : L'utilisateur répond aux questions de l'évaluation et obtient un score à la fin
- Mode affichage : L'utilisateur a la vision complète de l'évaluation avec les questions et leurs réponses

### Utilisation générale
- Système d'inscription et de connexion
- Chaque utilisateur dispose d'un tableau de bord avec ses quiz
- Possibilité de partager des quiz avec d'autres utilisateurs
- Interface responsive pour mobile
- Possibilité de sauvgarder les évaluations générées dans un fichier local (PDF, JSON)


## Tâches à effectuer

| Tâche                | Priorité   | Durée estimée | Catégorie |
|----------------------|------------|---------------|-----------|
| Mise en place de la base de données relationnelle | 1 | 2 heures | Base de données |
| Mise en place de la base de données vectorielle | 1 | 4 heures | Base de données |
| Implémentation de l'authentification | 2 | 8 heures | Sécurité |
| Implémentation de l'upload de fichiers  | 1 | 4 heures | Gestion des fichiers |
| Stockage et indexation des fichiers dans pgvector | 1 | 8 heuers | Gestion des fichiers |
| Implémentation de la suppression/modification des fichiers | 3 | 2 heures | Gestion des fichiers |
| Implémentation de génération d'évaluation à partir d'un prompt utilisateur | 1 | 3 jours | Génération d'évaluations |
| Implémentation de génération d'évaluation inspirées d'un fichier d'évaluation fourni | 2 | 3 jours | Génération d'évaluations |
| Implémentation des options de générations (types de questions, difficulté)  | 2 | 2 jours | Génération d'évaluations |
| Implémentation de regénération de question à partir de feedback utilisateur | 2 | 2 jours | Génération d'évaluations |
| Implémentation de système d'ajout de question avec un prompt utilisateur | 3 | 1 jour | Gestion + génération d'évaluations |
| Implémentation du tableau de bord utilisateur | 2 | 4 heures | Gestion d'évaluations |
| Implémentation de la modification/suppression de questions | 3 | 5 heures | Gestion d'évaluations |
| Implémentation de mode "test" d'évaluation | 3 | 2 jours | Gestion d'évaluations |
| Implémentation de la correction automatique des réponses utilisateurs | 3 | 2 jours | Gestion d'évaluations |
| Implémentation du mode affichage (questions + réponses) | 1 | 4 heures | Gestion d'évaluations |
| Implémentation sauvegarde des évaluations en fichier local | 3 | 2 jours | Gestion d'évaluations |
| Implémentation partage des évaluations entre utilisateurs | 3 | 1 jour | Gestion d'évaluations |
| Déploiment de la WebApp | 2 | 1 jour | DevOps |
| Déploiment de la DB | 2 | 4 heures | DevOps |
| Mise en place de CI/CD | 3 | 4 heures | DevOps |
