# 🚀 Mise en ligne (GitHub Pages + Actions)

Hébergement **gratuit, automatique, robuste**. Tout est déjà configuré dans le
dépôt (`.github/workflows/`).

## Ce qui est automatisé

- **`deploy.yml`** — à chaque `push` sur `main` : installe, **lance les tests**,
  construit, et **met en ligne** sur GitHub Pages. Si un test échoue, **rien
  n'est publié**.
- **`update.yml`** — **chaque lundi 06:00 UTC** : récupère la dernière version du
  moteur officiel `@socialgouv/modeles-social`, relance les tests, et **ne
  redéploie que si tout est vert**. Sinon, le job échoue et GitHub t'alerte par
  e-mail. Aucune intervention de ta part.

## Mise en place (une seule fois — étape qui demande TON action)

> Je ne peux pas me connecter à ton compte GitHub à ta place (sécurité).

1. Sur **github.com** → bouton **New repository**.
   - Nom : `simulateur-licenciement` (ou autre).
   - Visibilité : **Public** (requis pour GitHub Pages gratuit ; le code ne
     contient aucun secret).
   - **NE PAS** cocher « Add a README / .gitignore » (le projet a déjà son
     historique).
   - **Create repository**.
2. Donne-moi l'URL affichée (ex. `https://github.com/<ton-pseudo>/simulateur-licenciement.git`).
3. Je relie le projet et je pousse le code (un **pop-up GitHub** s'ouvrira dans
   ton navigateur pour t'authentifier — tu valides).
4. Le workflow se lance tout seul : build → tests → mise en ligne. Pages
   s'active automatiquement.
5. **~2 min plus tard**, ton simulateur est en ligne :
   `https://<ton-pseudo>.github.io/simulateur-licenciement/`

## Mettre à jour manuellement (optionnel)

Le lundi suffit, mais à tout moment :
```
npm update @socialgouv/modeles-social && npm test
git add -A && git commit -m "maj" && git push
```
(sur cette machine, préfixer par `NODE_OPTIONS=--use-system-ca`).

## Rappel sécurité

La mise à jour passe **toujours** par les tests de non-régression avant
publication. Un changement de barème officiel qui casserait un calcul **ne sera
jamais mis en ligne** sans qu'on le voie.
