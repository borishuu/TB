# Cahier des charges

## Description du projet
Le projet consiste à développer une application web de génération, gestion et personnalisation d'évaluations (quiz, exercices, travaux écrits) en utilisant des technologies basées sur des modèles de langage (LLMs).

L'objectif n'est pas simplement de générer du contenu automatiquement, mais de proposer un environnement interactif, structuré et contrôlable pour accompagner les utilisateurs dans la conception efficace et sur-mesure d'évaluations pédagogiques adaptées à leur contexte.

Cette plateforme combinera la puissance de l'IA générative avec une interface ergonomique et des outils de révision, de personnalisation et de gestion pour répondre aux exigences pédagogiques des utilisateurs.

## Contexte
Aujourd'hui, de nombreux enseignants passent un temps considérable à préparer des quiz, exercices et travaux écrits. Il leur faut inventer des questions claires, équilibrées, variées, et adaptées au niveau des étudiants et aux objectifs pédagogiques. En outre, les étudiants manquent souvent des exercices et des évaluations d'entraînement pertinents pour les permettre de s'entraîner de manière efficace et autonome.

Les LLMs existants sont des outils puissants pour la génération automatique de contenu, mais leur utilisation brute présente plusieurs limites, telles que :
- Manque de structure/cohérence dans les évaluations générées
- Risque d'erreurs ou de contenu non conforme aux attentes
- Gestion et sauvegarde des évaluations générées très limité
- Interface peu adaptée pour une utilisation récurrente et collaborative

C'est ici que cette application apporte une réelle plus-value. Elle offre une interface dédiée à la création d'évaluations assistée par IA, qui guide les utilisateurs dans la formulation de leurs besoins, tout en leur offrant :

- Une base de données pour gérer et retrouver leurs évaluations
- Un système de modification et régénération fine de chaque question spécifique
- Un espace de gestion des fichiers de cours liés
- Des garanties de structure et de format des évaluations générées
- Une personnalisation du comportement du LLM pour répondre aux attentes (niveau de difficulté, types de questions, quantité de questions, etc)
- Un moyen d'effectuer l'évaluation directement sur la plateforme avec un retour sur les réponses fournies

## Cas d'utilisation

### Enseignants
Création rapide et efficace de quiz, exercices et travaux écrits pour les étudiants.

### Étudiants
Révision de cours facilitée en générant des évaluations à partir des fichiers de cours ou des travaux écrits de référence, avec un moyen d'effectuer ces évaluations directement sur la plateforme.

## Stack technologique

### Développement WebApp
- NextJS (développement WebApp backend + frontend)
- TypeScript (langage de développement)

### Base de Données
- Prisma (ORM)
- PostgreSQL (BD)
- pgvector (BD vectorielle)

### Intelligence Artificielle
- API d'un LLM pour assister à la génération d'évaluations

### Authentification
- bcrypt (hachage/vérification de mdp)
- Jose (signer/vérifier JWT pour authentification)

## Spécifications fonctionnelles

### Gestion des fichiers
- Utilisateur upload ses fichiers qui sont stockés dans son "pool" personnel
- Les fichiers uploadés sont vectorisés et stockés dans pgvector
- Utilisateur peut supprimer/adapter les fichiers dans son pool
- Possibilité d'uploader directement un fichier pour génération d'évaluation sans passer par le pool de fichiers

### Génération d'évaluations
- Génération d'évaluations depuis un prompt utilisateur pour récupérer les passages pertinents dans son pool de fichiers sur lesquels le modèle LLM va se baser
- Génération d'évaluations inspirées d'un fichier d'évaluation fourni
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
- Chaque utilisateur dispose d'un tableau de bord avec ses évaluations
- Possibilité de partager des évaluations avec d'autres utilisateurs
- Interface responsive pour mobile
- Possibilité de sauvegarder les évaluations générées dans un fichier local (PDF, JSON)
- Possibilité de dupliquer/supprimer des évaluations


## Tâches à effectuer

| Tâche                | Priorité   | Durée estimée | Catégorie |
|----------------------|------------|---------------|-----------|
| Mise en place de la base de données relationnelle | 1 | 4 heures | Base de données |
| Mise en place de la base de données vectorielle | 1 | 8 heures | Base de données |
| Implémentation de l'authentification | 2 | 8 heures | Sécurité |
| Implémentation de l'upload de fichiers  | 1 | 8 heures | Gestion des fichiers |
| Stockage et indexation des fichiers dans pgvector | 1 | 8 heures | Gestion des fichiers |
| Implémentation de la suppression/modification des fichiers | 3 | 16 heures | Gestion des fichiers |
| Implémentation de génération d'évaluation à partir d'un prompt utilisateur | 1 | 30 heures | Génération d'évaluations |
| Implémentation de génération d'évaluation inspirées d'un fichier d'évaluation fourni | 2 | 24 heures | Génération d'évaluations |
| Implémentation des options de générations (types de questions, difficulté)  | 2 | 16 heures | Génération d'évaluations |
| Implémentation de regénération de question à partir de feedback utilisateur | 2 | 16 heures | Génération d'évaluations |
| Implémentation de système d'ajout de question avec un prompt utilisateur | 3 | 10 heures | Gestion + génération d'évaluations |
| Implémentation du tableau de bord utilisateur | 2 | 24 heures | Gestion d'évaluations |
| Implémentation de la modification/suppression de questions | 3 | 8 heures | Gestion d'évaluations |
| Implémentation de mode "test" d'évaluation | 3 | 24 heures | Gestion d'évaluations |
| Implémentation de la correction automatique des réponses utilisateurs | 3 | 24 heures | Gestion d'évaluations |
| Implémentation du mode affichage (questions + réponses) | 1 | 6 heures | Gestion d'évaluations |
| Implémentation sauvegarde des évaluations en fichier local | 3 | 16 heures | Gestion d'évaluations |
| Implémentation partage des évaluations entre utilisateurs | 3 | 12 heures | Gestion d'évaluations |
| Amélioration expérience utilisateur | 3 | 16 heures | UX |
| Déploiment de la WebApp | 2 | 10 heures | DevOps |
| Déploiment de la DB | 2 | 12 heures | DevOps |
| Mise en place de CI/CD | 3 | 10 heures | DevOps |
| Hébergement du LLM choisi sur serveur local | 2 | 10 heures | DevOps |
| Documentation du rapport | 1 | 140 heures | Documentation |

## Tâches à effectuer

Tâche : Mise en place de la base de données relationnelle, priorité : 1, durée estimée : 4 heures, catégorie : Base de données
Tâche : Mise en place de la base de données vectorielle, priorité : 1, durée estimée : 8 heures, catégorie : Base de données
Tâche : Implémentation de l'authentification, priorité : 2, durée estimée : 8 heures, catégorie : Sécurité
Tâche : Implémentation de l'upload de fichiers, priorité : 1, durée estimée : 8 heures, catégorie : Gestion des fichiers
Tâche : Stockage et indexation des fichiers dans pgvector, priorité : 1, durée estimée : 8 heures, catégorie : Gestion des fichiers
Tâche : Implémentation de la suppression/modification des fichiers, priorité : 3, durée estimée : 14 heures, catégorie : Gestion des fichiers
Tâche : Implémentation de génération d'évaluation à partir d'un prompt utilisateur, priorité : 1, durée estimée : 24 heures, catégorie : Génération d'évaluations
Tâche : Implémentation de génération d'évaluation inspirées d'un fichier d'évaluation fourni, priorité : 2, durée estimée : 24 heures, catégorie : Génération d'évaluations
Tâche : Implémentation des options de générations (types de questions, difficulté), priorité : 2, durée estimée : 14 heures, catégorie : Génération d'évaluations
Tâche : Implémentation de regénération de question à partir de feedback utilisateur, priorité : 2, durée estimée : 14 heures, catégorie : Génération d'évaluations
Tâche : Implémentation de système d'ajout de question avec un prompt utilisateur, priorité : 3, durée estimée : 10 heures, catégorie : Gestion + génération d'évaluations
Tâche : Implémentation du tableau de bord utilisateur, priorité : 2, durée estimée : 24 heures, catégorie : Gestion d'évaluations
Tâche : Implémentation de la modification/suppression de questions, priorité : 3, durée estimée : 8 heures, catégorie : Gestion d'évaluations
Tâche : Implémentation de mode "test" d'évaluation, priorité : 3, durée estimée : 24 heures, catégorie : Gestion d'évaluations
Tâche : Implémentation de la correction automatique des réponses utilisateurs, priorité : 3, durée estimée : 24 heures, catégorie : Gestion d'évaluations
Tâche : Implémentation du mode affichage (questions + réponses), priorité : 1, durée estimée : 6 heures, catégorie : Gestion d'évaluations
Tâche : Implémentation sauvegarde des évaluations en fichier local, priorité : 3, durée estimée : 12 heures, catégorie : Gestion d'évaluations
Tâche : Implémentation partage des évaluations entre utilisateurs, priorité : 3, durée estimée : 12 heures, catégorie : Gestion d'évaluations
Tâche : Création de la maquette de l'application, priorité : 1, durée estimée : 6 heures, catégorie : Conception
Tâche : Mise ne place des tests unitaires, priorité : 2, durée estimée : 16 heures, catégorie : Tests
Tâche : Mise ne place des tests E2E, priorité : 2, durée estimée : 20 heures, catégorie : Tests
Tâche : Amélioration expérience utilisateur, priorité : 3, durée estimée : 10 heures, catégorie : UX
Tâche : Déploiment de la WebApp, priorité : 2, durée estimée : 10 heures, catégorie : DevOps
Tâche : Déploiment de la DB, priorité : 2, durée estimée : 12 heures, catégorie : DevOps
Tâche : Mise en place de CI/CD, priorité : 3, durée estimée : 10 heures, catégorie : DevOps
Tâche : Hébergement du LLM choisi sur serveur local, priorité : 2, durée estimée : 10 heures, catégorie : DevOps
Tâche : Documentation du rapport, priorité : 1, durée estimée : 120 heures, catégorie : Documentation


Total heures : 460 heures

16 + 20 + 6 = 22 + 20 = 42 22 16 12 6 2