import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { AlertTriangle, Database, FileUp, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DemoBadge, Empty, Explainer, PageHeader, Panel } from "@/components/kit";
import { actions, useStore } from "@/lib/store";
import { profile, syntheticRows, type Row } from "@/lib/sample";

export const Route = createFileRoute("/dataset")({
  head: () => ({
    meta: [
      { title: "Dataset — ChurnLab" },
      { name: "description", content: "Preview a churn CSV locally, choose the target and exclude ID columns." },
      { property: "og:title", content: "ChurnLab — Dataset" },
      { property: "og:description", content: "Browser-only CSV profiling for churn data." },
    ],
  }),
  component: DatasetPage,
});

// Rows stay in memory for this session only; never uploaded.
let memRows: Row[] | null = null;

function DatasetPage() {
  const { dataset } = useStore();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (memRows) setRows(memRows);
    else if (dataset?.synthetic) { memRows = syntheticRows(); setRows(memRows); }
  }, [dataset?.synthetic]);

  const columns = dataset?.columns ?? [];
  const cols = useMemo(() => (rows ? profile(rows, columns) : []), [rows, columns]);

  function useData(r: Row[], name: string, synthetic: boolean) {
    const columns = Object.keys(r[0] ?? {});
    if (!columns.length) { toast.error("No columns found in file"); return; }
    const prof = profile(r, columns);
    const target = prof.find((c) => c.flags.includes("Possible target"))?.name ?? null;
    const excluded = prof.filter((c) => c.flags.includes("Possible ID")).map((c) => c.name);
    memRows = r; setRows(r);
    actions.setDataset({ name, rows: r.length, columns, target, excluded, synthetic });
    toast.success(`Loaded ${r.length.toLocaleString()} rows — processed in your browser only`);
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) { toast.error("Please choose a .csv file"); return; }
    Papa.parse<Row>(f, {
      header: true, skipEmptyLines: true,
      complete: (res) => res.data.length ? useData(res.data, f.name, false) : toast.error("The CSV has no data rows"),
      error: () => toast.error("Could not read this CSV"),
    });
  }

  function reset() { memRows = null; setRows(null); actions.setDataset(null); }

  const header = (
    <PageHeader eyebrow="Step 1" title="Dataset" desc="Load a churn CSV to profile it. Everything is parsed inside your browser — no data leaves this page."
      actions={dataset && <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="h-4 w-4" /> Clear dataset</Button>} />
  );

  if (!dataset || !rows) {
    return (
      <div>
        {header}
        <div className="grid gap-4 lg:grid-cols-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors lg:col-span-2 ${drag ? "border-primary bg-accent/40" : "bg-card"}`}>
            <FileUp className="h-8 w-8 text-primary" />
            <p className="mt-3 font-medium">Drop a CSV here</p>
            <p className="mt-1 text-sm text-muted-foreground">or pick one from your computer</p>
            <input ref={input} type="file" accept=".csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={() => input.current?.click()}>Choose CSV</Button>
              <Button variant="outline" onClick={() => useData(syntheticRows(), "synthetic_telecom_sample.csv", true)}>Use synthetic sample</Button>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Stays on your device</p>
          </div>
          <Panel title="Beginner glossary">
            <div className="space-y-2">
              <Explainer term="Target">the answer we want to predict (did the customer churn?).</Explainer>
              <Explainer term="Features">the clues the model learns from (tenure, contract, charges…).</Explainer>
              <Explainer term="ID">a row label. Useful for matching results, useless as a clue — exclude it.</Explainer>
              <Explainer term="Missing">unknown, not zero. The pipeline fills it using training data only.</Explainer>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  const featureCols = cols.filter((c) => c.name !== dataset.target && !dataset.excluded.includes(c.name));
  const totalMissing = cols.reduce((s, c) => s + c.missing, 0);
  const churnRate = dataset.target ? rows.filter((r) => /^(yes|1|true)$/i.test(r[dataset.target!] ?? "")).length / rows.length : null;

  return (
    <div className="space-y-4">
      {header}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Database className="h-4 w-4 text-primary" /><span className="font-medium">{dataset.name}</span>
        {dataset.synthetic && <DemoBadge label="Synthetic · illustrative" />}
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat k="Rows" v={dataset.rows.toLocaleString()} />
        <Stat k="Columns" v={String(columns.length)} />
        <Stat k="Features used" v={String(featureCols.length)} />
        <Stat k="Positive rate" v={churnRate == null ? "—" : `${(churnRate * 100).toFixed(1)}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Target & exclusions">
          <label className="text-xs font-medium text-muted-foreground">Churn target column (the answer)</label>
          <Select value={dataset.target ?? ""} onValueChange={(v) => actions.setDataset({ ...dataset, target: v, excluded: dataset.excluded.filter((x) => x !== v) })}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Pick target column" /></SelectTrigger>
            <SelectContent>{columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <p className="mt-4 text-xs font-medium text-muted-foreground">Exclude from features (IDs, leaky fields)</p>
          <div className="mt-2 max-h-64 space-y-1.5 overflow-auto">
            {columns.filter((c) => c !== dataset.target).map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <Checkbox checked={dataset.excluded.includes(c)} onCheckedChange={() =>
                  actions.setDataset({ ...dataset, excluded: dataset.excluded.includes(c) ? dataset.excluded.filter((x) => x !== c) : [...dataset.excluded, c] })} />
                <span className="font-mono text-xs">{c}</span>
              </label>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Column profile" right={<span className="text-xs text-muted-foreground">{totalMissing} missing cells total</span>}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2">Column</th><th>Type</th><th>Missing</th><th>Unique</th><th>Review</th></tr></thead>
              <tbody>
                {cols.map((c) => (
                  <tr key={c.name} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs">{c.name}{c.name === dataset.target && <Badge variant="info" className="ml-2">target</Badge>}{dataset.excluded.includes(c.name) && <Badge variant="outline" className="ml-2">excluded</Badge>}</td>
                    <td><Badge variant={c.type === "numeric" ? "info" : "secondary"}>{c.type}</Badge></td>
                    <td className="font-mono text-xs">{c.missing ? <span className="text-demo-foreground">{c.missing} ({((c.missing / rows.length) * 100).toFixed(1)}%)</span> : "0"}</td>
                    <td className="font-mono text-xs">{c.unique}</td>
                    <td>{c.flags.map((f) => <Badge key={f} variant="warning" className="mr-1"><AlertTriangle className="mr-1 h-3 w-3" />{f}</Badge>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title={`Preview · first 8 of ${rows.length.toLocaleString()} rows`}>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left text-muted-foreground">{columns.map((c) => <th key={c} className="whitespace-nowrap px-2 py-2 font-mono">{c}</th>)}</tr></thead>
            <tbody>{rows.slice(0, 8).map((r, i) => (
              <tr key={i} className="border-b last:border-0">{columns.map((c) => <td key={c} className="whitespace-nowrap px-2 py-1.5 font-mono">{r[c] === "" ? <span className="text-demo-foreground">blank</span> : r[c]}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
      {!rows.length && <Empty icon={<Database />} title="Empty file" desc="No rows." />}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <Panel><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 font-mono text-2xl font-semibold">{v}</p></Panel>;
}
