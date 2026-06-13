/**
 * COUCHE « CONVENTIONS MAISON » (overlay, additive).
 *
 * Permet d'ajouter des conventions collectives NON couvertes par le paquet
 * officiel, via un template déclaratif simple. N'altère JAMAIS le moteur
 * officiel ni les 47 CC : c'est une couche indépendante. Le simulateur compare
 * ensuite légal vs convention maison et retient le plus favorable.
 *
 * Schémas couverts (d'après l'audit des 47 CC) : taux par paliers d'ancienneté,
 * branches par catégorie, majoration selon l'âge, plafond.
 */

export interface PalierAnciennete {
  /** Palier « jusqu'à N ans d'ancienneté » (borne haute). */
  jusqua?: number;
  /** Palier « au-delà de N ans d'ancienneté ». */
  audela?: number;
  /** Taux en mois de salaire par année : "1/4", "1/3", "0.2", "3/10"… */
  taux: string;
}

export interface MajorationAge {
  /** Âge minimum (à la notification/fin de préavis selon la CC). */
  ageMin: number;
  /** Bonus ajouté, en mois de salaire de référence. */
  bonusMois: number;
}

export interface BrancheCC {
  /** Conditions d'application de la branche (optionnel). */
  si?: { categorie?: string; ancienneteMinAnnees?: number };
  /** Paliers d'ancienneté (calcul cumulatif, comme le légal). */
  paliers: PalierAnciennete[];
  /** Majorations selon l'âge (la plus avantageuse applicable est retenue). */
  majorationAge?: MajorationAge[];
  /** Plafond en mois de salaire de référence. */
  plafondMois?: number;
}

export interface QuestionMaison {
  key: string;
  label: string;
  type: "liste" | "oui-non" | "entier" | "montant";
  /** Pour les listes : valeurs possibles (la valeur = le libellé). */
  options?: string[];
}

export interface ConventionMaison {
  /** Identifiant interne (préfixe "M-" pour distinguer des IDCC officiels). */
  id: string;
  /** IDCC réel si connu (affichage). */
  idcc?: string;
  nom: string;
  source?: string;
  /** Ancienneté minimale conventionnelle (mois) pour ouvrir le droit. */
  ancienneteMinMois?: number;
  /** Questions propres à la CC (catégorie, âge…). `categorie` et `age` sont
   *  des clés réservées exploitées par le calcul. */
  questions?: QuestionMaison[];
  branches: BrancheCC[];
}

/** "1/4" -> 0.25 ; "0.2" -> 0.2 ; "3/10" -> 0.3 */
export function parseTaux(t: string): number {
  const s = String(t).trim();
  if (s.includes("/")) {
    const [a, b] = s.split("/").map((x) => Number(x.trim()));
    return b ? a / b : 0;
  }
  return Number(s) || 0;
}

export interface SituationMaison {
  ancienneteAnnees: number;
  sref: number;
  categorie?: string;
  age?: number;
}

export interface ResultatMaison {
  eligible: boolean;
  montant: number;
  /** Formule lisible pour le détail. */
  formule: string;
  explications: string[];
}

/** Sélectionne la branche applicable (par catégorie + ancienneté minimale). */
function choisirBranche(
  cc: ConventionMaison,
  s: SituationMaison
): BrancheCC | undefined {
  return cc.branches.find((b) => {
    if (b.si?.categorie && b.si.categorie !== s.categorie) return false;
    if (
      b.si?.ancienneteMinAnnees != null &&
      s.ancienneteAnnees < b.si.ancienneteMinAnnees
    )
      return false;
    return true;
  });
}

/** Montant cumulatif des paliers : Σ taux × Sref × (années dans le palier). */
function montantPaliers(paliers: PalierAnciennete[], s: SituationMaison): {
  montant: number;
  parts: string[];
} {
  const A = s.ancienneteAnnees;
  let montant = 0;
  const parts: string[] = [];
  for (const p of paliers) {
    const taux = parseTaux(p.taux);
    let annees = 0;
    if (p.jusqua != null) annees = Math.min(A, p.jusqua);
    else if (p.audela != null) annees = Math.max(0, A - p.audela);
    else annees = A; // taux unique
    if (annees <= 0) continue;
    const m = taux * s.sref * annees;
    montant += m;
    parts.push(
      `${p.taux} × Sref × ${annees.toFixed(2)} an${annees >= 2 ? "s" : ""}`
    );
  }
  return { montant, parts };
}

/**
 * Calcule l'indemnité d'une convention maison. Renvoie `eligible:false` si
 * l'ancienneté minimale n'est pas atteinte ou si aucune branche ne s'applique.
 */
export function computeConventionMaison(
  cc: ConventionMaison,
  s: SituationMaison
): ResultatMaison {
  const none: ResultatMaison = {
    eligible: false,
    montant: 0,
    formule: "",
    explications: [],
  };
  if (
    cc.ancienneteMinMois != null &&
    s.ancienneteAnnees * 12 < cc.ancienneteMinMois - 1e-9
  )
    return none;

  const branche = choisirBranche(cc, s);
  if (!branche) return none;

  const { montant: base, parts } = montantPaliers(branche.paliers, s);
  const explications = [...parts];
  let montant = base;

  // Majoration d'âge : on retient la plus avantageuse applicable.
  if (branche.majorationAge && s.age != null) {
    const applicables = branche.majorationAge
      .filter((m) => s.age! >= m.ageMin)
      .sort((a, b) => b.bonusMois - a.bonusMois);
    if (applicables.length) {
      const bonus = applicables[0].bonusMois * s.sref;
      montant += bonus;
      explications.push(
        `+ ${applicables[0].bonusMois} mois (âge ≥ ${applicables[0].ageMin} ans)`
      );
    }
  }

  // Plafond.
  if (branche.plafondMois != null) {
    const plafond = branche.plafondMois * s.sref;
    if (montant > plafond) {
      montant = plafond;
      explications.push(`Plafonné à ${branche.plafondMois} mois de salaire`);
    }
  }

  return {
    eligible: true,
    montant: Math.round(montant * 100) / 100,
    formule: branche.paliers.map((p) => `${p.taux}·Sref·A`).join(" + "),
    explications,
  };
}

/**
 * Convention maison D'EXEMPLE (démo) — exerce tous les schémas : branches par
 * catégorie, paliers, majoration d'âge, plafond. À remplacer/compléter via le
 * futur formulaire d'import.
 */
export const CONVENTIONS_MAISON: ConventionMaison[] = [
  {
    id: "M-DEMO",
    nom: "Convention maison (démo)",
    source: "Exemple de template",
    ancienneteMinMois: 8,
    questions: [
      {
        key: "categorie",
        label: "Quelle est la catégorie professionnelle du salarié ?",
        type: "liste",
        options: ["Cadre", "Non-cadre"],
      },
      {
        key: "age",
        label: "Quel est l'âge du salarié à la notification ?",
        type: "entier",
      },
    ],
    branches: [
      {
        si: { categorie: "Cadre" },
        paliers: [
          { jusqua: 10, taux: "1/4" },
          { audela: 10, taux: "1/2" },
        ],
        majorationAge: [{ ageMin: 50, bonusMois: 1 }],
        plafondMois: 18,
      },
      {
        si: { categorie: "Non-cadre" },
        paliers: [
          { jusqua: 10, taux: "1/4" },
          { audela: 10, taux: "1/3" },
        ],
        plafondMois: 12,
      },
    ],
  },
];

export function getConventionMaison(id?: string): ConventionMaison | undefined {
  if (!id) return undefined;
  return CONVENTIONS_MAISON.find((c) => c.id === id);
}
