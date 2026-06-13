/**
 * Couche CALCUL — wrapper autour du moteur OFFICIEL des Services Publics.
 *
 * Source de vérité : @socialgouv/modeles-social (règles Publicodes du
 * Code du travail numérique). On ne réimplémente PAS la loi : on appelle
 * exactement la même classe que code.travail.gouv.fr, ce qui garantit des
 * résultats identiques et la mise à jour automatique via npm.
 *
 * La personnalisation se fait dans ./overlay.ts (jamais ici).
 */
import * as ModelesSocial from "@socialgouv/modeles-social";
import { applyOverlay } from "./overlay";
import { formatSeniority } from "./dates";

// Le paquet est en CommonJS : on récupère les exports de façon robuste.
const IndemniteLicenciementPublicodes = (ModelesSocial as any)
  .IndemniteLicenciementPublicodes;
const indemniteLicenciementModeles = (ModelesSocial as any)
  .indemniteLicenciementModeles;

// SupportedCc mappe la clé interne (ex. "IDCC1486") -> idcc ("1486").
// Les règles CC sont gated par `convention collective = 'IDCCxxxx'` : il faut
// donc retrouver la clé exacte (certaines sont zéro-paddées : "IDCC0292").
const SupportedCc = ((ModelesSocial as any).SupportedCc ?? {}) as Record<
  string,
  string
>;
const IDCC_TO_KEY: Record<string, string> = {};
Object.entries(SupportedCc).forEach(([key, idcc]) => {
  IDCC_TO_KEY[idcc] = key;
});

/** Valeur Publicodes attendue pour `convention collective` (ex. "'IDCC1486'"). */
function conventionValue(idcc?: string): string {
  if (!idcc) return "''";
  const key = IDCC_TO_KEY[idcc] ?? `IDCC${idcc}`;
  return `'${key}'`;
}

const PK = "contrat salarié . indemnité de licenciement";

/** Types d'entrée d'une question conventionnelle dynamique. */
export type CcQuestionType =
  | "oui-non"
  | "liste"
  | "montant"
  | "entier"
  | "question"
  | "date";

export interface CcQuestion {
  /** Nom de règle Publicodes (= clé d'argument). */
  name: string;
  type: CcQuestionType;
  question: string;
  description?: string;
  /** Suffixe d'unité à afficher dans le champ ("ans", "mois", "€" ou ""). */
  suffix?: string;
  /** Pour les listes : libellé affiché -> valeur Publicodes (déjà quotée). */
  options?: { label: string; value: string }[];
}

/**
 * Décode les entités HTML (&nbsp; &rsquo; &eacute; …) et retire les balises.
 * Les libellés du modèle officiel en contiennent. Sûr côté navigateur (textarea)
 * avec repli minimal côté Node.
 */
function decodeHtml(input?: string): string {
  if (!input) return "";
  let s = input;
  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = s;
    s = el.value;
  } else {
    s = s
      .replace(/&nbsp;/g, " ")
      .replace(/&rsquo;|&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&[a-z]+;/gi, "");
  }
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** Suffixe d'unité d'après le type et le libellé de la question. */
function suffixFor(type: CcQuestionType, label: string): string {
  if (type === "montant") return "€";
  if (/[âa]ge/i.test(label)) return "ans";
  if (/mois/i.test(label)) return "mois";
  if (/ann[ée]e/i.test(label)) return "ans";
  return "";
}

/**
 * Questions spécifiques à une convention collective (catégorie pro, âge, etc.),
 * extraites du modèle officiel. À poser après sélection de la CC.
 */
export function getAgreementQuestions(idcc?: string): CcQuestion[] {
  if (!idcc) return [];
  const rules = indemniteLicenciementModeles[idcc];
  if (!rules) return [];
  const out: CcQuestion[] = [];
  Object.entries(rules).forEach(([name, rule]: [string, any]) => {
    if (rule && typeof rule === "object" && rule.cdtn && rule.cdtn.type) {
      const type = rule.cdtn.type as CcQuestionType;
      const label = decodeHtml(rule.question ?? rule.titre ?? name);
      const q: CcQuestion = {
        name,
        type,
        question: label,
        description: decodeHtml(rule.description) || undefined,
        suffix: suffixFor(type, label),
      };
      if (type === "liste" && rule.cdtn.valeurs) {
        q.options = Object.entries(rule.cdtn.valeurs).map(
          ([lbl, value]) => ({ label: decodeHtml(lbl), value: value as string })
        );
      }
      out.push(q);
    }
  });
  return out;
}

export interface SalaryPeriod {
  /** Libellé mois français + année, ex. "mars 2025" */
  month: string;
  value: number;
  prime?: number;
}

export interface AbsencePeriod {
  /** Clé du motif (voir motifs.ts) */
  motifKey: string;
  durationInMonth: number;
}

export interface SimulationInput {
  /** IDCC de la convention collective, ou undefined => Code du travail (base) */
  idcc?: string;
  dateEntree: string; // JJ/MM/AAAA
  dateNotification: string; // JJ/MM/AAAA
  dateSortie: string; // JJ/MM/AAAA
  inaptitudePro: boolean;
  arretTravail: boolean;
  absencePeriods?: AbsencePeriod[]; // absences prolongées (déduites de l'ancienneté)
  salaireConstant: boolean;
  salaireMensuel?: number; // si salaire constant
  salaryPeriods?: SalaryPeriod[]; // si salaire variable (12 mois)
  /** Réponses aux questions spécifiques à la CC (clé = nom de règle). */
  ccAnswers?: Record<string, string>;
}

/** Sérialise les absences au format attendu par le moteur officiel. */
function serializeAbsences(periods?: AbsencePeriod[]): string | undefined {
  const valid = (periods ?? []).filter(
    (p) => p.motifKey && p.durationInMonth > 0
  );
  if (valid.length === 0) return undefined;
  return JSON.stringify(
    valid.map((p) => ({
      durationInMonth: p.durationInMonth,
      motif: { key: p.motifKey },
    }))
  );
}

export interface FormuleExplanation {
  [label: string]: string | number;
}

export interface SimulationResult {
  status: "result" | "missing" | "ineligible" | "error";
  montant?: number;
  unit?: string;
  /** "LEGAL" | "AGREEMENT" | "SAME" | "HAS_NO_LEGAL" */
  chosenResult?: string;
  legalMontant?: number;
  agreementMontant?: number;
  formule?: any;
  /** Formule LÉGALE (Code du travail), pour le détail comparatif. */
  legalFormule?: any;
  references?: any[];
  notifications?: any[];
  missing?: string[];
  ineligibility?: string;
  message?: string;
  /**
   * true si l'éligibilité a été corrigée : le moteur officiel déclarait
   * inéligible car il déduit les absences de l'ancienneté requise, alors que
   * le seuil de 8 mois s'apprécie sur l'ancienneté NON réduite (continuité du
   * contrat). Cf. Cass. soc. 28 sept. 2022 n°20-18.218 (les absences ne jouent
   * que sur le MONTANT). Le montant est minoré au prorata de l'ancienneté réelle.
   */
  eligibilityCorrected?: boolean;
}

const MIN_SENIORITY_YEARS = 8 / 12; // 8 mois

let instance: any | null = null;
let instanceIdcc: string | undefined;

function getInstance(idcc?: string) {
  // On recrée l'instance uniquement si la convention change.
  if (!instance || instanceIdcc !== idcc) {
    instance = new IndemniteLicenciementPublicodes(
      indemniteLicenciementModeles,
      idcc && idcc !== "" ? idcc : undefined
    );
    instanceIdcc = idcc;
  }
  return instance;
}

/** Construit les arguments Publicodes (clés = noms de règles officiels). */
function buildArgs(input: SimulationInput): Record<string, string> {
  const args: Record<string, string> = {
    "contrat salarié . convention collective": conventionValue(input.idcc),
    [`${PK} . date d'entrée`]: input.dateEntree,
    [`${PK} . date de notification`]: input.dateNotification,
    [`${PK} . date de sortie`]: input.dateSortie,
    [`${PK} . inaptitude suite à un accident ou maladie professionnelle`]:
      input.inaptitudePro ? "oui" : "non",
    [`${PK} . arrêt de travail`]: input.arretTravail ? "oui" : "non",
  };

  const absences = serializeAbsences(input.absencePeriods);
  if (absences) {
    args["absencePeriods"] = absences;
  }

  if (input.salaireConstant && input.salaireMensuel != null) {
    // Salaire constant : la moyenne 12 mois = moyenne 3 mois = salaire mensuel.
    const s = String(input.salaireMensuel);
    args[`${PK} . salaire de référence`] = s;
    // Le calcul conventionnel utilise un Sref dédié (identique ici).
    args[`${PK} . salaire de référence conventionnel`] = s;
  } else if (input.salaryPeriods && input.salaryPeriods.length > 0) {
    // Salaire variable : on laisse le module officiel calculer les Sref.
    args["salaryPeriods"] = JSON.stringify(input.salaryPeriods);
  }

  // Réponses aux questions spécifiques à la convention collective.
  if (input.ccAnswers) {
    Object.entries(input.ccAnswers).forEach(([k, v]) => {
      if (v !== "" && v != null) args[k] = v;
    });
  }

  return args;
}

/**
 * CORRECTION D'ÉLIGIBILITÉ (couche maison).
 *
 * Le moteur officiel déduit les absences de l'ancienneté REQUISE (seuil 8 mois),
 * ce qui peut déclarer inéligible à tort un salarié pourtant présent ≥ 8 mois.
 * Or le seuil s'apprécie sur la continuité du contrat : les absences ne réduisent
 * que le MONTANT, pas le droit à l'indemnité (Cass. soc. 28 sept. 2022 n°20-18.218
 * pour le montant ; continuité du lien contractuel pour l'éligibilité).
 *
 * Si l'ancienneté NON réduite atteint 8 mois, on rétablit l'éligibilité et on
 * calcule le montant minoré au prorata de l'ancienneté réelle (formule légale
 * linéaire en-dessous de 10 ans, donc exacte pour ces faibles anciennetés).
 */
function correctSeniorityEligibility(
  input: SimulationInput,
  out: any
): SimulationResult {
  const ineligibility: string | undefined = out.ineligibility;

  // Détection ROBUSTE, indépendante du libellé du moteur (pour ne pas casser lors
  // d'une mise à jour officielle) : on ne corrige QUE le cas précis où la seule
  // cause d'inéligibilité est la déduction des absences sur l'ancienneté requise,
  // c.-à-d. éligible SANS les absences mais inéligible AVEC. Tout autre motif
  // (ancienneté réellement insuffisante, ou futur motif du moteur) est respecté.
  const eps = 1e-9;
  const grossRequired = estimateSeniorityYears(
    input.dateEntree,
    input.dateNotification
  );
  const reducedRequired = estimateSeniorityYears(
    input.dateEntree,
    input.dateNotification,
    input.absencePeriods
  );
  const absenceDrivenSeniority =
    grossRequired !== undefined &&
    reducedRequired !== undefined &&
    grossRequired >= MIN_SENIORITY_YEARS - eps &&
    reducedRequired < MIN_SENIORITY_YEARS - eps;
  if (!absenceDrivenSeniority) {
    return { status: "ineligible", ineligibility };
  }

  // Éligible : on recalcule via le moteur SANS absences (pour lever le blocage),
  // puis on minore le montant au prorata de l'ancienneté réellement retenue.
  const grossOut = getInstance(input.idcc).calculate(
    buildArgs({ ...input, absencePeriods: undefined })
  );
  if (grossOut.type !== "result") {
    // Cas non calculable proprement : on reste prudent (inéligible affiché).
    return { status: "ineligible", ineligibility };
  }

  const reducedMontantSen =
    estimateSeniorityYears(
      input.dateEntree,
      input.dateSortie,
      input.absencePeriods
    ) ?? 0;
  const grossMontantSen =
    estimateSeniorityYears(input.dateEntree, input.dateSortie) ??
    reducedMontantSen;
  const factor = grossMontantSen > 0 ? reducedMontantSen / grossMontantSen : 1;
  const scale = (v: any) =>
    typeof v === "number" ? Math.round(v * factor * 100) / 100 : undefined;

  // Détail cohérent : afficher l'ancienneté RÉELLEMENT retenue (réduite), pas
  // l'ancienneté brute du calcul de contournement.
  const formule = grossOut.formula
    ? {
        ...grossOut.formula,
        explanations: (grossOut.formula.explanations ?? []).map((e: string) =>
          /ancienn/i.test(e)
            ? `A : Ancienneté retenue (${formatSeniority(reducedMontantSen)})`
            : e
        ),
      }
    : undefined;

  return {
    status: "result",
    montant: scale(grossOut.result.value),
    unit: grossOut.result.unit?.numerators?.[0] ?? "€",
    chosenResult: grossOut.detail?.chosenResult,
    legalMontant: scale(grossOut.detail?.legalResult?.value),
    agreementMontant: scale(grossOut.detail?.agreementResult?.value),
    formule,
    references: grossOut.references,
    notifications: grossOut.notifications,
    eligibilityCorrected: true,
  };
}

/**
 * Calcule l'indemnité via le moteur officiel, puis applique l'overlay
 * (personnalisations maison) sur le résultat.
 */
export function simulate(input: SimulationInput): SimulationResult {
  let raw: SimulationResult;
  try {
    const pub = getInstance(input.idcc);
    const out = pub.calculate(buildArgs(input));

    if (out.type === "result") {
      const num = (v: any) => (typeof v === "number" ? v : undefined);
      // Pour le détail comparatif, on récupère aussi la formule LÉGALE.
      // Si une CC est retenue, la formule légale n'est pas dans `out.formula` →
      // on relance un calcul légal-only (même moteur, montant = legalResult).
      let legalFormule = out.formula;
      if (input.idcc) {
        const legalOut = getInstance(undefined).calculate(
          buildArgs({ ...input, idcc: undefined, ccAnswers: undefined })
        );
        if (legalOut.type === "result") legalFormule = legalOut.formula;
      }
      raw = {
        status: "result",
        montant: num(out.result.value),
        unit: out.result.unit?.numerators?.[0] ?? "€",
        chosenResult: out.detail?.chosenResult,
        legalMontant: num(out.detail?.legalResult?.value),
        agreementMontant: num(out.detail?.agreementResult?.value),
        formule: out.formula,
        legalFormule,
        references: out.references,
        notifications: out.notifications,
      };
    } else if (out.type === "missing-args") {
      raw = {
        status: "missing",
        missing: out.missingArgs.map((a: any) => a.name),
      };
    } else {
      // Inéligibilité renvoyée par le moteur → tenter la correction d'éligibilité.
      raw = correctSeniorityEligibility(input, out);
    }
  } catch (e) {
    raw = { status: "error", message: (e as Error).message?.split("\n")[0] };
  }

  return applyOverlay(input, raw);
}

/**
 * Ancienneté estimée (en années décimales) calculée par le module officiel,
 * pour l'affichage en direct dans l'étape "Ancienneté".
 */
export function estimateSeniorityYears(
  dateEntree: string,
  dateSortie: string,
  absencePeriods?: AbsencePeriod[]
): number | undefined {
  try {
    const pub = getInstance(undefined);
    const absences = (absencePeriods ?? [])
      .filter((p) => p.motifKey && p.durationInMonth > 0)
      .map((p) => ({
        durationInMonth: p.durationInMonth,
        motif: { key: p.motifKey },
      }));
    const res = pub.estimatedSeniority(dateEntree, dateSortie, absences);
    return typeof res?.value === "number" ? res.value : undefined;
  } catch {
    return undefined;
  }
}
