# Simulateur d'indemnité de licenciement

Reproduction du simulateur officiel
[code.travail.gouv.fr/outils/indemnite-licenciement](https://code.travail.gouv.fr/outils/indemnite-licenciement),
avec un design moderne personnalisable.

## Principe : 2 couches séparées

```
┌─────────────────────────────────────────────┐
│  COUCHE OFFICIELLE (jamais modifiée)         │
│  @socialgouv/modeles-social  ← gouvernement  │
│  Règles Publicodes : Code du travail + CC    │
├─────────────────────────────────────────────┤
│  TA COUCHE OVERLAY (src/calc/overlay.ts)     │
│  Affinages, règles maison, planchers…        │
└─────────────────────────────────────────────┘
```

- On **n'a pas réimplémenté la loi** : `src/calc/engine.ts` appelle exactement
  la même classe (`IndemniteLicenciementPublicodes`) que le site officiel. Les
  résultats sont donc identiques (validé : 7 ans 4 mois + 3000 € → **5 500 €**).
- Les **mises à jour gouvernementales** se font via npm (voir ci-dessous).
- Les **personnalisations** vivent dans `src/calc/overlay.ts`, jamais dans le
  moteur — une mise à jour officielle ne les écrase jamais.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build statique dans dist/ (hébergeable partout)
```

## Mettre à jour les règles officielles

```bash
npm update @socialgouv/modeles-social
npm run build
```

> ⚠️ `publicodes` est épinglé à `1.0.0-beta.60` car c'est la version sur
> laquelle `@socialgouv/modeles-social` est construit. Ne pas le passer en 1.x
> sans vérifier la compatibilité.

## Structure

| Fichier | Rôle |
|---------|------|
| `src/calc/engine.ts` | Wrapper du moteur officiel (couche auto-actualisable) |
| `src/calc/overlay.ts` | Tes personnalisations (point d'extension) |
| `src/calc/dates.ts` | Helpers de dates / formatage euros |
| `src/App.tsx` | Wizard 7 étapes (UI) |
| `src/App.css` / `src/index.css` | Design system |

## Périmètre actuel (prototype)

- ✅ Calcul **Code du travail** (légal), identique au site officiel
- ✅ 7 étapes, ancienneté en direct, salaire constant ou variable (12 mois)
- ⏳ Conventions collectives (le moteur les contient déjà — à activer)
- ⏳ Saisie détaillée des absences prolongées

## Note environnement (Windows)

Si `npm install` échoue avec `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (antivirus qui
inspecte le HTTPS), définir une fois pour toutes :

```powershell
setx NODE_OPTIONS "--use-system-ca"
```

(Node fait alors confiance au magasin de certificats Windows, sans désactiver
la vérification TLS.)
