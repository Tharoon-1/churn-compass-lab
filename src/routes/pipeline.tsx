import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Plug, Split, Table, Wrench, Brain, Gauge, Percent } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Help, PageHeader, Panel } from "@/components/kit";
import { actions, useStore, type ModelName } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — ChurnLab" },
      { name: "description", content: "Visual preprocessing and model pipeline with a Role 2 handoff checklist." },
      { property: "og:title", content: "ChurnLab — Pipeline" },
      { property: "og:description", content: "Understand each pipeline step and avoid leakage." },
    ],
  }),
  component: PipelinePage,
});

const steps = [
  { icon: Table, t: "Raw customer rows", d: "CSV with features, target, ID", tip: "ID is set aside so it can be re-attached to predictions later." },
  { icon: Split, t: "Train / validation split", d: "e.g. 80 / 20, stratified", tip: "Stratify keeps the churn rate similar in both parts. Fix the random seed so runs are comparable." },
  { icon: Wrench, t: "Prepare fields", d: "Numeric: fill blank → scale\nCategory: fill blank → one-hot", tip: "Fill values and scaling are learned on training rows only, then applied to validation." },
  { icon: Brain, t: "Classifier", d: "Selected model below", tip: "The only step that changes between most experiments." },
  { icon: Percent, t: "Risk score", d: "Probability of churn 0–1", tip: "AUC metrics use the probability, not a yes/no label." },
  { icon: Gauge, t: "Metrics", d: "ROC-AUC · PR-AUC", tip: "Computed on validation rows the model never saw while fitting." },
];

const models: { m: ModelName; d: string; tag: string }[] = [
  { m: "Logistic Regression", d: "Fast, interpretable linear baseline. Always run this first.", tag: "Baseline" },
  { m: "Random Forest", d: "Many decision trees voting. Handles non-linear patterns; watch depth.", tag: "Ensemble" },
  { m: "Gradient Boosting", d: "Trees built one after another fixing errors. Often strongest on tabular data.", tag: "Ensemble" },
];

const handoff = [
  "Target column and excluded ID columns confirmed with Role 1",
  "Fixed random seed and stratified train/validation split",
  "Preprocessing wrapped in a single sklearn Pipeline / ColumnTransformer",
  "Imputer & scaler fitted on training rows only",
  "Unknown categories handled (handle_unknown='ignore')",
  "Model outputs predict_proba, not hard labels",
  "ROC-AUC and PR-AUC logged for every run",
  "Each run approved and counted by Person 3",
  "Final pipeline saved (e.g. joblib) for predictions",
  "Prediction output keeps the ID column for matching",
];

function PipelinePage() {
  const { model, checklist } = useStore();
  const done = handoff.filter((h) => checklist[`h:${h}`]).length;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Step 2 · Role 2" title="Pipeline" desc="How raw rows turn into a churn risk score. The same pipeline must be reused for validation and the hidden test set." />

      <Panel title="Pipeline flow">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
          {steps.map((s, i) => (
            <div key={s.t} className="flex flex-1 items-center gap-2 lg:flex-col lg:items-stretch">
              <div className="flex flex-1 flex-col rounded-md border bg-background p-3">
                <div className="flex items-center justify-between">
                  <s.icon className="h-4 w-4 text-primary" /><Help>{s.tip}</Help>
                </div>
                <p className="mt-2 text-sm font-medium">{s.t}</p>
                <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{i === 3 ? model : s.d}</p>
              </div>
              {i < steps.length - 1 && <ArrowRight className="hidden h-4 w-4 shrink-0 self-center text-muted-foreground lg:block" />}
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Fit only on training data">
          <p className="text-sm text-muted-foreground">Think of validation rows as a sealed exam. If the imputer or scaler peeks at them (e.g. averaging over all rows), your score looks better than it really is.</p>
        </Panel>
        <Panel title="What is leakage?">
          <p className="text-sm text-muted-foreground">Any clue that wouldn't exist at prediction time — like a cancellation date or the target itself in disguise. It inflates validation scores and fails on the hidden test.</p>
        </Panel>
      </div>

      <Panel title="Model choice" right={<span className="text-xs text-muted-foreground">Selection only — no training happens here</span>}>
        <div className="grid gap-3 md:grid-cols-3">
          {models.map((x) => (
            <button key={x.m} onClick={() => actions.setModel(x.m)}
              className={cn("rounded-md border p-4 text-left transition-colors", model === x.m ? "border-primary bg-accent/40 ring-1 ring-primary" : "hover:border-primary/50")}>
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">{x.m}</p><span className="font-mono text-[10px] uppercase text-muted-foreground">{x.tag}</span></div>
              <p className="mt-1 text-xs text-muted-foreground">{x.d}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-md border border-demo/40 bg-demo-soft p-3 text-sm text-demo-foreground">
          <Plug className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Training requires connecting the Python / Colab pipeline. This frontend prototype does not fit any model — log real results from Colab into the Experiments ledger.</p>
        </div>
      </Panel>

      <Panel title="Role 2 handoff checklist" right={<span className="font-mono text-xs text-muted-foreground">{done}/{handoff.length}</span>}>
        <div className="grid gap-2 md:grid-cols-2">
          {handoff.map((h) => (
            <label key={h} className="flex items-start gap-2 rounded-md p-2 text-sm hover:bg-muted">
              <Checkbox className="mt-0.5" checked={!!checklist[`h:${h}`]} onCheckedChange={() => actions.toggleCheck(`h:${h}`)} />
              <span className={checklist[`h:${h}`] ? "text-muted-foreground line-through" : ""}>{h}</span>
            </label>
          ))}
        </div>
      </Panel>
    </div>
  );
}
