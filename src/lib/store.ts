import { useEffect, useSyncExternalStore } from "react";

export const BUDGET = 15;

export type RunStatus = "planned" | "running" | "completed" | "discarded";
export type ModelName = "Logistic Regression" | "Random Forest" | "Gradient Boosting";

export interface Experiment {
  id: string;
  run: number;
  hypothesis: string;
  model: ModelName;
  settings: string;
  rocAuc: number | null;
  prAuc: number | null;
  runtimeSec: number | null;
  lesson: string;
  status: RunStatus;
  approvedBy: string;
  demo: boolean;
  createdAt: number;
}

export interface DatasetMeta {
  name: string;
  rows: number;
  columns: string[];
  target: string | null;
  excluded: string[];
  synthetic: boolean;
}

interface State {
  experiments: Experiment[];
  checklist: Record<string, boolean>;
  dataset: DatasetMeta | null;
  model: ModelName;
}

const KEY = "churnlab:v1";

export function demoExperiments(): Experiment[] {
  const base = Date.UTC(2026, 9, 20);
  const rows: Omit<Experiment, "id" | "demo" | "createdAt" | "approvedBy">[] = [
    { run: 1, hypothesis: "A simple linear baseline sets the bar.", model: "Logistic Regression", settings: "C=1.0, median impute, standard scale, one-hot", rocAuc: 0.812, prAuc: 0.574, runtimeSec: 4, lesson: "Keep as baseline. Tenure and contract type dominate.", status: "completed" },
    { run: 2, hypothesis: "Balancing classes helps recall of churners.", model: "Logistic Regression", settings: "class_weight=balanced", rocAuc: 0.818, prAuc: 0.589, runtimeSec: 4, lesson: "Small gain; keep balanced weights.", status: "completed" },
    { run: 3, hypothesis: "Trees capture non-linear tenure effects.", model: "Random Forest", settings: "n_estimators=300, max_depth=None", rocAuc: 0.801, prAuc: 0.561, runtimeSec: 21, lesson: "Overfits; worse than baseline. Limit depth.", status: "completed" },
    { run: 4, hypothesis: "Shallower forest generalises better.", model: "Random Forest", settings: "n_estimators=300, max_depth=8, min_leaf=5", rocAuc: 0.829, prAuc: 0.607, runtimeSec: 17, lesson: "Beats baseline by ~0.01 ROC-AUC.", status: "completed" },
    { run: 5, hypothesis: "Boosting with low learning rate is strongest.", model: "Gradient Boosting", settings: "lr=0.05, n_estimators=400, max_depth=3", rocAuc: 0.843, prAuc: 0.628, runtimeSec: 38, lesson: "Current best. Check stability next.", status: "completed" },
    { run: 6, hypothesis: "Add tenure buckets as engineered feature.", model: "Gradient Boosting", settings: "same as run 5 + tenure_bucket", rocAuc: null, prAuc: null, runtimeSec: null, lesson: "", status: "planned" },
  ];
  return rows.map((r, i) => ({ ...r, id: `demo-${i + 1}`, demo: true, approvedBy: r.status === "completed" ? "Person 3" : "", createdAt: base + i * 3600_000 }));
}

const defaultState = (): State => ({ experiments: demoExperiments(), checklist: {}, dataset: null, model: "Logistic Regression" });
const emptyState = (): State => ({ experiments: [], checklist: {}, dataset: null, model: "Logistic Regression" });

let state: State = defaultState();
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...defaultState(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  subs.forEach((f) => f());
}

function set(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

const serverSnap = defaultState();
export function useStore() {
  const s = useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => state,
    () => serverSnap,
  );
  useEffect(load, []);
  return s;
}

export const completedCount = (e: Experiment[]) => e.filter((x) => x.status === "completed").length;
export const bestRun = (e: Experiment[]) =>
  e.filter((x) => x.status === "completed" && x.rocAuc != null).sort((a, b) => b.rocAuc! - a.rocAuc!)[0];

/** Returns error message if the change would exceed the budget. */
export function budgetError(list: Experiment[], next: Experiment): string | null {
  if (next.status !== "completed") return null;
  const others = list.filter((x) => x.id !== next.id);
  if (completedCount(others) >= BUDGET) return `Budget reached: ${BUDGET} completed runs already logged. Mark one as discarded or keep this run as planned.`;
  return null;
}

export const actions = {
  saveExperiment(e: Experiment) {
    set((s) => {
      const exists = s.experiments.some((x) => x.id === e.id);
      return { experiments: exists ? s.experiments.map((x) => (x.id === e.id ? e : x)) : [...s.experiments, e] };
    });
  },
  deleteExperiment(id: string) { set((s) => ({ experiments: s.experiments.filter((x) => x.id !== id) })); },
  toggleCheck(k: string) { set((s) => ({ checklist: { ...s.checklist, [k]: !s.checklist[k] } })); },
  setDataset(d: DatasetMeta | null) { set({ dataset: d }); },
  setModel(m: ModelName) { set({ model: m }); },
  resetEmpty() { set(emptyState()); },
  loadDemo() { set(defaultState()); },
};

export const nextRunNumber = (e: Experiment[]) => (e.length ? Math.max(...e.map((x) => x.run)) + 1 : 1);
