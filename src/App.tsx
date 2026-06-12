import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  simulate,
  estimateSeniorityYears,
  getAgreementQuestions,
  type SimulationInput,
  type SimulationResult,
  type CcQuestion,
} from "./calc/engine";
import {
  toFrDate,
  formatSeniority,
  formatEuros,
  twelveMonthsBefore,
} from "./calc/dates";
import { MOTIFS_ABSENCE_LEGAL } from "./calc/motifs";
import { searchConventions } from "./calc/conventions";

interface AbsenceRow {
  motifKey: string;
  durationInMonth: string;
}

const STEPS = [
  "Introduction",
  "Convention collective",
  "Informations",
  "Ancienneté",
  "Absences",
  "Salaires",
  "Indemnité",
];

type CcChoice = "saisir" | "rechercher" | "passer";

interface FormState {
  ccChoice: CcChoice | null;
  idcc: string | null;
  ccLabel: string | null;
  ccSearch: string;
  ccAnswers: Record<string, string>;
  inaptitudePro: boolean | null;
  dateEntree: string;
  dateNotification: string;
  dateSortie: string;
  arretTravail: boolean | null;
  absencesLongues: boolean | null;
  absences: AbsenceRow[];
  salaireConstant: boolean | null;
  salaireMensuel: string;
  salairesMensuels: string[];
  primesMensuelles: string[];
}

const initialForm: FormState = {
  ccChoice: null,
  idcc: null,
  ccLabel: null,
  ccSearch: "",
  ccAnswers: {},
  inaptitudePro: null,
  dateEntree: "",
  dateNotification: "",
  dateSortie: "",
  arretTravail: null,
  absencesLongues: null,
  absences: [{ motifKey: "", durationInMonth: "" }],
  salaireConstant: null,
  salaireMensuel: "",
  salairesMensuels: Array(12).fill(""),
  primesMensuelles: Array(12).fill(""),
};

/* ---------- petits composants ---------- */

function OptionCard({
  selected,
  onClick,
  emoji,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`opt ${selected ? "sel" : ""}`}
      onClick={onClick}
    >
      <span className="dot" />
      {emoji && <span className="opt-emoji">{emoji}</span>}
      <span>{children}</span>
    </button>
  );
}

function useCountUp(target: number, run: boolean, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, run, duration]);
  return val;
}

/* ---------- App ---------- */

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Ancienneté en direct (déduit les absences si renseignées)
  const seniorityYears = useMemo(() => {
    if (form.dateEntree && form.dateSortie) {
      return estimateSeniorityYears(
        toFrDate(form.dateEntree),
        toFrDate(form.dateSortie),
        form.absences.map((a) => ({
          motifKey: a.motifKey,
          durationInMonth: Number(a.durationInMonth),
        }))
      );
    }
    return undefined;
  }, [form.dateEntree, form.dateSortie, form.absences]);

  const monthLabels = useMemo(
    () => twelveMonthsBefore(form.dateNotification),
    [form.dateNotification]
  );

  // Questions spécifiques à la convention collective sélectionnée.
  const ccQuestions = useMemo<CcQuestion[]>(
    () => getAgreementQuestions(form.idcc ?? undefined),
    [form.idcc]
  );

  const canNext = (() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        if (form.ccChoice === null) return false;
        if (form.ccChoice === "passer") return true;
        // Saisir/rechercher : CC choisie + toutes ses questions répondues.
        if (!form.idcc) return false;
        return ccQuestions.every((q) => !!form.ccAnswers[q.name]);
      case 2:
        return form.inaptitudePro !== null;
      case 3:
        return !!(form.dateEntree && form.dateNotification && form.dateSortie);
      case 4:
        if (form.arretTravail === null || form.absencesLongues === null)
          return false;
        // Si absences prolongées : au moins une ligne valide (motif + durée).
        if (form.absencesLongues) {
          return form.absences.some(
            (a) => a.motifKey && Number(a.durationInMonth) > 0
          );
        }
        return true;
      case 5:
        if (form.salaireConstant === null) return false;
        if (form.salaireConstant) return Number(form.salaireMensuel) > 0;
        return form.salairesMensuels.every((s) => Number(s) > 0);
      default:
        return false;
    }
  })();

  function runSimulation() {
    const useCc = form.ccChoice !== "passer" && !!form.idcc;
    const input: SimulationInput = {
      idcc: useCc ? form.idcc! : undefined,
      ccAnswers: useCc ? form.ccAnswers : undefined,
      dateEntree: toFrDate(form.dateEntree),
      dateNotification: toFrDate(form.dateNotification),
      dateSortie: toFrDate(form.dateSortie),
      inaptitudePro: !!form.inaptitudePro,
      arretTravail: !!form.arretTravail,
      salaireConstant: !!form.salaireConstant,
    };
    if (form.absencesLongues) {
      input.absencePeriods = form.absences.map((a) => ({
        motifKey: a.motifKey,
        durationInMonth: Number(a.durationInMonth),
      }));
    }
    if (form.salaireConstant) {
      input.salaireMensuel = Number(form.salaireMensuel);
    } else {
      input.salaryPeriods = monthLabels.map((month, i) => ({
        month,
        value: Number(form.salairesMensuels[i]),
        prime: Number(form.primesMensuelles[i]) || 0,
      }));
    }
    setResult(simulate(input));
  }

  function goNext() {
    if (step === 5) {
      runSimulation();
      setStep(6);
    } else {
      setStep((s) => Math.min(6, s + 1));
    }
  }
  function goPrev() {
    setStep((s) => Math.max(0, s - 1));
  }
  function restart() {
    setForm(initialForm);
    setResult(null);
    setStep(0);
  }

  return (
    <div className="shell">
      <div className="bg">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <main className="card">
        <header className="head">
          <div className="brandrow">
            <span className="logo" aria-hidden>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm8 0h8v-9h-8v9Zm0-16v5h8V4h-8Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <div className="brandtext">
              <b>Simulateur d'indemnité</b>
              <span>Licenciement · CDI temps plein</span>
            </div>
            <span className="gov-pill">⚖️ Calcul officiel Service Public</span>
          </div>

          <h1 className="title">Calculez votre indemnité de licenciement</h1>

          <div className="progress">
            <div className="progress-top">
              <span className="step-label">{STEPS[step]}</span>
              <span className="step-count">Étape {step + 1} sur 7</span>
            </div>
            <div className="bars">
              {STEPS.map((_, i) => (
                <i
                  key={i}
                  className={i < step ? "done" : i === step ? "active" : ""}
                />
              ))}
            </div>
            {step < 6 && (
              <p className="next-hint">
                Étape suivante : <b>{STEPS[step + 1]}</b>
              </p>
            )}
          </div>
        </header>

        <section className="body">
          <div className="step-anim" key={step}>
            {step === 0 && <StepIntro />}
            {step === 1 && (
              <StepCc form={form} set={set} ccQuestions={ccQuestions} />
            )}
            {step === 2 && (
              <StepInaptitude
                value={form.inaptitudePro}
                onChange={(v) => set("inaptitudePro", v)}
              />
            )}
            {step === 3 && (
              <StepDates form={form} set={set} seniority={seniorityYears} />
            )}
            {step === 4 && (
              <StepAbsences form={form} set={set} seniority={seniorityYears} />
            )}
            {step === 5 && (
              <StepSalaires form={form} set={set} monthLabels={monthLabels} />
            )}
            {step === 6 && result && (
              <StepResult result={result} onRestart={restart} />
            )}
          </div>

          {step < 6 && (
            <div className="nav">
              {step > 0 && (
                <button className="btn ghost" onClick={goPrev}>
                  ← Précédent
                </button>
              )}
              <button
                className={`btn primary ${step === 0 ? "big" : ""}`}
                onClick={goNext}
                disabled={!canNext}
              >
                {step === 0
                  ? "Commencer la simulation →"
                  : step === 5
                  ? "Voir mon indemnité →"
                  : "Suivant →"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ---------- étapes ---------- */

function StepIntro() {
  return (
    <>
      <p className="q">Estimez votre indemnité en 2 minutes</p>
      <p className="intro-lead">
        Ce simulateur estime le montant de l'indemnité de licenciement dans le
        cas d'une rupture d'un <b>CDI à temps plein</b>, sur la base du Code du
        travail.
      </p>
      <div className="intro-need">
        {[
          ["📅", "Vos dates d'entrée et de sortie de l'entreprise"],
          ["✉️", "La date de notification du licenciement"],
          ["💶", "Le montant de vos derniers salaires bruts"],
        ].map(([e, t]) => (
          <div className="need" key={t}>
            <span className="tick">{e}</span>
            {t}
          </div>
        ))}
      </div>
      <div className="callout warn">
        <span className="ic">⚠️</span>
        <span>
          L'indemnité concerne uniquement les salariés en CDI. Ce simulateur ne
          prend pas en compte les contrats ayant alterné temps plein et temps
          partiel.
        </span>
      </div>
    </>
  );
}

function StepCc({
  form,
  set,
  ccQuestions,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  ccQuestions: CcQuestion[];
}) {
  const value = form.ccChoice;
  const results = useMemo(
    () => (form.ccSearch.trim() ? searchConventions(form.ccSearch).slice(0, 8) : []),
    [form.ccSearch]
  );

  const chooseChoice = (v: CcChoice) => {
    set("ccChoice", v);
    if (v === "passer") {
      set("idcc", null);
      set("ccLabel", null);
      set("ccAnswers", {});
    }
  };

  const selectCc = (idcc: string, label: string) => {
    set("idcc", idcc);
    set("ccLabel", label);
    set("ccAnswers", {});
    set("ccSearch", "");
  };

  return (
    <>
      <p className="q">Quel est le nom de la convention collective applicable ?</p>
      <p className="q-sub">
        Vous pouvez trouver le nom de votre convention collective sur votre
        bulletin de paie.
      </p>
      <div className="options">
        <OptionCard
          selected={value === "saisir"}
          onClick={() => chooseChoice("saisir")}
          emoji="📖"
        >
          Je sais quelle est ma convention collective et je la saisis.
        </OptionCard>
        <OptionCard
          selected={value === "rechercher"}
          onClick={() => chooseChoice("rechercher")}
          emoji="🔎"
        >
          Je ne sais pas quelle est ma convention collective et je la recherche.
        </OptionCard>
        <OptionCard
          selected={value === "passer"}
          onClick={() => chooseChoice("passer")}
          emoji="⏭️"
        >
          Je ne souhaite pas renseigner ma convention collective.
        </OptionCard>
      </div>

      {(value === "saisir" || value === "rechercher") && (
        <div style={{ marginTop: 18 }}>
          {form.idcc && form.ccLabel ? (
            <div className="cc-selected">
              <div>
                <span className="cc-badge">IDCC {form.idcc}</span>
                <b>{form.ccLabel}</b>
              </div>
              <button
                type="button"
                className="cc-change"
                onClick={() => {
                  set("idcc", null);
                  set("ccLabel", null);
                  set("ccAnswers", {});
                }}
              >
                Changer
              </button>
            </div>
          ) : (
            <div className="field" style={{ marginBottom: 0 }}>
              <div className="input-wrap">
                <input
                  className="input"
                  placeholder="Rechercher : nom de la convention ou n° IDCC…"
                  value={form.ccSearch}
                  onChange={(e) => set("ccSearch", e.target.value)}
                  autoFocus
                />
                <span className="suffix">🔎</span>
              </div>
              {results.length > 0 && (
                <ul className="cc-list">
                  {results.map((c) => (
                    <li key={c.idcc}>
                      <button
                        type="button"
                        onClick={() => selectCc(c.idcc, c.shortTitle)}
                      >
                        <span className="cc-badge">IDCC {c.idcc}</span>
                        <span>{c.shortTitle}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {form.ccSearch.trim() && results.length === 0 && (
                <p className="hint">
                  <span>ℹ️</span>
                  Aucune convention prise en charge ne correspond. Les 47
                  conventions les plus courantes sont disponibles ; sinon, passez
                  l'étape (calcul Code du travail).
                </p>
              )}
            </div>
          )}

          {/* Questions spécifiques à la convention sélectionnée */}
          {form.idcc && ccQuestions.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <p className="section-h" style={{ marginTop: 0 }}>
                Précisions sur votre convention
              </p>
              {ccQuestions.map((q) => (
                <CcQuestionField
                  key={q.name}
                  q={q}
                  value={form.ccAnswers[q.name] ?? ""}
                  onChange={(v) =>
                    set("ccAnswers", { ...form.ccAnswers, [q.name]: v })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {value === "passer" && (
        <div className="callout warn">
          <span className="ic">ℹ️</span>
          <span>
            Une convention collective peut prévoir un résultat plus favorable que
            le Code du travail. Dans ce cas, c'est ce montant qui s'applique.
          </span>
        </div>
      )}
    </>
  );
}

function CcQuestionField({
  q,
  value,
  onChange,
}: {
  q: CcQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  if (q.type === "liste" && q.options) {
    return (
      <div className="field">
        <label>{q.question}</label>
        <select
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Sélectionnez —</option>
          {q.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (q.type === "oui-non") {
    return (
      <div className="field">
        <label>{q.question}</label>
        <div className="options row">
          <OptionCard selected={value === "'Oui'"} onClick={() => onChange("'Oui'")}>
            Oui
          </OptionCard>
          <OptionCard selected={value === "'Non'"} onClick={() => onChange("'Non'")}>
            Non
          </OptionCard>
        </div>
      </div>
    );
  }
  if (q.type === "date") {
    return (
      <div className="field">
        <label>{q.question}</label>
        <input
          type="date"
          className="input"
          value={value}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split("-");
            onChange(y && m && d ? `${d}/${m}/${y}` : "");
          }}
        />
      </div>
    );
  }
  // montant
  return (
    <div className="field">
      <label>{q.question}</label>
      <div className="input-wrap">
        <input
          type="number"
          inputMode="decimal"
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="suffix">€</span>
      </div>
    </div>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="options row">
      <OptionCard selected={value === true} onClick={() => onChange(true)}>
        Oui
      </OptionCard>
      <OptionCard selected={value === false} onClick={() => onChange(false)}>
        Non
      </OptionCard>
    </div>
  );
}

function StepInaptitude({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <>
      <p className="q">
        Le licenciement fait-il suite à une inaptitude professionnelle ?
      </p>
      <p className="q-sub">
        Suite à un accident du travail ou une maladie professionnelle reconnue.
        Si oui, l'indemnité légale est doublée.
      </p>
      <YesNo value={value} onChange={onChange} />
    </>
  );
}

function StepDates({
  form,
  set,
  seniority,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  seniority?: number;
}) {
  const senioStr = formatSeniority(seniority);
  return (
    <>
      <p className="q">Dates de début et de fin de contrat</p>
      <div className="field">
        <label>Date de début du contrat de travail</label>
        <input
          type="date"
          className="input"
          value={form.dateEntree}
          onChange={(e) => set("dateEntree", e.target.value)}
        />
      </div>
      <div className="field">
        <label>Date de notification du licenciement</label>
        <input
          type="date"
          className="input"
          value={form.dateNotification}
          onChange={(e) => set("dateNotification", e.target.value)}
        />
      </div>
      <div className="field">
        <label>
          Date de fin du préavis de licenciement (date de fin du contrat)
        </label>
        <input
          type="date"
          className="input"
          value={form.dateSortie}
          onChange={(e) => set("dateSortie", e.target.value)}
        />
        <p className="hint">
          <span>↳</span>
          En cas de dispense de préavis, indiquez la date de fin du préavis
          « théorique » non effectué.
        </p>
      </div>
      {senioStr && (
        <div className="live-chip">
          <span>⏳</span>
          <span className="muted">Ancienneté estimée :</span> {senioStr}
        </div>
      )}
    </>
  );
}

function StepAbsences({
  form,
  set,
  seniority,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  seniority?: number;
}) {
  const updateAbsence = (i: number, patch: Partial<AbsenceRow>) => {
    const next = form.absences.map((a, idx) =>
      idx === i ? { ...a, ...patch } : a
    );
    set("absences", next);
  };
  const addAbsence = () =>
    set("absences", [...form.absences, { motifKey: "", durationInMonth: "" }]);
  const removeAbsence = (i: number) =>
    set(
      "absences",
      form.absences.filter((_, idx) => idx !== i)
    );

  const senioStr = formatSeniority(seniority);

  return (
    <>
      <p className="section-h">Au moment du licenciement</p>
      <p className="q" style={{ fontSize: 16 }}>
        Le salarié est-il en arrêt de travail au moment du licenciement ?
      </p>
      <YesNo value={form.arretTravail} onChange={(v) => set("arretTravail", v)} />
      {form.arretTravail && (
        <div className="callout info">
          <span className="ic">💡</span>
          <span>
            En cas d'arrêt de travail, le salaire de référence se calcule sur les
            mois <b>précédant l'arrêt</b> (saisissez ces salaires à l'étape
            suivante).
          </span>
        </div>
      )}

      <p className="section-h">Période d'absence prolongée</p>
      <p className="q" style={{ fontSize: 16 }}>
        Y a-t-il eu des absences de plus d'un mois durant le contrat de travail ?
      </p>
      <YesNo
        value={form.absencesLongues}
        onChange={(v) => set("absencesLongues", v)}
      />

      {form.absencesLongues && (
        <div style={{ marginTop: 18 }}>
          <p className="q-sub">
            Indiquez chaque absence (le motif détermine la part déduite de
            l'ancienneté).
          </p>
          {form.absences.map((a, i) => (
            <div className="absence-row" key={i}>
              <select
                className="input"
                value={a.motifKey}
                onChange={(e) => updateAbsence(i, { motifKey: e.target.value })}
              >
                <option value="">— Motif de l'absence —</option>
                {MOTIFS_ABSENCE_LEGAL.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                    {m.value !== 1 ? ` (déduite à ${m.value * 100}%)` : ""}
                  </option>
                ))}
              </select>
              <div className="input-wrap absence-dur">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className="input"
                  placeholder="Durée"
                  value={a.durationInMonth}
                  onChange={(e) =>
                    updateAbsence(i, { durationInMonth: e.target.value })
                  }
                />
                <span className="suffix">mois</span>
              </div>
              {form.absences.length > 1 && (
                <button
                  type="button"
                  className="absence-del"
                  onClick={() => removeAbsence(i)}
                  aria-label="Supprimer cette absence"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-row" onClick={addAbsence}>
            + Ajouter une absence
          </button>
          {senioStr && (
            <div className="live-chip">
              <span>⏳</span>
              <span className="muted">Ancienneté retenue :</span> {senioStr}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function StepSalaires({
  form,
  set,
  monthLabels,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  monthLabels: string[];
}) {
  return (
    <>
      <p className="q">
        Le salaire mensuel brut a-t-il été le même durant les 12 derniers mois
        précédant la notification ?
      </p>
      <YesNo
        value={form.salaireConstant}
        onChange={(v) => set("salaireConstant", v)}
      />

      {form.salaireConstant === true && (
        <div className="field" style={{ marginTop: 22 }}>
          <label>Quel a été le montant du salaire mensuel brut ?</label>
          <div className="input-wrap">
            <input
              type="number"
              inputMode="decimal"
              className="input"
              placeholder="3000"
              value={form.salaireMensuel}
              onChange={(e) => set("salaireMensuel", e.target.value)}
            />
            <span className="suffix">€</span>
          </div>
          <p className="hint">
            <span>💡</span>
            Prendre en compte les primes et avantages en nature.
          </p>
        </div>
      )}

      {form.salaireConstant === false && (
        <div style={{ marginTop: 22 }}>
          <p className="q-sub">
            Saisissez le salaire brut de chacun des 12 derniers mois. La colonne
            « prime » (facultative) sert aux primes/gratifications incluses dans
            le mois.
          </p>
          <div className="sal-grid">
            {monthLabels.map((label, i) => (
              <div className="sal-cell" key={label || i}>
                <label>{label || `Mois ${12 - i}`}</label>
                <div className="sal-inputs">
                  <div className="input-wrap">
                    <input
                      type="number"
                      inputMode="decimal"
                      className="input"
                      placeholder="Salaire"
                      value={form.salairesMensuels[i]}
                      onChange={(e) => {
                        const next = [...form.salairesMensuels];
                        next[i] = e.target.value;
                        set("salairesMensuels", next);
                      }}
                    />
                    <span className="suffix">€</span>
                  </div>
                  <div className="input-wrap">
                    <input
                      type="number"
                      inputMode="decimal"
                      className="input input-prime"
                      placeholder="Prime"
                      value={form.primesMensuelles[i]}
                      onChange={(e) => {
                        const next = [...form.primesMensuelles];
                        next[i] = e.target.value;
                        set("primesMensuelles", next);
                      }}
                    />
                    <span className="suffix">€</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {monthLabels.length === 0 && (
            <div className="callout warn">
              <span className="ic">⚠️</span>
              <span>
                Renseignez d'abord la date de notification (étape Ancienneté)
                pour saisir les 12 mois.
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function StepResult({
  result,
  onRestart,
}: {
  result: SimulationResult;
  onRestart: () => void;
}) {
  const montant = result.montant ?? 0;
  const animated = useCountUp(montant, result.status === "result");

  if (result.status === "ineligible") {
    // Le moteur renvoie un message HTML — on le nettoie pour l'afficher.
    const reason = (result.ineligibility ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return (
      <>
        <div className="result-top">
          <div className="result-emoji">ℹ️</div>
          <p className="result-label">Indemnité légale</p>
          <div className="ineligible-title">Pas d'indemnité légale due</div>
          <p className="result-note">
            {reason ||
              "Les conditions de l'indemnité légale ne sont pas réunies."}
          </p>
        </div>
        <div className="callout info">
          <span className="ic">💡</span>
          <span>
            Une convention collective ou votre contrat peut prévoir des règles
            plus favorables. Vérifiez votre situation auprès d'un conseiller.
          </span>
        </div>
        <div className="restart">
          <button onClick={onRestart}>↺ Recommencer la simulation</button>
        </div>
      </>
    );
  }

  if (result.status !== "result") {
    return (
      <>
        <div className="error-box">
          {result.status === "missing"
            ? `Il manque des informations : ${result.missing?.join(", ")}`
            : `Une erreur est survenue : ${result.message ?? "inconnue"}`}
        </div>
        <div className="restart">
          <button onClick={onRestart}>↺ Recommencer la simulation</button>
        </div>
      </>
    );
  }

  const formule = result.formule as
    | { formula?: string; explanations?: string[] }
    | undefined;

  return (
    <>
      <div className="result-top">
        <div className="result-emoji">🎉</div>
        <p className="result-label">
          Votre indemnité de licenciement est estimée à
        </p>
        <div className="amount">{formatEuros(animated)}</div>
        <p className="result-note">
          Ce montant est exonéré d'impôt sur le revenu et de cotisations
          sociales sous certaines conditions.
        </p>
      </div>

      <div className="callout info">
        <span className="ic">ℹ️</span>
        <span>
          Il peut exister un montant plus favorable prévu par une convention
          collective, un accord d'entreprise ou votre contrat de travail.
        </span>
      </div>

      <details className="detail" open>
        <summary>
          <span>Détail du calcul</span>
          <span>▾</span>
        </summary>
        <div className="detail-body">
          {formule?.formula && <div className="formula">{formule.formula}</div>}
          {formule?.explanations?.map((ex) => (
            <div className="kv" key={ex}>
              <span>{ex}</span>
            </div>
          ))}
          <div className="kv">
            <span>Montant prévu par le Code du travail</span>
            <b>{formatEuros(result.legalMontant ?? montant)}</b>
          </div>
          <div className="kv">
            <span>Montant prévu par la convention collective</span>
            <b>
              {result.agreementMontant != null
                ? formatEuros(result.agreementMontant)
                : "Non renseignée"}
            </b>
          </div>
          {result.chosenResult && result.agreementMontant != null && (
            <div className="kv">
              <span>Montant retenu (le plus favorable)</span>
              <b>
                {result.chosenResult === "AGREEMENT"
                  ? "Convention collective"
                  : result.chosenResult === "SAME"
                  ? "Identique"
                  : "Code du travail"}
              </b>
            </div>
          )}
        </div>
      </details>

      <div className="restart">
        <button onClick={onRestart}>↺ Recommencer la simulation</button>
      </div>
    </>
  );
}
