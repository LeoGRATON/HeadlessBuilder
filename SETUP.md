# 🚀 Setup Guide - Headless Builder

Guide d'installation et de démarrage pour le projet Headless Builder.

## 📋 Prérequis

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker Desktop (pour PostgreSQL et Redis)

## 🔧 Installation

### 1. Installer les dépendances

À la racine du projet :

```bash
npm install
```

Cela installera les dépendances pour le monorepo, le backend et le frontend.

### 2. Démarrer PostgreSQL et Redis avec Docker

```bash
npm run docker:up
```

Vérifiez que les containers sont bien démarrés :
```bash
docker ps
```

Vous devriez voir `headless-builder-db` et `headless-builder-redis` en cours d'exécution.

### 3. Configurer les variables d'environnement

Les fichiers `.env` ont déjà été créés avec les valeurs par défaut.

**Backend** (`backend/.env`):
- DATABASE_URL: connexion PostgreSQL
- JWT_SECRET: clé secrète pour les tokens (à changer en production !)
- PORT: 3001

**Frontend** (`frontend/.env`):
- VITE_API_URL: http://localhost:3001

### 4. Initialiser la base de données avec Prisma

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

Cela va :
- Générer le Prisma Client
- Créer les tables dans PostgreSQL

### 5. Démarrer l'application

Retournez à la racine du projet et lancez :

```bash
npm run dev
```

Cela démarre simultanément :
- **Backend** sur http://localhost:3001
- **Frontend** sur http://localhost:3000

## ✅ Vérification

1. Ouvrez http://localhost:3000
2. Vous devriez voir la page de login/register
3. Créez un compte (cela créera automatiquement votre agence)
4. Vous serez redirigé vers le dashboard

## 🗄️ Structure de la base de données

Le schéma multi-tenant est organisé ainsi :

```
Agency (votre agence)
├── Users (membres de l'agence)
├── Clients (vos clients)
│   └── Projects (projets par client)
│       └── Pages (pages par projet)
│           └── PageComponents (composants dans la page)
└── Components (bibliothèque de composants partagée)
```

## 📊 Prisma Studio

Pour visualiser et éditer les données en interface graphique :

```bash
cd backend
npm run db:studio
```

Ouvre Prisma Studio sur http://localhost:5555

## 🛑 Arrêter l'application

- `Ctrl+C` pour arrêter le serveur de dev
- `npm run docker:down` pour arrêter PostgreSQL et Redis

## 🔄 Reset de la base de données

Si vous voulez repartir de zéro :

```bash
cd backend
npx prisma migrate reset
```

## 📝 Prochaines étapes

Maintenant que l'étape 1.1 est complète, vous pouvez :

1. ✅ **Auth & Multi-tenant** - TERMINÉ
2. ⏳ **Bibliothèque de composants** (Étape 1.2)
3. ⏳ **Page Builder** (Étape 1.3)
4. ⏳ **Génération ACF & GraphQL** (Étape 1.4)

## 🆘 Problèmes courants

### PostgreSQL ne démarre pas
```bash
# Arrêter tous les containers
docker-compose down

# Supprimer les volumes
docker volume rm headless-builder_postgres_data

# Redémarrer
npm run docker:up
```

### Port déjà utilisé
Si le port 3001 ou 3000 est déjà pris :
- Changez `PORT` dans `backend/.env`
- Changez `VITE_API_URL` dans `frontend/.env`
- Changez `server.port` dans `frontend/vite.config.ts`

### Erreur Prisma Client
```bash
cd backend
npx prisma generate
```
