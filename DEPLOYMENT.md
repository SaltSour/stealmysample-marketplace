# Guide de Déploiement - StealmySample Marketplace

Ce document décrit les étapes pour déployer correctement l'application StealmySample Marketplace.

## Prérequis

- Node.js 18+ et npm
- Base de données PostgreSQL
- Compte Stripe pour les paiements
- Compte AWS S3 (ou équivalent) pour le stockage des fichiers

## Variables d'Environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes:

```
# Stripe Keys
STRIPE_SECRET_KEY=votre_cle_secrete_stripe
STRIPE_PUBLISHABLE_KEY=votre_cle_publique_stripe
STRIPE_WEBHOOK_SECRET=votre_cle_secrete_webhook_stripe

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stealmysample

# Next Auth
NEXTAUTH_SECRET=une_chaine_aleatoire_secrete
NEXTAUTH_URL=http://localhost:3000

# AWS S3 (ou service de stockage similaire)
S3_ACCESS_KEY=votre_cle_acces_s3
S3_SECRET_KEY=votre_cle_secrete_s3
S3_BUCKET_NAME=votre_nom_de_bucket_s3
S3_REGION=votre_region_s3
```

## Structure des Branches

Le projet utilise une structure de branches à trois niveaux:

- `main` - Production stable
- `staging` - Environnement de préproduction pour les tests
- `DEV` - Développement courant

## Installation et Déploiement Local

1. Clonez le dépôt:
   ```
   git clone https://github.com/username/stealmysample-marketplace.git
   cd stealmysample-marketplace
   ```

2. Installez les dépendances:
   ```
   npm install
   ```

3. Configurez la base de données:
   ```
   npx prisma migrate deploy
   ```

4. Lancez l'application en mode développement:
   ```
   npm run dev
   ```

## Déploiement sur un Serveur

1. Construisez l'application:
   ```
   npm run build
   ```

2. Démarrez le serveur:
   ```
   npm start
   ```

## Workflow de Développement

1. Créez une branche de fonctionnalité depuis `DEV`:
   ```
   git checkout -b feature/nom-de-la-fonctionnalite DEV
   ```

2. Après développement, créez une Pull Request vers `DEV`

3. Après validation dans `DEV`, créez une Pull Request vers `staging`

4. Après tests en staging, créez une Pull Request vers `main` pour la production

## Intégration Continue

Le workflow GitHub Actions vérifie automatiquement:
- La compilation du code
- Le linting
- Les tests

## Surveillance et Monitoring

À configurer:
- Suivi des erreurs (Sentry)
- Monitoring de performance
- Alertes

## Sécurité

- Toutes les clés API doivent être stockées dans les variables d'environnement
- N'incluez JAMAIS de clés ou secrets dans le code source
- Vérifiez régulièrement les dépendances pour les vulnérabilités: `npm audit` 