import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Database, Workflow, FlaskConical, LineChart, Table2, Presentation, Menu, X, FlaskRound } from "lucide-react";
import { BUDGET, completedCount, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/dataset", label: "Dataset", icon: Database },
  { to: "/pipeline", label: "Pipeline", icon: Workflow },
  { to: "/experiments", label: "Experiments", icon: FlaskConical },
  { to: "/evaluation", label: "Evaluation", icon: LineChart },
  { to: "/predictions", label: "Predictions", icon: Table2 },
  { to: "/presentation", label: "Presentation", icon: Presentation },
] as const;

function SidebarBody({ onNav }: { onNav?: () => void }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { experiments } = useStore();
  const used = completedCount(experiments);
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <FlaskRound className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-accent-foreground">ChurnLab</p>
          <p className="font-mono text-[10px] uppercase tracking-wider opacity-70">Utkrishta 2026 · C1</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} onClick={onNav}
              className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
              <n.icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-md border border-sidebar-border p-3">
        <div className="flex justify-between text-xs"><span>Run budget</span><span className="font-mono">{used}/{BUDGET}</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sidebar-accent">
          <div className="h-full bg-sidebar-primary transition-all" style={{ width: `${(used / BUDGET) * 100}%` }} />
        </div>
        <p className="mt-2 text-[11px] opacity-70">Role 2 · Modeling & pipeline lead</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 lg:block"><SidebarBody /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64"><SidebarBody onNav={() => setOpen(false)} /></div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur">
          <button className="lg:hidden" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <p className="hidden truncate text-sm text-muted-foreground sm:block">Budget-constrained telecom churn prediction</p>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-demo/40 bg-demo-soft px-3 py-1 text-xs font-medium text-demo-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-demo" />
            Frontend demo • model not connected
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
