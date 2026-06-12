/**
 * Couche OVERLAY — TES personnalisations.
 *
 * Cette couche se pose PAR-DESSUS le résultat officiel sans jamais modifier
 * le moteur des Services Publics. Une mise à jour gouvernementale ne touche
 * jamais ce fichier : c'est ici qu'on affine les calculs, ajoute des règles
 * conventionnelles maison, applique un plancher/plafond, etc.
 *
 * Par défaut : pass-through (aucune modification). On branchera les vraies
 * customisations à l'étape suivante du projet.
 */
import type { SimulationInput, SimulationResult } from "./engine";

export interface OverlayRule {
  id: string;
  label: string;
  /** Renvoie un résultat modifié, ou le résultat inchangé. */
  apply: (input: SimulationInput, result: SimulationResult) => SimulationResult;
}

/**
 * Registre des règles maison. Vide pour l'instant — exemple commenté ci-dessous.
 *
 * Exemple : garantir une indemnité minimale de 1 000 €.
 *   {
 *     id: "plancher-maison",
 *     label: "Plancher conventionnel interne 1 000 €",
 *     apply: (_input, r) =>
 *       r.status === "result" && (r.montant ?? 0) < 1000
 *         ? { ...r, montant: 1000, chosenResult: "OVERLAY" }
 *         : r,
 *   }
 */
export const overlayRules: OverlayRule[] = [];

export function applyOverlay(
  input: SimulationInput,
  result: SimulationResult
): SimulationResult {
  return overlayRules.reduce((acc, rule) => rule.apply(input, acc), result);
}
