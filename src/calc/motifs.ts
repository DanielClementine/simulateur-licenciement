/**
 * Motifs d'absence pris en compte pour le calcul LÉGAL de l'ancienneté.
 *
 * Liste et pondérations recopiées de la source officielle :
 * @socialgouv/modeles-social → lib/modeles/base/seniority.js (LEGAL_MOTIFS).
 * `value` = part de l'absence DÉDUITE de l'ancienneté (1 = totalement,
 * 0.5 = pour moitié).
 */
export interface MotifAbsence {
  key: string;
  label: string;
  value: number;
}

export const MOTIFS_ABSENCE_LEGAL: MotifAbsence[] = [
  { key: "absenceMaladieNonPro", label: "Absence pour maladie non professionnelle", value: 1 },
  { key: "absenceAccidentTrajet", label: "Arrêt maladie lié à un accident de trajet", value: 1 },
  { key: "absenceCongesSabbatique", label: "Congé sabbatique", value: 1 },
  { key: "absenceCongesCreationEntreprise", label: "Congé pour création d'entreprise", value: 1 },
  { key: "absenceCongesParentalEducation", label: "Congé parental d'éducation à temps plein", value: 0.5 },
  { key: "absenceCongesSansSolde", label: "Congés sans solde", value: 1 },
  { key: "absenceGreve", label: "Grève", value: 1 },
  { key: "absenceMiseAPied", label: "Mise à pied", value: 1 },
];
