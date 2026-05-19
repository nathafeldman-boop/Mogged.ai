# Notes de Déploiement Mogde.ai — Vercel

## 🔧 Configuration Requise sur Vercel

### Variables d'Environnement

Assurez-vous que les variables d'environnement suivantes sont configurées dans votre projet Vercel :

1. **`OPENROUTER_API_KEY`** (Requis)
   - Votre clé API OpenRouter
   - Utilisée par `/api/claude.js` pour les appels IA
   - **Importance** : CRITIQUE — sans cette clé, les analyses seront bloquées

### Configuration Vercel.json

Le fichier `vercel.json` à la racine configure :
- Route `/api/(.*)` → `/api/$1` (proxy vers les fonctions serverless)
- Route `/(.*)` → `/$1` (fichiers statiques)
- Timeout de 60 secondes pour `/api/claude.js`

## 🐛 Bug Corrigé

**Problème** : L'application tentait d'appeler directement `https://models.inference.ai.azure.com` avec un token `GITHUB_TOKEN` non configuré, ce qui causait des blocages "Analyse en cours…" sans résultat.

**Solution** : Tous les appels IA ont été redirigés vers le proxy sécurisé `/api/claude.js` qui utilise OpenRouter via votre clé API.

## 📝 Fichiers Modifiés

- `artifacts/mogged/index.html` — Remplacement des 3 appels Azure directs par des appels au proxy
- `public/index.html` — Copie synchronisée du fichier corrigé

## ✅ Checklist de Déploiement

- [ ] Vérifier que `OPENROUTER_API_KEY` est configurée dans Vercel
- [ ] Attendre le redéploiement automatique (déclenché par le push GitHub)
- [ ] Tester les 3 modules d'analyse :
  - [ ] Scanner facial (doit retourner des scores PSL)
  - [ ] Analyse vocale (doit retourner pitch, volume, basses, stabilité)
  - [ ] Génération du programme glow-up 30 jours (doit retourner un texte détaillé)

## 🔗 Ressources

- **Vercel Dashboard** : https://vercel.com/dashboard
- **OpenRouter API** : https://openrouter.ai
- **GitHub Repo** : https://github.com/nathafeldman-boop/Mogged.ai

---

*Déploiement effectué par Manus Bot le 19/05/2026*
