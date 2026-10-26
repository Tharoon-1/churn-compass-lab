import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DemoBadge, Empty, PageHeader, Panel, fmt } from "@/components/kit";
import { actions, BUDGET, budgetError, completedCount, nextRunNumber, useStore, type Experiment, type ModelName, type RunStatus } from "@/lib/store";

export const Route = createFileRoute("/experiments")({
  head: () => ({
    meta: [
      { title: "Experiments — ChurnLab" },
      { name: "description", content: "Ledger of churn model experiments with a 15-run budget." },
      { property: "og:title", content: "ChurnLab — Experiments" },
      { property: "og:description", content: "Track hypotheses, settings and validation metrics." },
    ],
  }),
  component: ExperimentsPage,
});

const MODELS: ModelName[] = ["Logistic Regression", "Random Forest", "Gradient Boosting"];
const STATUSES: RunStatus[] = ["planned", "running", "completed", "discarded"];

function ExperimentsPage() {
  const { experiments } = useStore();
  const [edit, setEdit] = useState<Experiment | null>(null);
  const [filter, setFilter] = useState<RunStatus | "all">("all");
  const [sort, setSort] = useState<"latest" | "best">("latest");
  const used = completedCount(experiments);
  const list = experiments.filter((e) => filter === "all" || e.status === filter)
    .sort((a, b) => (sort === "latest" ? b.run - a.run : (b.rocAuc ?? -1) - (a.rocAuc ?? -1)));

  const blank = (): Experiment => ({ id: `u-${Date.now()}`, run: nextRunNumber(experiments), hypothesis: "", model: "Logistic Regression", settings: "", rocAuc: null, prAuc: null, runtimeSec: null, lesson: "", status: "planned", approvedBy: "", demo: false, createdAt: Date.now() });

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Step 3" title="Experiment ledger" desc="One completed fit + validation cycle = 1 experiment. Planned runs don't count. Person 3 owns the counter and approves each run."
        actions={<Button onClick={() => setEdit(blank())}><Plus className="h-4 w-4" /> Log experiment</Button>} />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel><p className="text-xs text-muted-foreground">Completed / budget</p><p className="font-mono text-2xl font-semibold">{used}/{BUDGET}</p><p className="text-xs text-muted-foreground">{BUDGET - used} remaining</p></Panel>
        <Panel className="md:col-span-2" title="Comparing runs fairly">
          <p className="text-sm text-muted-foreground">Same split and seed, change one thing per run, compare on validation ROC-AUC first, PR-AUC as tie-breaker. Write the lesson before the next run.</p>
        </Panel>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="capitalize">{s}</Button>)}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant={sort === "latest" ? "secondary" : "ghost"} onClick={() => setSort("latest")}>Latest</Button>
          <Button size="sm" variant={sort === "best" ? "secondary" : "ghost"} onClick={() => setSort("best")}>Best ROC-AUC</Button>
        </div>
      </div>
      {list.length ? (
        <Panel className="overflow-auto p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="p-3">#</th><th>Hypothesis</th><th>Model</th><th>Settings</th><th>ROC-AUC</th><th>PR-AUC</th><th>Time</th><th>Lesson</th><th>Status</th><th /></tr></thead>
            <tbody>{list.map((e) => (
              <tr key={e.id} className="border-b align-top last:border-0">
                <td className="p-3 font-mono">{e.run}</td>
                <td className="max-w-48 py-3">{e.hypothesis}{e.demo && <div className="mt-1"><DemoBadge label="Demo" /></div>}</td>
                <td className="py-3 text-xs">{e.model}</td>
                <td className="max-w-40 py-3 font-mono text-xs text-muted-foreground">{e.settings}</td>
                <td className="py-3 font-mono">{fmt(e.rocAuc)}</td>
                <td className="py-3 font-mono">{fmt(e.prAuc)}</td>
                <td className="py-3 font-mono text-xs">{e.runtimeSec != null ? `${e.runtimeSec}s` : "—"}</td>
                <td className="max-w-48 py-3 text-xs text-muted-foreground">{e.lesson}</td>
                <td className="py-3"><Badge variant={e.status === "completed" ? "success" : "info"} className="capitalize">{e.status}</Badge></td>
                <td className="whitespace-nowrap py-3 pr-3">
                  <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEdit(e)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { if (confirm(`Delete run #${e.run}?`)) actions.deleteExperiment(e.id); }}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>))}</tbody>
          </table>
        </Panel>
      ) : <Empty icon={<FlaskConical className="h-6 w-6" />} title="No experiments here" desc="Log a planned run with a clear hypothesis, then mark it completed after running it in Colab." action={<Button size="sm" onClick={() => setEdit(blank())}>Log experiment</Button>} />}
      {edit && <RunForm initial={edit} all={experiments} onClose={() => setEdit(null)} />}
    </div>
  );
}

function RunForm({ initial, all, onClose }: { initial: Experiment; all: Experiment[]; onClose: () => void }) {
  const [f, setF] = useState({ ...initial, roc: initial.rocAuc?.toString() ?? "", pr: initial.prAuc?.toString() ?? "", rt: initial.runtimeSec?.toString() ?? "" });
  const [err, setErr] = useState<string | null>(null);
  const done = f.status === "completed";
  function save() {
    if (!f.hypothesis.trim()) return setErr("Hypothesis is required.");
    const num = (s: string) => (s.trim() === "" ? null : Number(s));
    const roc = num(f.roc), pr = num(f.pr), rt = num(f.rt);
    if (done && (roc == null || pr == null)) return setErr("Completed runs need ROC-AUC and PR-AUC.");
    for (const v of [roc, pr]) if (v != null && (isNaN(v) || v < 0 || v > 1)) return setErr("Metrics must be between 0 and 1.");
    if (rt != null && (isNaN(rt) || rt < 0)) return setErr("Runtime must be a positive number.");
    const exp: Experiment = { ...initial, ...f, rocAuc: roc, prAuc: pr, runtimeSec: rt };
    const b = budgetError(all, exp);
    if (b) return setErr(b);
    if (done && initial.status !== "completed" && !confirm(`This uses 1 of ${BUDGET} experiments. Approved by Person 3?`)) return;
    actions.saveExperiment(exp); toast.success(`Run #${exp.run} saved`); onClose();
  }
  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Run #{f.run}</DialogTitle></DialogHeader>
        <div className="grid gap-3 text-sm">
          <Textarea placeholder="Hypothesis *" value={f.hypothesis} onChange={(e) => set("hypothesis", e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <select className="h-9 rounded-md border bg-background px-2" value={f.model} onChange={(e) => set("model", e.target.value)}>{MODELS.map((m) => <option key={m}>{m}</option>)}</select>
            <select className="h-9 rounded-md border bg-background px-2 capitalize" value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((m) => <option key={m}>{m}</option>)}</select>
          </div>
          <Input placeholder="Change / settings" value={f.settings} onChange={(e) => set("settings", e.target.value)} />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="ROC-AUC 0–1" value={f.roc} onChange={(e) => set("roc", e.target.value)} />
            <Input placeholder="PR-AUC 0–1" value={f.pr} onChange={(e) => set("pr", e.target.value)} />
            <Input placeholder="Runtime s" value={f.rt} onChange={(e) => set("rt", e.target.value)} />
          </div>
          <Input placeholder="Approved by (Person 3)" value={f.approvedBy} onChange={(e) => set("approvedBy", e.target.value)} />
          <Textarea placeholder="Decision / lesson" value={f.lesson} onChange={(e) => set("lesson", e.target.value)} />
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
