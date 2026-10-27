import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, RotateCcw, Sparkles, FlaskConical } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DemoBadge, Empty, Panel, fmt } from "@/components/kit";
import { actions, BUDGET, bestRun, completedCount, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — ChurnLab" },
      { name: "description", content: "Experiment budget, best validation scores and next steps for the churn challenge." },
      { property: "og:title", content: "ChurnLab — Overview" },
      { property: "og:description", content: "Budget-constrained telecom churn prediction cockpit." },
    ],
  }),
  component: Overview,
});

function stage(used: number, hasData: boolean) {
  if (!hasData && used === 0) return "1 · Understand data";
  if (used === 0) return "2 · Build baseline pipeline";
  if (used < 8) return "3 · Iterate on experiments";
  if (used < BUDGET) return "4 · Refine & lock best model";
  return "5 · Budget spent — evaluate & present";
}

function Overview() {
  const { experiments, dataset } = useStore();
  const used = completedCount(experiments);
  const best = bestRun(experiments);
  const anyDemo = experiments.some((e) => e.demo);
  const done = experiments.filter((e) => e.status === "completed" && e.rocAuc != null).sort((a, b) => a.run - b.run);
  const chart = done.map((e) => ({ run: `#${e.run}`, roc: e.rocAuc, pr: e.prAuc }));
  const bestPr = done.reduce<number | null>((m, e) => (e.prAuc != null && (m == null || e.prAuc > m) ? e.prAuc : m), null);
  const recent = [...experiments].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-teal">Challenge 1 · Autonomous AI Data Scientist</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Predict telecom churn within 15 experiments</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Rank customers by churn risk as well as possible (ROC-AUC) while spending the training budget deliberately.
          </p>
        </div>
        <div className="flex gap-2">
          {anyDemo ? (
            <Button variant="outline" size="sm" onClick={() => { actions.resetEmpty(); toast.success("Project reset to an empty state"); }}>
              <RotateCcw className="h-4 w-4" /> Reset to empty
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => { actions.loadDemo(); toast.success("Sample walkthrough loaded"); }}>
              <Sparkles className="h-4 w-4" /> Load demo walkthrough
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel className="xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">Experiment budget</p>
            <span className="font-mono text-sm text-muted-foreground">{BUDGET - used} remaining</span>
          </div>
          <p className="mt-2 font-mono text-4xl font-semibold">{used}<span className="text-xl text-muted-foreground">/{BUDGET}</span></p>
          <div className="mt-3 grid grid-cols-15 gap-1" style={{ gridTemplateColumns: `repeat(${BUDGET}, minmax(0,1fr))` }}>
            {Array.from({ length: BUDGET }).map((_, i) => (
              <div key={i} className={`h-2.5 rounded-sm ${i < used ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Stage: <span className="font-medium text-foreground">{stage(used, !!dataset)}</span></p>
        </Panel>
        <Kpi label="Best validation ROC-AUC" value={fmt(best?.rocAuc)} sub={best ? `Run #${best.run} · ${best.model}` : "No completed runs yet"} demo={!!best?.demo} />
        <Kpi label="Best validation PR-AUC" value={fmt(bestPr)} sub="Secondary metric" demo={anyDemo && bestPr != null} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Validation score progression" right={anyDemo && chart.length > 0 && <DemoBadge label="Illustrative only" />}>
          {chart.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={chart} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="run" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Line type="monotone" dataKey="roc" name="ROC-AUC" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="pr" name="PR-AUC" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty icon={<FlaskConical className="h-6 w-6" />} title="No completed runs" desc="Log a completed experiment to see validation scores trend across runs." action={<Button asChild size="sm"><Link to="/experiments">Open ledger</Link></Button>} />
          )}
        </Panel>
        <Panel title="Challenge rules">
          <ul className="space-y-3 text-sm">
            <Rule k="Budget" v="Max 15 training experiments" />
            <Rule k="1 experiment" v="One fit + validation cycle" />
            <Rule k="Primary" v="ROC-AUC" />
            <Rule k="Secondary" v="PR-AUC / Average Precision" />
            <Rule k="Hidden test" v="Labels unavailable — organizers score it" />
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Recent runs" right={<Link to="/experiments" className="text-xs text-primary hover:underline">View all</Link>}>
          {recent.length ? (
            <ul className="divide-y">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-8 font-mono text-muted-foreground">#{e.run}</span>
                  <span className="min-w-0 flex-1 truncate">{e.hypothesis}</span>
                  <span className="hidden text-xs text-muted-foreground md:inline">{e.model}</span>
                  <span className="w-12 text-right font-mono">{fmt(e.rocAuc)}</span>
                  <Badge variant={e.status === "completed" ? "success" : "info"} className="capitalize">{e.status}</Badge>
                  {e.demo && <DemoBadge label="Demo" />}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nothing logged yet.</p>}
        </Panel>
        <Panel className="border-primary/30 bg-accent/40" title="Next step for Role 2">
          <NextStep used={used} hasData={!!dataset} />
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, demo }: { label: string; value: string; sub: string; demo: boolean }) {
  return (
    <Panel>
      <div className="flex items-center justify-between"><p className="text-sm font-medium">{label}</p>{demo && <DemoBadge />}</div>
      <p className="mt-2 font-mono text-4xl font-semibold text-primary">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </Panel>
  );
}

function Rule({ k, v }: { k: string; v: string }) {
  return <li className="flex justify-between gap-3 border-b border-dashed pb-2 last:border-0"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v}</span></li>;
}

function NextStep({ used, hasData }: { used: number; hasData: boolean }) {
  const s = !hasData
    ? { t: "Load and inspect the dataset", d: "Confirm the target column and exclude ID columns before building the pipeline.", to: "/dataset" as const }
    : used === 0
      ? { t: "Wire up the baseline pipeline", d: "Logistic Regression with impute + scale + one-hot. This becomes run #1.", to: "/pipeline" as const }
      : used < BUDGET
        ? { t: "Plan the next experiment", d: "Write one hypothesis, change one thing, get Person 3's approval, then run it.", to: "/experiments" as const }
        : { t: "Lock the best model", d: "Budget is spent. Save the pipeline and prepare predictions and slides.", to: "/presentation" as const };
  return (
    <div>
      <p className="font-medium">{s.t}</p>
      <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
      <Button asChild size="sm" className="mt-4"><Link to={s.to}>Go <ArrowRight className="h-4 w-4" /></Link></Button>
    </div>
  );
}
