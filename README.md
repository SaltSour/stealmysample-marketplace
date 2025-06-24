# StealmySample Marketplace

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/SaltSour/stealmysample/main.yml?branch=main)
![GitHub last commit](https://img.shields.io/github/last-commit/SaltSour/stealmysample)
![GitHub package.json version](https://img.shields.io/github/package-json/v/SaltSour/stealmysample)
![GitHub license](https://img.shields.io/github/license/SaltSour/stealmysample)

> Une marketplace moderne pour les producteurs de musique pour découvrir, acheter et vendre des samples et loops de haute qualité.

## 🎵 Présentation

StealmySample Marketplace est une application web Next.js qui offre aux producteurs de musique une plateforme pour:

- Parcourir des milliers de samples audio de haute qualité
- Télécharger des packs de samples complets
- Acheter des samples individuels dans différents formats (WAV, STEMS, MIDI)
- Créer et vendre ses propres samples
- Gérer sa bibliothèque de sons

## 🚀 Technologies

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma
- **Base de données**: PostgreSQL
- **Authentication**: NextAuth.js
- **Paiements**: Stripe
- **Stockage**: AWS S3 (à venir)
- **Audio**: Wavesurfer.js

## 📋 Fonctionnalités

- ✅ Authentification utilisateur et gestion des profils
- ✅ Parcours et recherche de samples
- ✅ Création et gestion de packs de samples
- ✅ Système de panier avec sélection de format
- ✅ Traitement audio basique (visualisation de formes d'onde)
- ✅ Tableaux de bord pour producteurs et créateurs
- ✅ Tags et catégorisation de genres
- 🚧 Intégration de paiement (en cours)
- 🚧 Téléchargement sécurisé (à venir)
- 🚧 Analytics pour créateurs (à venir)

## 🔧 Installation

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions d'installation complètes.

### Prérequis

- Node.js 18+
- PostgreSQL
- Compte Stripe pour les paiements

### Démarrage rapide

```bash
# Cloner le projet
git clone https://github.com/SaltSour/stealmysample.git
cd stealmysample

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Modifiez .env.local avec vos propres valeurs

# Initialiser la base de données
npx prisma migrate dev

# Démarrer le serveur de développement
npm run dev
```

## 🛣️ Structure du Projet

```
stealmysample-marketplace/
├── app/                # Routes Next.js et composants de page
├── components/         # Composants React réutilisables
├── lib/               # Utilitaires et fonctions
├── prisma/            # Schéma et migrations Prisma
├── public/            # Fichiers statiques
└── scripts/           # Scripts utilitaires
```

## 🔧 Scripts Utilitaires

Le projet contient plusieurs scripts utilitaires pour faciliter la maintenance et la gestion des données.

### Correction des durées de samples

Si certains samples n'affichent pas correctement leur durée, vous pouvez utiliser le script de correction des durées :

```bash
# Corriger tous les samples avec durées manquantes
npx ts-node scripts/fix-durations.ts

# Corriger un nombre limité de samples (ex: 10)
npx ts-node scripts/fix-durations.ts 10

# Corriger tous les samples (même ceux avec durées existantes)
npx ts-node scripts/fix-durations.ts 50 all
```

Ce script analyse les fichiers audio et estime leur durée en fonction de leur taille et format.

## 📝 Contribution

Veuillez consulter [CONTRIBUTING.md](./CONTRIBUTING.md) pour les détails sur notre code de conduite et le processus de soumission des Pull Requests.

## 🔐 Sécurité

Pour signaler une vulnérabilité de sécurité, veuillez nous contacter directement plutôt que d'ouvrir une issue publique.

## 📄 Licence

Ce projet est sous licence [MIT](./LICENSE).

## 📞 Contact

Pour toute question ou assistance, veuillez ouvrir une issue sur GitHub.
