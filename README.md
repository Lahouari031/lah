# 🎓 Mon Parcoursup

Une appli web toute simple pour aider les lycéens à organiser leurs vœux Parcoursup.

## Ce qu'on peut faire

- **🏠 Accueil** : compte à rebours jusqu'à la prochaine date importante, progression, liste « À faire maintenant ».
- **📝 Mes vœux** : ajouter ses vœux (formation, établissement, ville, type), les noter de 1 à 5 ⭐ (envie), les marquer 🚀 ambitieux / 🎯 réaliste / 🛟 sécurité, les classer avec ⬆️ ⬇️, prendre des notes, et cocher pour chaque vœu : ajouté sur Parcoursup, lettre de motivation, dossier complet, **vœu confirmé**. Alerte si plus de 10 vœux ou si la liste n'a aucun vœu « sécurité ».
- **📅 Dates** : le calendrier Parcoursup avec des cases à cocher pour chaque étape (ouverture, début des vœux, dernier jour pour ajouter des vœux, dernier jour pour confirmer, réponses, phase complémentaire…). Chaque date peut être corrigée.
- **📊 Mes notes** : prénom, voie, spécialités, centres d'intérêt et moyennes par matière (avec moyenne générale). Export / import pour changer d'appareil.
- **🤖 Coach IA** : un assistant (Claude) qui connaît les vœux, les notes et les dates de l'élève et l'aide à classer, équilibrer sa liste, trouver des idées ou améliorer sa lettre. Sans clé API, l'appli donne des conseils automatiques.

Les données restent dans le navigateur de l'élève (localStorage) : rien n'est stocké sur le serveur.

> ⚠️ Les dates de la session 2027 sont **estimées** d'après la session 2026. Mets-les à jour dans `public/app.js` (tableau `STEPS`) quand le calendrier officiel est publié sur [parcoursup.gouv.fr](https://www.parcoursup.gouv.fr).

## Lancer l'appli

Il faut Node.js 18 ou plus récent.

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start   # avec le coach IA
# ou
npm start                                # sans IA (conseils automatiques)
```

Puis ouvre http://localhost:3000 (sur téléphone : l'adresse IP de l'ordinateur, port 3000).

Variables d'environnement facultatives :

| Variable | Rôle | Par défaut |
|---|---|---|
| `ANTHROPIC_API_KEY` | Active le coach IA | – |
| `CLAUDE_MODEL` | Modèle Claude utilisé | `claude-opus-5-5` |
| `PORT` | Port du serveur | `3000` |
| `RATE_LIMIT` | Questions max par IP toutes les 10 minutes | `20` |

## Appli mobile (Expo)

Le dossier `mobile/` contient une appli Expo qui affiche la même page dans une WebView. Elle est liée au projet Expo `lahouaris-team/app_test_sgimby`.

**Tester sur ton téléphone (Expo Go)**

```bash
npm run build            # à la racine : met à jour mobile/app-html.js
cd mobile
npm install
npx expo start           # scanne le QR code avec l'appli Expo Go
```

**Brancher le coach IA dans l'appli** : lance `server.js` (voir plus haut), puis copie `mobile/.env.example` en `mobile/.env.local` et mets l'adresse du serveur dans `EXPO_PUBLIC_API_URL` (en test : `http://<IP-de-ton-ordinateur>:3000`). Sans adresse, le coach donne des conseils automatiques.

**Relier au projet sur expo.dev et publier**

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init                          # écrit l'identifiant du projet dans app.json
npx eas-cli@latest update --branch main          # publie une mise à jour visible dans Expo Go / l'appli
npx eas-cli@latest build --profile preview -p android   # fabrique un .apk à installer
```

> Après chaque changement dans `public/`, relance `npm run build` à la racine pour mettre à jour l'appli mobile.

## Organisation du code

```
server.js         serveur Node : fichiers statiques + /api/chat (relais vers l'API Claude, en streaming)
public/index.html structure de la page
public/style.css  styles (mobile d'abord, mode sombre automatique)
public/app.js     toute la logique de l'appli (vœux, calendrier, notes, coach)
scripts/build.mjs rassemble public/ en un seul fichier (pour l'appli mobile et un aperçu en ligne)
mobile/           appli Expo (React Native) qui affiche la page dans une WebView
```
