# Headless Builder Sync - WordPress Plugin

Plugin WordPress pour synchroniser automatiquement les ACF field groups depuis Headless Builder.

## Installation

1. Copier le dossier `wordpress-plugin` dans `/wp-content/plugins/headless-builder-sync/`
2. Activer le plugin depuis l'admin WordPress
3. S'assurer que **Advanced Custom Fields Pro** est installé et activé
4. Optionnel: Installer **WPGraphQL** pour l'API GraphQL

## Configuration

1. Aller dans **Headless Builder** dans le menu admin
2. Configurer:
   - **Builder URL**: URL de votre instance Headless Builder (ex: `http://localhost:3001`)
   - **Project ID**: L'ID de votre projet (copier depuis le Builder)
   - **API Token**: Votre JWT token (copier depuis le Builder après login)
3. Cliquer sur **Save Settings**

## Utilisation

### Synchronisation manuelle

1. Cliquer sur **Sync Now** dans la page de configuration
2. Le plugin va:
   - Récupérer les field groups depuis le Builder
   - Les importer automatiquement dans ACF
   - Afficher un résumé des imports

### API REST

Le plugin expose une API REST pour la synchronisation automatique:

#### POST `/wp-json/headless-builder/v1/sync`

Importe des field groups ACF.

**Body:**
```json
{
  "fieldGroups": [
    {
      "key": "group_hero",
      "title": "Hero Component",
      "fields": [...]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": ["Hero Component", "CTA Component"],
  "errors": [],
  "total": 2,
  "timestamp": "2024-01-15 10:30:00"
}
```

#### GET `/wp-json/headless-builder/v1/status`

Récupère le statut de la synchronisation.

**Response:**
```json
{
  "success": true,
  "acfActive": true,
  "totalFieldGroups": 5,
  "wpGraphQLActive": true
}
```

## Prérequis

- WordPress 5.8+
- PHP 7.4+
- Advanced Custom Fields Pro
- WPGraphQL (recommandé)

## Sécurité

- Toutes les requêtes API nécessitent l'authentification WordPress
- Seuls les utilisateurs avec la capacité `manage_options` peuvent synchroniser
- Les tokens sont stockés de manière sécurisée dans les options WordPress

## Développement

### Structure des fichiers

```
wordpress-plugin/
├── headless-builder-sync.php  # Plugin principal
├── assets/
│   ├── admin.css             # Styles admin
│   └── admin.js              # Scripts admin
└── README.md                 # Documentation
```

## Roadmap

- [ ] Webhooks pour synchronisation automatique
- [ ] Versioning des field groups
- [ ] Interface de preview des composants
- [ ] Support multi-sites
- [ ] Gestion des conflits

## Support

Pour tout problème ou suggestion:
- GitHub Issues: https://github.com/LeoGRATON/HeadlessBuilder/issues

## License

MIT License
