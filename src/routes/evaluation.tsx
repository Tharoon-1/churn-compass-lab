import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DemoBadge, Explainer, PageHeader, Panel, fmt } from "@/components/kit";
import { bestRun, useStore } from "@/lib/store";

export const Route = createFileRoute("/evaluation")({
  head: () => ({
    meta: [
      { title: "Evaluation — ChurnLab" },
      { name: "description", content: "ROC-AUC and PR-AUC explained, with baseline comparison." },
      { property: "og:title", content: "ChurnLab — Evaluation" },
      { property: "og:description", content: "Plain-English evaluation of churn experiments." },
    ],
  }),
  component: EvalPage,
});

function EvalPage() {
  const { experiments } = useStore();
  const done = experiments.filter((e) => e.status === "completed" && e.rocAuc != null).sort((a, b) => a.run - b.run);
  const base = done[0], best = bestRun(experiments);
  const demo = done.some((e) => e.demo);
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Step 4" title="Evaluation" desc="Validation scores are your estimate. Organizers score the hidden test set — its labels are never available to you." />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Baseline ROC-AUC" right={demo && <DemoBadge />}><p className="font-mono text-3xl">{fmt(base?.rocAuc)}</p></Panel>
        <Panel title="Best ROC-AUC" right={demo && <DemoBadge />}><p className="font-mono text-3xl text-primary">{fmt(best?.rocAuc)}</p></Panel>
        <Panel title="Gain over baseline" right={demo && <DemoBadge />}><p className="font-mono text-3xl">{base && best ? `+${(best.rocAuc! - base.rocAuc!).toFixed(3)}` : "—"}</p></Panel>
      </div>
      <Panel title="Trajectory per run" right={demo && <DemoBadge label="Illustrative only" />}>
        {done.length ? <div className="h-64"><ResponsiveContainer><BarChart data={done.map((e) => ({ run: `#${e.run}`, roc: e.rocAuc, pr: e.prAuc }))}>
          <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="run" /><YAxis domain={[0, 1]} /><Tooltip />
          <Bar dataKey="roc" name="ROC-AUC" fill="var(--chart-1)" /><Bar dataKey="pr" name="PR-AUC" fill="var(--chart-2)" />
        </BarChart></ResponsiveContainer></div> : <p className="text-sm text-muted-foreground">No completed runs yet.</p>}
      </Panel>
      <div className="grid gap-3 md:grid-cols-3">
        <Explainer term="ROC-AUC">chance a random churner gets a higher risk score than a random stayer. 0.5 = coin flip, 1.0 = perfect.</Explainer>
        <Explainer term="PR-AUC">how precise the top of your risk list is. Matters because churners are the minority.</Explainer>
        <Explainer term="Validation vs hidden test">validation is your rehearsal; hidden test is the real exam, scored by organizers.</Explainer>
      </div>
      {demo && <Panel title="What this means" right={<DemoBadge label="Illustrative insight" />}>
        <p className="text-sm text-muted-foreground">In the sample runs, boosting beat the baseline by ~0.03 ROC-AUC while the unrestricted forest overfit. Small gains may not survive on the hidden test — prefer stable improvements.</p>
      </Panel>}
    </div>
  );
}
