# 📒 CARNET DE BORD — Simulateur d'indemnité de licenciement

> Document vivant. À lire par tout humain OU LLM reprenant le projet.
> On y consigne : ce qu'on fait, pourquoi, comment, ce qui reste, les
> précautions et les limites. **Mise à jour à chaque étape importante.**
>
> Dernière mise à jour : **2026-06-12** (légal + conventions collectives)

---

## 1. Objectif

Reproduire **à 100 %** le simulateur officiel
[code.travail.gouv.fr/outils/indemnite-licenciement](https://code.travail.gouv.fr/outils/indemnite-licenciement),
puis le **customiser** (design + règles maison). Calcul de l'indemnité légale de
licenciement d'un **CDI à temps plein**.

## 2. Mode de fonctionnement avec l'utilisateur

- L'utilisateur **n'est pas développeur** → « c'est toi le spécialiste ». Il faut
  décider à sa place sur la technique, recommander, et expliquer simplement.
- Exigence forte et permanente : **design moderne, UX/UI exceptionnelle,
  couleurs attractives**.
- Il valide les grandes orientations ; on avance ensuite de façon autonome.
- Langue de travail : **français**.

## 3. Décisions d'architecture (et pourquoi)

| Décision | Pourquoi |
|----------|----------|
| **Moteur officiel réutilisé** (`@socialgouv/modeles-social`) plutôt que recodé | Garantit des résultats identiques au site + mises à jour gouvernementales via npm. |
| **2 couches séparées** : moteur officiel (jamais modifié) + `overlay.ts` (perso) | Une MAJ officielle n'écrase jamais les customisations. |
| `publicodes` **épinglé à `1.0.0-beta.60`** | Version exacte sur laquelle modeles-social est construit. Passer en 1.x casserait l'API. |
| Stack **Vite + React + TypeScript** | Build → site statique hébergeable partout ; robuste et évolutif. |
| **Design custom** (PAS le thème « République Française ») | L'utilisateur veut plus beau/moderne que le site officiel. |
| Mise à jour gouvernementale = **`npm update` + revalidation** (pas de CDN temps réel) | Garder la main avant qu'un changement de barème ne modifie les résultats. |

## 4. Comment ça marche (technique)

- `src/calc/engine.ts` → appelle la classe officielle `IndemniteLicenciementPublicodes`.
  - Entrées Publicodes = clés type `contrat salarié . indemnité de licenciement . …`
  - **Dates au format `JJ/MM/AAAA`** (sinon erreur de parsing publicodes).
  - Le moteur calcule l'ancienneté (depuis les dates) et le salaire de référence
    (depuis le salaire ou les périodes) via ses sous-modules officiels.
- `src/calc/overlay.ts` → point d'extension pour règles maison (vide par défaut).
- `src/calc/dates.ts` → conversion dates, mois français, formatage €.
- `src/App.tsx` → wizard 7 étapes (Intro → CC → Infos → Ancienneté → Absences →
  Salaires → Indemnité).

### Formules légales (Code du travail)
- Indemnité = `¼ × Sref × A` pour les 10 premières années,
  `+ ⅓ × Sref × A` au-delà de 10 ans.
- **Inaptitude pro** (accident/maladie pro) → résultat **× 2**.
- `Sref` = max( moyenne des 12 derniers mois ; moyenne des 3 derniers mois +
  primes proratisées ).
- Éligibilité : **8 mois d'ancienneté minimum**.

## 5. Contraintes / précautions

- ⚠️ **Environnement Windows** : `npm` casse (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`)
  à cause de l'antivirus qui inspecte le HTTPS. Fix durable appliqué :
  `setx NODE_OPTIONS "--use-system-ca"`. Pour la session courante, préfixer les
  commandes par `NODE_OPTIONS=--use-system-ca`. **Ne pas** désactiver l'antivirus,
  **ne pas** faire `strict-ssl false`.
- ⚠️ Le projet est dans un dossier **Dropbox** → `node_modules` se synchronise
  (lent). Envisager d'exclure `node_modules` de la synchro.
- ⚠️ Bundle volumineux (~3 Mo) car il embarque toutes les conventions
  collectives → prévoir du **code-splitting** avant la mise en production.
- ⚠️ Ne jamais éditer la couche officielle ; toujours passer par `overlay.ts`.

## 6. État d'avancement

### ✅ Fait — calcul LÉGAL complet
- Moteur officiel branché et **validé** sur 6 scénarios :
  - Base 7,33 ans / 3000 € → **5 500 €**
  - Absence 6 mois (maladie) → **5 125 €** (ancienneté réduite, validé UI)
  - Inaptitude pro → **11 000 €** (×2)
  - 15 ans → **12 500 €** (¼ jusqu'à 10 ans + ⅓ au-delà)
  - Salaire variable + prime → **5 683,33 €**
  - Ancienneté < 8 mois → **inéligible** (écran dédié)
- Wizard 7 étapes, design moderne (fond animé, carte glass, compteur animé).
- Ancienneté calculée en direct, **déduction des absences en direct**.
- Salaire constant OU variable (12 mois + **primes** par mois).
- Éditeur d'absences (motif officiel + durée) → déduction d'ancienneté.
- Affichage propre du cas **inéligible**.
- Script de régression : `test-legal.cjs` (`node test-legal.cjs`).

### ✅ Fait — conventions collectives
- **47 conventions** supportées (recherche par nom ou n° IDCC).
- Noms officiels (source SocialGouv/kali-data) → `src/calc/conventions.ts`.
- **Questions dynamiques par CC** (catégorie pro, clause de mobilité…) extraites
  du modèle et rendues automatiquement (`getAgreementQuestions`).
- Comparaison **légal vs conventionnel** → retient le plus favorable, comme le
  site officiel. Validé UI : SYNTEC ingénieur 15 ans → 15 166,67 € (CC retenue,
  vs 12 666,67 € légal).
- Détail du résultat : montant légal, montant CC, et montant retenu.

⚠️ 3 pièges résolus (à retenir si on reprend le code) :
  1. `convention collective` doit valoir `'IDCCxxxx'` (préfixe + zéro-padding),
     pas `'1486'` → utiliser l'enum `SupportedCc` (mappe IDCCxxxx → idcc).
  2. Les oui/non conventionnels prennent `'Oui'`/`'Non'` (majuscule, quotés).
  3. Fournir `salaire de référence conventionnel` (sinon CC = 0).

### ⏳ Reste à faire
- Code-splitting / optimisation du bundle (~3 Mo).
- Mise en ligne (build statique).
- Customisation finale du design (marque de l'utilisateur).

## 7. Limites connues
- Seules les **47 CC les plus courantes** sont prises en charge (même périmètre
  que le moteur officiel) ; sinon → calcul Code du travail.
- `arrêt de travail` : collecté mais sans impact numérique (conforme au moteur ;
  ne change que la période de salaire à renseigner).
- Bundle volumineux (toutes les CC embarquées) → code-splitting à faire.

---

## 8. Journal des sessions

### 2026-06-12 — Mise en place + prototype validé
- Test du simulateur officiel (parcours 7 étapes capturé).
- Choix d'architecture (moteur officiel + overlay) validés avec l'utilisateur.
- Scaffold Vite/React/TS, intégration `@socialgouv/modeles-social`.
- Fix npm/SSL (`--use-system-ca`).
- UI moderne complète + validation bout-en-bout (5 500 €).
- Décision : aller au bout des fonctionnalités du **calcul légal** avant la
  customisation et les conventions collectives.

### 2026-06-12 (suite) — Calcul légal complété
- Ajout : éditeur d'**absences prolongées** (motifs officiels + durée) avec
  déduction d'ancienneté en direct (validé UI : 6 mois → 5 125 €).
- Ajout : **primes** par mois dans le salaire variable.
- Ajout : écran **inéligible** (< 8 mois) propre.
- Inaptitude (×2) et > 10 ans (⅓) : déjà gérés par le moteur, vérifiés.
- Script `test-legal.cjs` : 6 scénarios légaux validés.
- Le **calcul légal est maintenant complet**. Prochaine étape au choix de
  l'utilisateur : conventions collectives / design / mise en ligne.

### 2026-06-12 (suite 2) — Conventions collectives activées
- 47 CC supportées : recherche (nom/IDCC), noms officiels via kali-data.
- Questions dynamiques par CC + comparaison légal/conventionnel (plus favorable).
- 3 pièges du moteur d'agrément résolus (voir §6).
- Validé UI : SYNTEC ingénieur → 15 166,67 € (CC retenue).
- **Reproduction du simulateur officiel : COMPLÈTE** (légal + CC). Reste :
  optimisation bundle, mise en ligne, customisation design.
