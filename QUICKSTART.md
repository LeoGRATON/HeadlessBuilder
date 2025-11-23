# Headless Builder - Quick Start Guide

Guide complet pour utiliser Headless Builder avec WordPress et Next.js.

## Table des matières

1. [Setup initial](#setup-initial)
2. [Créer des composants](#créer-des-composants)
3. [Créer des pages](#créer-des-pages)
4. [Export vers WordPress](#export-vers-wordpress)
5. [Créer un projet Next.js](#créer-un-projet-nextjs)
6. [Workflow de développement](#workflow-de-développement)

---

## Setup initial

### 1. Installation

```bash
# Cloner le repo
git clone https://github.com/LeoGRATON/HeadlessBuilder.git
cd HeadlessBuilder

# Backend
cd backend
npm install
cp .env.example .env
# Configurer DATABASE_URL, JWT_SECRET dans .env
npx prisma migrate dev
npm run dev

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev
```

### 2. Créer un compte

Ouvrir http://localhost:5173 et créer un compte agence.

---

## Créer des composants

### 1. Aller dans Components

Menu latéral → **Components** → **New Component**

### 2. Exemple: Hero Component

**Informations de base:**
- **Name:** Hero Section
- **Slug:** hero
- **Description:** Hero section avec titre, sous-titre et CTA

**Schema (JSON):**

```json
{
  "fields": [
    {
      "name": "title",
      "label": "Titre principal",
      "type": "text",
      "required": true,
      "helpText": "Le titre principal du hero"
    },
    {
      "name": "subtitle",
      "label": "Sous-titre",
      "type": "textarea",
      "required": false,
      "helpText": "Description ou tagline"
    },
    {
      "name": "backgroundImage",
      "label": "Image de fond",
      "type": "image",
      "required": true
    },
    {
      "name": "ctaText",
      "label": "Texte du bouton",
      "type": "text",
      "required": true
    },
    {
      "name": "ctaUrl",
      "label": "Lien du bouton",
      "type": "url",
      "required": true
    },
    {
      "name": "alignment",
      "label": "Alignement",
      "type": "select",
      "required": true,
      "defaultValue": "center",
      "choices": [
        { "label": "Gauche", "value": "left" },
        { "label": "Centre", "value": "center" },
        { "label": "Droite", "value": "right" }
      ]
    }
  ]
}
```

### 3. Autres exemples

**CTA Section:**

```json
{
  "fields": [
    {
      "name": "heading",
      "label": "Titre",
      "type": "text",
      "required": true
    },
    {
      "name": "description",
      "label": "Description",
      "type": "wysiwyg",
      "required": false
    },
    {
      "name": "buttonText",
      "label": "Texte du bouton",
      "type": "text",
      "required": true
    },
    {
      "name": "buttonLink",
      "label": "Lien",
      "type": "url",
      "required": true
    },
    {
      "name": "style",
      "label": "Style",
      "type": "select",
      "required": true,
      "defaultValue": "primary",
      "choices": [
        { "label": "Primary", "value": "primary" },
        { "label": "Secondary", "value": "secondary" },
        { "label": "Outline", "value": "outline" }
      ]
    }
  ]
}
```

---

## Créer des pages

### 1. Créer un client

**Clients** → **New Client**
- Name: Mon Client
- Email: client@example.com

### 2. Créer un projet

**Projects** → **New Project**
- Name: Site vitrine
- Client: Mon Client
- Description: Site WordPress avec Next.js

### 3. Créer une page

**Pages** → **New Page**
- Name: Homepage
- Slug: home
- Project: Site vitrine
- Title: Accueil - Mon Site
- Description: Page d'accueil du site

### 4. Builder de page

Cliquer sur **Edit** sur la page → **Page Builder**

**Ajouter des composants:**
1. Cliquer **Add Component**
2. Sélectionner Hero Section
3. Remplir les champs:
   - Title: "Bienvenue sur notre site"
   - Subtitle: "Des solutions innovantes pour votre business"
   - Background Image: https://images.unsplash.com/photo-1...
   - CTA Text: "Découvrir"
   - CTA URL: /about
   - Alignment: center

4. Cliquer **Add Component** à nouveau
5. Sélectionner CTA Section
6. Remplir et sauvegarder

**Actions:**
- ↑↓ Réordonner les composants
- ✏️ Éditer un composant
- 🗑️ Supprimer un composant

---

## Export vers WordPress

### 1. Préparer WordPress

```bash
# Si vous n'avez pas WordPress local
docker run -d \
  -p 8000:80 \
  -e WORDPRESS_DB_HOST=host.docker.internal:3306 \
  -e WORDPRESS_DB_NAME=wordpress \
  -e WORDPRESS_DB_USER=root \
  -e WORDPRESS_DB_PASSWORD=password \
  wordpress:latest
```

### 2. Installer les plugins requis

Dans WordPress admin:
- Installer et activer **Advanced Custom Fields** (Free suffit)
- Installer et activer **WPGraphQL** (optionnel mais recommandé)

### 3. Installer le plugin Headless Builder Sync

```bash
# Copier le plugin
cp -r HeadlessBuilder/wordpress-plugin /path/to/wordpress/wp-content/plugins/headless-builder-sync

# Ou via Docker
docker cp HeadlessBuilder/wordpress-plugin wordpress_container:/var/www/html/wp-content/plugins/headless-builder-sync
```

Activer le plugin dans WordPress admin.

### 4. Exporter depuis Builder

Dans Builder:
1. **Projects** → Cliquer sur votre projet
2. Cliquer **Export** (icône download verte)
3. Télécharger **ACF Fields** (JSON)

### 5. Importer dans WordPress

**Option A: Via le plugin Headless Builder Sync**

1. WordPress admin → **Headless Builder**
2. Configurer:
   - Builder URL: `http://localhost:3001`
   - Project ID: (copier depuis l'URL du builder)
   - API Token: (copier depuis le localStorage après login)
3. Cliquer **Save Settings**
4. Cliquer **Sync Now**

**Option B: Import manuel ACF**

1. WordPress admin → **Custom Fields** → **Tools**
2. Onglet **Import Field Groups**
3. Upload le fichier JSON téléchargé
4. Importer

### 6. Vérifier

1. Créer une nouvelle page WordPress avec le slug `home`
2. Les champs ACF doivent apparaître automatiquement
3. Remplir les champs avec vos valeurs

---

## Créer un projet Next.js

### 1. Installer le CLI

```bash
# Depuis le dossier HeadlessBuilder
cd cli
npm link

# Ou utiliser directement
npx @headless-builder/cli init mon-site
```

### 2. Initialiser le projet

```bash
headless-builder init mon-site
```

**Prompts:**
- Template: `Next.js + Apollo Client`
- Builder URL: `http://localhost:3001`
- Project ID: (votre project ID)
- WordPress URL: `http://localhost:8000/graphql`

### 3. Démarrer le dev

```bash
cd mon-site
npm run dev
```

### 4. Structure générée

```
mon-site/
├── app/                      # Next.js 14 App Router
├── components/
│   ├── builder/             # Composants générés
│   │   ├── Hero.tsx
│   │   └── Cta.tsx
│   └── PageRenderer.tsx
├── lib/
│   ├── graphql-client.ts    # Apollo Client
│   └── generated/           # Types TypeScript
├── schema.graphql           # Schema depuis Builder
└── .env.local              # Config
```

### 5. Utiliser les composants

**app/page.tsx:**

```tsx
import { client } from '@/lib/graphql-client';
import { gql } from '@apollo/client';
import Hero from '@/components/builder/Hero';
import Cta from '@/components/builder/Cta';

const GET_PAGE = gql`
  query GetPage($slug: String!) {
    pageBy(uri: $slug) {
      id
      title
      heroTitle: hero_title
      heroSubtitle: hero_subtitle
      heroBackgroundImage: hero_background_image {
        sourceUrl
      }
      heroCtaText: hero_cta_text
      heroCtaUrl: hero_cta_url
      heroAlignment: hero_alignment
    }
  }
`;

export default async function Home() {
  const { data } = await client.query({
    query: GET_PAGE,
    variables: { slug: 'home' },
  });

  const page = data.pageBy;

  return (
    <main>
      <Hero
        title={page.heroTitle}
        subtitle={page.heroSubtitle}
        backgroundImage={page.heroBackgroundImage.sourceUrl}
        ctaText={page.heroCtaText}
        ctaUrl={page.heroCtaUrl}
        alignment={page.heroAlignment}
      />
    </main>
  );
}
```

### 6. Implémenter les composants

**components/builder/Hero.tsx:**

```tsx
interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  ctaText: string;
  ctaUrl: string;
  alignment?: 'left' | 'center' | 'right';
}

export default function Hero({
  title,
  subtitle,
  backgroundImage,
  ctaText,
  ctaUrl,
  alignment = 'center',
}: HeroProps) {
  return (
    <section
      className="relative h-screen flex items-center justify-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className={`container mx-auto text-${alignment}`}>
        <h1 className="text-5xl font-bold text-white mb-4">{title}</h1>
        {subtitle && (
          <p className="text-xl text-white/90 mb-8">{subtitle}</p>
        )}
        <a
          href={ctaUrl}
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {ctaText}
        </a>
      </div>
    </section>
  );
}
```

---

## Workflow de développement

### Cycle complet

```
1. Builder → Créer/modifier composants
           ↓
2. Builder → Créer/modifier pages avec composants
           ↓
3. Builder → Export ACF JSON
           ↓
4. WordPress → Import ACF fields
           ↓
5. WordPress → Remplir les données dans les pages
           ↓
6. Next.js → Sync schema GraphQL
           ↓
7. Next.js → Regénérer types TypeScript
           ↓
8. Next.js → Développer les composants React
           ↓
9. Next.js → Query et render les données
```

### Commandes utiles

**Backend:**
```bash
cd backend
npm run dev              # Démarrer le serveur API
npx prisma studio        # Explorer la base de données
npx prisma migrate dev   # Créer une migration
```

**Frontend:**
```bash
cd frontend
npm run dev              # Démarrer le builder
npm run build            # Build production
```

**CLI:**
```bash
headless-builder init my-site          # Nouveau projet
headless-builder sync                  # Sync schema
headless-builder generate              # Générer types + composants
```

**Next.js:**
```bash
npm run dev              # Dev server
npm run codegen          # Générer types GraphQL
npm run codegen:watch    # Watch mode
npm run build            # Build production
```

### Après modification de composants

```bash
# 1. Re-exporter depuis Builder
# Télécharger le nouveau JSON ACF

# 2. Re-sync WordPress
# Via plugin ou import manuel

# 3. Re-sync Next.js
cd mon-site
headless-builder sync    # Télécharge nouveau schema
npm run codegen          # Regénère types TypeScript

# 4. Mettre à jour les composants React si nécessaire
```

---

## Tips & Best Practices

### Nommage des composants

- **Slug:** kebab-case (`hero-section`, `cta-block`)
- **Name:** Human-readable (`Hero Section`, `CTA Block`)
- **GraphQL Type:** PascalCase + Component (`HeroSectionComponent`)
- **React Component:** PascalCase (`HeroSection`)

### Structure des schemas

```json
{
  "fields": [
    {
      "name": "fieldName",        // camelCase
      "label": "Field Label",     // Human readable
      "type": "text",             // ACF field type
      "required": true,           // Boolean
      "defaultValue": "",         // Valeur par défaut
      "helpText": "Description",  // Aide contextuelle
      "choices": []               // Pour select/radio
    }
  ]
}
```

### Types de champs disponibles

- `text` → Input texte simple
- `textarea` → Zone de texte multiligne
- `wysiwyg` → Éditeur riche
- `image` → Sélecteur d'image
- `url` → Input URL
- `number` → Input numérique
- `boolean` → Checkbox
- `select` → Liste déroulante (avec `choices`)

### Organisation des pages

Créer une hiérarchie logique:

```
Agency
└── Client: Acme Corp
    └── Project: Site vitrine
        ├── Page: Homepage (slug: home)
        ├── Page: About (slug: about)
        ├── Page: Services (slug: services)
        └── Page: Contact (slug: contact)
```

### Sécurité

- Ne jamais commit `.env` ou `.env.local`
- Utiliser des tokens JWT pour l'API
- Restreindre les CORS en production
- Valider les données côté backend

---

## Troubleshooting

### Les composants n'apparaissent pas dans WordPress

✅ Vérifier:
1. ACF est activé
2. Les field groups sont importés (Custom Fields → Field Groups)
3. La page WordPress a le bon slug
4. Les location rules dans le JSON ciblent `page == slug`

### Erreur lors du sync CLI

```
Error: Could not connect to Builder
```

✅ Solutions:
1. Vérifier que le backend tourne (`http://localhost:3001`)
2. Vérifier le Project ID dans `.env.local`
3. Vérifier l'URL dans la commande

### Types TypeScript non générés

```
Error: Cannot find module './generated'
```

✅ Solutions:
1. Vérifier que `schema.graphql` existe
2. Lancer `npm run codegen`
3. Vérifier `codegen.ts` configuration

### Les données WordPress ne s'affichent pas

✅ Vérifier:
1. WPGraphQL est installé et activé
2. Les champs ACF sont remplis dans WordPress
3. L'URL GraphQL est correcte dans `.env.local`
4. Les queries GraphQL matchent les noms de champs ACF

---

## Ressources

- **Documentation ACF:** https://www.advancedcustomfields.com/resources/
- **WPGraphQL:** https://www.wpgraphql.com/docs/introduction
- **Apollo Client:** https://www.apollographql.com/docs/react
- **Next.js:** https://nextjs.org/docs
- **GraphQL Codegen:** https://the-guild.dev/graphql/codegen

---

## Support

Pour toute question ou problème:
- GitHub Issues: https://github.com/LeoGRATON/HeadlessBuilder/issues
- Documentation: [README.md](./README.md)
