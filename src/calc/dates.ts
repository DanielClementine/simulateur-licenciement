/** Helpers de dates — formats attendus par le moteur officiel Publicodes. */

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** "2018-01-01" (input HTML date) -> "01/01/2018" (format Publicodes JJ/MM/AAAA). */
export function toFrDate(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

/** Affichage humain de l'ancienneté décimale : 7.33 -> "7 ans et 4 mois". */
export function formatSeniority(years?: number): string | null {
  if (years == null || isNaN(years)) return null;
  const totalMonths = Math.round(years * 12);
  const a = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const ansLabel = a > 1 ? "ans" : "an";
  if (a === 0) return `${m} mois`;
  if (m === 0) return `${a} ${ansLabel}`;
  return `${a} ${ansLabel} et ${m} mois`;
}

/**
 * Génère les 12 libellés de mois (format "mars 2025") précédant la date de
 * notification (incluse), du plus récent au plus ancien — pour la saisie
 * du salaire variable mois par mois.
 */
export function twelveMonthsBefore(isoNotificationDate: string): string[] {
  if (!isoNotificationDate) return [];
  const [y, m] = isoNotificationDate.split("-").map(Number);
  if (!y || !m) return [];
  const labels: string[] = [];
  // Le mois de la notification puis les 11 précédents.
  let year = y;
  let monthIdx = m - 1; // 0-based
  for (let i = 0; i < 12; i++) {
    labels.push(`${MOIS_FR[monthIdx]} ${year}`);
    monthIdx--;
    if (monthIdx < 0) {
      monthIdx = 11;
      year--;
    }
  }
  return labels;
}

/** Formate un montant en euros à la française : 5500 -> "5 500,00 €". */
export function formatEuros(value?: number): string {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
