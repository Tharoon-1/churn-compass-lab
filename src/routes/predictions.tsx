import { createFileRoute } from "@tanstack/react-router";
import { Download, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBadge, PageHeader, Panel } from "@/components/kit";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "Predictions — ChurnLab" },
      { name: "description", content: "How churn-risk predictions are produced and formatted." },
      { property: "og:title", content: "ChurnLab — Predictions" },
      { property: "og:description", content: "Example prediction output format." },
    ],
  }),
  component: PredPage,
});

const sample = [["CUST-20001", 0.82], ["CUST-20002", 0.14], ["CUST-20003", 0.47], ["CUST-20004", 0.06], ["CUST-20005", 0.68]] as const;

function download() {
  const csv = "customer_id,churn_probability\n" + sample.map(([i, p]) => `${i},${p}`).join("\n") + "\n# ILLUSTRATIVE ONLY - made-up scores, not model output\n";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "example_predictions_ILLUSTRATIVE.csv"; a.click();
}

function PredPage() {
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Step 5" title="Predictions" desc="Real churn-risk scores require the saved, trained Python pipeline. This page shows the output format only." />
      <div className="flex items-start gap-3 rounded-md border border-demo/40 bg-demo-soft p-4 text-sm text-demo-foreground">
        <Plug className="mt-0.5 h-4 w-4" /> No trained model is connected. Run the saved pipeline in Colab on the test CSV to produce real scores.
      </div>
      <Panel title="Example output" right={<DemoBadge label="Illustrative only · made-up scores" />}>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2">customer_id (kept aside, not a feature)</th><th>churn_probability</th></tr></thead>
          <tbody>{sample.map(([i, p]) => <tr key={i} className="border-b last:border-0"><td className="py-2 font-mono">{i}</td><td className="font-mono">{p.toFixed(2)}</td></tr>)}</tbody>
        </table>
        <p className="mt-3 text-xs text-muted-foreground">IDs are removed before the model sees the row, then re-attached so each score matches back to its customer.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={download}><Download className="h-4 w-4" /> Download example CSV</Button>
      </Panel>
    </div>
  );
}
