#!/usr/bin/env node

/**
 * Script de vérification pré-push pour empêcher la divulgation accidentelle de secrets
 * 
 * Utilisez en l'ajoutant à votre hook pre-push Git ou exécutez manuellement avant de pousser:
 * node scripts/pre-push-check.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Motifs à rechercher dans les fichiers modifiés
const sensitivePatterns = [
  // Clés API et secrets
  /sk_live_[0-9a-zA-Z]{24}/g,       // Clés secrètes Stripe live
  /sk_test_[0-9a-zA-Z]{24}/g,       // Clés secrètes Stripe test
  /rk_live_[0-9a-zA-Z]{24}/g,       // Clés restreintes Stripe live
  /rk_test_[0-9a-zA-Z]{24}/g,       // Clés restreintes Stripe test
  /pk_live_[0-9a-zA-Z]{24}/g,       // Clés publiques Stripe live
  /pk_test_[0-9a-zA-Z]{24}/g,       // Clés publiques Stripe test
  /AIza[0-9A-Za-z-_]{35}/g,         // Clés API Google
  /[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com/g, // ID clients OAuth Google
  /-----BEGIN PRIVATE KEY-----|-----BEGIN RSA PRIVATE KEY-----|-----BEGIN DSA PRIVATE KEY-----|-----BEGIN EC PRIVATE KEY-----/g, // Début de clés privées
  /-----BEGIN OPENSSH PRIVATE KEY-----|-----BEGIN PGP PRIVATE KEY BLOCK-----/g, // Autres formats de clés privées
  /ghp_[0-9a-zA-Z]{36}/g,           // GitHub Personal Access Tokens
  /github_pat_[0-9a-zA-Z_]{82}/g,   // GitHub Personal Access Tokens (nouveau format)
  /[0-9a-f]{32}-us[0-9]{1,2}/g,     // Clés API MailChimp
  /xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9a-zA-Z]{24}/g, // Tokens Slack
  /amazonaws\.com.+[A-Za-z0-9/+=]{40}/g, // Clés AWS
  /AKIA[0-9A-Z]{16}/g,              // IDs de clés d'accès AWS
  /postgres:\/\/.*:.*@.*:[0-9]{4,5}\/[a-zA-Z0-9]*/g, // URLs PostgreSQL
  /mongodb:\/\/.*:.*@.*:[0-9]{4,5}\/[a-zA-Z0-9]*/g,  // URLs MongoDB
  /redis:\/\/.*:.*@.*:[0-9]{4,5}\//g, // URLs Redis
];

// Noms de fichiers à toujours ignorer
const ignoredFilePatterns = [
  /\.env\.example/,
  /\.env\.template/,
  /\.env\.sample/,
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
  /node_modules/,
  /\.git\//,
  /\.next\//,
  /build\//,
  /dist\//,
  /\.history\//,
];

// Obtenez la liste des fichiers modifiés
try {
  // Liste tous les fichiers indexés pour commit
  const stagedFiles = execSync('git diff --name-only --cached', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  // Liste tous les fichiers modifiés mais non indexés
  const unstageFiles = execSync('git diff --name-only', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  // Combiner et dédupliquer
  const allModifiedFiles = [...new Set([...stagedFiles, ...unstageFiles])];

  let potentialSecrets = [];

  // Vérifier chaque fichier
  allModifiedFiles.forEach(file => {
    // Ignorer les fichiers selon les motifs
    if (ignoredFilePatterns.some(pattern => pattern.test(file))) {
      return;
    }

    try {
      // Vérifier si le fichier existe
      if (!fs.existsSync(file)) {
        return;
      }
      
      // Lire le contenu du fichier
      const content = fs.readFileSync(file, 'utf8');
      
      // Vérifier pour chaque motif sensible
      sensitivePatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          potentialSecrets.push({
            file,
            pattern: pattern.toString(),
            matches: matches.length
          });
        }
      });
    } catch (err) {
      console.error(`Erreur lors de la lecture du fichier ${file}:`, err.message);
    }
  });

  // Afficher les résultats
  if (potentialSecrets.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '⚠️ ATTENTION: Informations sensibles potentiellement détectées!');
    console.error('\x1b[31m%s\x1b[0m', 'Les fichiers suivants contiennent des motifs qui ressemblent à des secrets:');
    console.error('');
    
    potentialSecrets.forEach(({ file, pattern, matches }) => {
      console.error(`  File: \x1b[33m${file}\x1b[0m`);
      console.error(`  Pattern détecté: ${pattern}`);
      console.error(`  Nombre de correspondances: ${matches}`);
      console.error('');
    });
    
    console.error('\x1b[31m%s\x1b[0m', 'Veuillez retirer ces informations sensibles avant de pousser!');
    console.error('\x1b[33m%s\x1b[0m', 'Conseil: Utilisez des variables d\'environnement et .env pour les secrets.');
    console.error('');
    process.exit(1);
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✅ Aucune information sensible détectée dans les fichiers modifiés.');
    process.exit(0);
  }
} catch (error) {
  console.error('Erreur lors de l\'exécution du script:', error.message);
  process.exit(1);
} 