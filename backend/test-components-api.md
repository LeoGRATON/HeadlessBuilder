# Test API Components

## Prérequis
1. Serveur backend lancé : `npm run dev` (depuis la racine)
2. Avoir un token JWT (créer un compte ou se connecter)

## 1. Créer un compte et récupérer le token

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@agency.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "agencyName": "Test Agency"
  }'

# Réponse contient le token
# Copiez le token et remplacez YOUR_TOKEN ci-dessous
```

## 2. Créer un composant Hero

```bash
curl -X POST http://localhost:3001/api/components \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Hero Section",
    "category": "Hero",
    "description": "Section hero avec titre, sous-titre et CTA",
    "schema": {
      "fields": [
        {
          "name": "title",
          "type": "text",
          "label": "Titre principal",
          "required": true,
          "defaultValue": "Bienvenue",
          "placeholder": "Entrez le titre..."
        },
        {
          "name": "subtitle",
          "type": "textarea",
          "label": "Sous-titre",
          "required": false,
          "placeholder": "Entrez le sous-titre..."
        },
        {
          "name": "backgroundImage",
          "type": "image",
          "label": "Image de fond",
          "required": false
        },
        {
          "name": "ctaText",
          "type": "text",
          "label": "Texte du bouton",
          "defaultValue": "En savoir plus"
        },
        {
          "name": "ctaUrl",
          "type": "url",
          "label": "Lien du bouton"
        },
        {
          "name": "ctaStyle",
          "type": "select",
          "label": "Style du bouton",
          "options": [
            { "label": "Primary", "value": "primary" },
            { "label": "Secondary", "value": "secondary" },
            { "label": "Outline", "value": "outline" }
          ],
          "defaultValue": "primary"
        }
      ]
    }
  }'
```

## 3. Lister tous les composants

```bash
curl http://localhost:3001/api/components \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 4. Récupérer un composant spécifique

```bash
# Remplacez COMPONENT_ID par l'ID retourné lors de la création
curl http://localhost:3001/api/components/COMPONENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 5. Mettre à jour un composant

```bash
curl -X PUT http://localhost:3001/api/components/COMPONENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Hero Section Updated",
    "description": "Section hero mise à jour"
  }'
```

## 6. Supprimer un composant

```bash
curl -X DELETE http://localhost:3001/api/components/COMPONENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 7. Recherche et filtres

```bash
# Filtrer par catégorie
curl "http://localhost:3001/api/components?category=Hero" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Rechercher
curl "http://localhost:3001/api/components?search=hero" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Exemples de composants à créer

### Card Component
```json
{
  "name": "Card",
  "category": "Card",
  "description": "Carte avec image, titre et texte",
  "schema": {
    "fields": [
      {
        "name": "image",
        "type": "image",
        "label": "Image",
        "required": true
      },
      {
        "name": "title",
        "type": "text",
        "label": "Titre",
        "required": true
      },
      {
        "name": "description",
        "type": "textarea",
        "label": "Description"
      },
      {
        "name": "link",
        "type": "url",
        "label": "Lien"
      }
    ]
  }
}
```

### CTA Banner
```json
{
  "name": "CTA Banner",
  "category": "CTA",
  "description": "Bannière call-to-action",
  "schema": {
    "fields": [
      {
        "name": "title",
        "type": "text",
        "label": "Titre",
        "required": true
      },
      {
        "name": "description",
        "type": "textarea",
        "label": "Description"
      },
      {
        "name": "buttonText",
        "type": "text",
        "label": "Texte du bouton",
        "required": true
      },
      {
        "name": "buttonUrl",
        "type": "url",
        "label": "URL du bouton",
        "required": true
      },
      {
        "name": "backgroundColor",
        "type": "text",
        "label": "Couleur de fond",
        "defaultValue": "#000000"
      }
    ]
  }
}
```
