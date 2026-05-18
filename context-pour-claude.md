# Contexte et Architecture de Mogged.ai pour Claude

Ce document fournit le contexte technique et architectural nécessaire pour apporter des améliorations à l'application Mogged.ai.

## Architecture Actuelle

Mogged.ai est actuellement construit et déployé comme une **Single Page Application (SPA) statique**. 

### 1. Fichier Principal (Source de Vérité)
Toute l'interface utilisateur, le style, et la logique métier se trouvent dans un seul fichier :
`artifacts/mogged/index.html` (qui est également copié dans `public/index.html` lors du build).

Ce fichier HTML massif (~2500 lignes) contient :
- **Les métadonnées SEO et OpenGraph** (Title, Description, canonical URL, etc.)
- **Le style CSS en ligne** (variables CSS, animations, design "neon/cyberpunk" avec des couleurs cyan, violet, pink)
- **Le markup HTML complet** divisé en 5 onglets (Scanner, Haircut, Vocal, Match, Hub/Guides)
- **La logique JavaScript (Vanilla JS)** qui gère l'état de l'application :
  - Changement d'onglets (`switchTab`)
  - Flux d'authentification par email (`localStorage.setItem('mogged_email', email)`)
  - Flux de la caméra (API `navigator.mediaDevices.getUserMedia`)
  - Flux du microphone et animation de la waveform (API `AudioContext` et `AnalyserNode`)
  - Animations de faux chargement pour simuler l'IA (`runScanAnimation`, `runFakeVoiceAnimation`)
  - Système de Paywall (Stripe Buy Buttons intégrés)
  - Tableau de bord analytique basé sur le `localStorage` (`mogged_analytics_events`)

### 2. Ce qui n'est PAS utilisé en production
Bien que le dépôt contienne une structure de monorepo complexe avec plusieurs paquets (`pnpm workspaces`), la plupart de ces dossiers sont des échafaudages non utilisés en production :
- Le backend Node.js/Express (`artifacts/api-server`) n'a qu'une route de health check.
- L'application React Vite (`artifacts/mogged/src/App.tsx` et `main.tsx`) est ignorée au profit du fichier HTML statique.
- La base de données (`lib/db`) est vide.

## Fonctionnalités Clés

1. **Scanner Facial** : Demande l'accès à la caméra ou un upload d'image, simule une analyse IA, et affiche des scores (Jawline, Symmetry, Canthal Tilt, Midface Ratio).
2. **Haircut** : Débloqué après le scan, affiche des recommandations de coupe de cheveux et propose des boutons d'achat Stripe.
3. **Vocal** : Enregistre la voix pendant 3 secondes, affiche une waveform animée, et donne un "Acoustic Seduction Score".
4. **Match (Duel)** : Permet d'uploader deux photos, simule une comparaison IA et déclare un gagnant basé sur un calcul déterministe (longueur des noms + seed).
5. **Hub / Guides** : Contient des articles en dur (Jawline Masterclass, Skin Regimen, Mewing Mastery, V-Taper Build).
6. **Analytics Dashboard** : Enregistre les événements de l'utilisateur dans le `localStorage` et affiche des statistiques (taux de conversion, entonnoir).

## Flux Utilisateur et Monétisation

- L'utilisateur doit entrer son email (ou être bloqué par une modale) pour effectuer une action (scan, vocal, duel).
- Après une première analyse gratuite, une modale de "Paywall" apparaît pour limiter l'utilisation (basé sur la variable `mogged_scans_done` dans le localStorage).
- La monétisation se fait via des balises `<stripe-buy-button>` intégrées directement dans le HTML (Option Flash, Option Élite, Lifetime).

## Instructions pour Claude

Si tu dois modifier l'interface, ajouter des fonctionnalités ou corriger des bugs :
1. **Modifie UNIQUEMENT le fichier `artifacts/mogged/index.html`** (c'est la source de vérité).
2. Utilise du **Vanilla JS** et du **CSS pur** (pas de React, pas de Tailwind classes, tout est fait avec du CSS personnalisé dans la balise `<style>`).
3. Pour ajouter un événement analytique, utilise la fonction existante `trackAnalyticsEvent(type, module, details)`.
4. Pour vérifier si l'utilisateur a accès à une fonctionnalité, utilise la fonction `gateCheck(action, fileObj)`.
5. Si tu dois modifier le design, respecte le thème sombre existant avec les variables CSS définies au début du fichier (`--bg`, `--cyan`, `--violet`, etc.).

---
*Ce document a été généré pour aider à la compréhension de la base de code actuelle de Mogged.ai.*
