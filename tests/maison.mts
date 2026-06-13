/**
 * Tests de non-régression de l'INTERPRÉTEUR des conventions maison (overlay).
 * Lancé via `npm test` (Node 22 + --experimental-strip-types).
 */
import {
  computeConventionMaison,
  CONVENTIONS_MAISON,
  parseTaux,
} from "../src/calc/conventions-maison.ts";

let pass = 0;
let fail = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  console.log(`${ok ? "✅" : "❌"} ${label}: ${actual}${ok ? "" : ` (attendu ${expected})`}`);
  ok ? pass++ : fail++;
}

check("parseTaux 1/4", parseTaux("1/4"), 0.25);
check("parseTaux 3/10", parseTaux("3/10"), 0.3);

const cc = CONVENTIONS_MAISON[0];
const s = { sref: 3000 };
check(
  "Cadre 52 ans / 15 ans (paliers + majo âge)",
  computeConventionMaison(cc, { ...s, ancienneteAnnees: 15, categorie: "Cadre", age: 52 }).montant,
  18000
);
check(
  "Cadre 40 ans / 15 ans (sans majo âge)",
  computeConventionMaison(cc, { ...s, ancienneteAnnees: 15, categorie: "Cadre", age: 40 }).montant,
  15000
);
check(
  "Non-cadre / 15 ans (¼ + ⅓)",
  computeConventionMaison(cc, { ...s, ancienneteAnnees: 15, categorie: "Non-cadre", age: 40 }).montant,
  12500
);
check(
  "Cadre / 6 mois (< 8 mois) → inéligible",
  computeConventionMaison(cc, { ...s, ancienneteAnnees: 0.5, categorie: "Cadre", age: 40 }).eligible,
  false
);

console.log(`\n${fail === 0 ? "🎉 MAISON OK" : "⚠️ RÉGRESSION MAISON"} — ${pass} ok, ${fail} ko`);
process.exit(fail === 0 ? 0 : 1);
