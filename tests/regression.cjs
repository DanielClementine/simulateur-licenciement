/**
 * Tests de NON-RÉGRESSION — « valeurs en or ».
 *
 * Vérifie que le moteur officiel + nos surcharges produisent toujours les
 * montants validés. À lancer AVANT chaque livraison :
 *     node tests/regression.cjs
 * (préfixer par NODE_OPTIONS=--use-system-ca sur cette machine).
 *
 * Si un chiffre bouge → régression détectée, on investigue avant de livrer.
 */
const mod = require("@socialgouv/modeles-social");
const models = mod.indemniteLicenciementModeles;
const PK = "contrat salarié . indemnité de licenciement";
const rev = {};
Object.entries(mod.SupportedCc).forEach(([k, v]) => (rev[v] = k));

function calcRaw({ idcc, dateEntree, dateNotif, dateSortie, salaire, inapt, absences, cc }) {
  const pub = new mod.IndemniteLicenciementPublicodes(models, idcc);
  const args = {
    "contrat salarié . convention collective": idcc ? `'${rev[idcc]}'` : "''",
    [`${PK} . date d'entrée`]: dateEntree,
    [`${PK} . date de notification`]: dateNotif,
    [`${PK} . date de sortie`]: dateSortie,
    [`${PK} . inaptitude suite à un accident ou maladie professionnelle`]: inapt ? "oui" : "non",
    [`${PK} . arrêt de travail`]: "non",
    [`${PK} . salaire de référence`]: String(salaire),
    [`${PK} . salaire de référence conventionnel`]: String(salaire),
  };
  if (absences) args["absencePeriods"] = JSON.stringify(absences);
  if (cc) Object.assign(args, cc);
  return pub.calculate(args);
}

let pass = 0,
  fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "✅" : "❌"} ${label}: ${actual}${ok ? "" : ` (attendu ${expected})`}`);
  ok ? pass++ : fail++;
}

// --- Cas légaux validés ---
const base = { dateEntree: "01/01/2018", dateNotif: "01/03/2025", dateSortie: "01/05/2025", salaire: 3000 };
check("Base 7,33 ans / 3000", calcRaw(base).result?.value, 5500);
check("Inaptitude (×2)", calcRaw({ ...base, inapt: true }).result?.value, 11000);
check(
  "15 ans (¼ + ⅓)",
  calcRaw({ dateEntree: "01/01/2010", dateNotif: "01/01/2025", dateSortie: "01/01/2025", salaire: 3000 }).result?.value,
  12500
);
check(
  "Absence 6 mois maladie",
  calcRaw({ ...base, absences: [{ durationInMonth: 6, motif: { key: "absenceMaladieNonPro" } }] }).result?.value,
  5125
);
check("Ancienneté 4 mois (<8) → inéligible", calcRaw({ dateEntree: "01/01/2025", dateNotif: "01/04/2025", dateSortie: "01/05/2025", salaire: 3000 }).type, "ineligibility");

// --- Convention collective (SYNTEC ingénieur, 15,17 ans) ---
const BET = "contrat salarié . convention collective . bureaux études techniques . indemnité de licenciement";
const syntec = calcRaw({
  idcc: "1486",
  dateEntree: "01/01/2010",
  dateNotif: "01/01/2025",
  dateSortie: "01/03/2025",
  salaire: 3000,
  cc: { [`${BET} . catégorie professionnelle`]: "'Ingénieurs et cadres'", [`${BET} . type de licenciement`]: "'Non'" },
});
check("SYNTEC ingénieur → convention retenue", syntec.detail?.chosenResult, "AGREEMENT");
check("SYNTEC ingénieur → montant CC", syntec.result?.value, 15166.67);

console.log(`\n${fail === 0 ? "🎉 TOUT VERT" : "⚠️ RÉGRESSION"} — ${pass} ok, ${fail} ko`);
process.exit(fail === 0 ? 0 : 1);
