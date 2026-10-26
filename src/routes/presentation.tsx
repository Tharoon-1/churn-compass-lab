import { createFileRoute } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, Panel } from "@/components/kit";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/presentation")({
  head: () => ({
    meta: [
      { title: "Presentation — ChurnLab" },
      { name: "description", content: "10-slide checklist for the challenge presentation." },
      { property: "og:title", content: "ChurnLab — Presentation" },
      { property: "og:description", content: "Track required slide content." },
    ],
  }),
  component: PresPage,
});

const slides = [
  "Team, track & summary", "Problem & motivation", "Dataset, EDA & preprocessing", "System diagram",
  "Core algorithm / planner", "Experiment log", "Evaluation", "Results", "Demo / predictions", "Failure modes & future work",
];

function PresPage() {
  const { checklist } = useStore();
  const done = slides.filter((s) => checklist[`s:${s}`]).length;
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Step 6" title="Presentation checklist" desc="Ten slides matching the required content. Progress saves in this browser." />
      <Panel title="Progress" right={<span className="font-mono text-sm">{done}/10</span>}>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${done * 10}%` }} /></div>
      </Panel>
      <div className="grid gap-2 md:grid-cols-2">
        {slides.map((s, i) => (
          <label key={s} className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:border-primary/50">
            <Checkbox checked={!!checklist[`s:${s}`]} onCheckedChange={() => actions.toggleCheck(`s:${s}`)} />
            <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-sm font-medium">{s}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
