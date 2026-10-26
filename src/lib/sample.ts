export type Row = Record<string, string>;

function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}

/** Synthetic, illustrative telecom rows. Not real customers. */
export function syntheticRows(n = 400): Row[] {
  const r = rng(42);
  const contracts = ["Month-to-month", "One year", "Two year"];
  const internet = ["DSL", "Fiber optic", "No"];
  const pay = ["Electronic check", "Mailed check", "Bank transfer", "Credit card"];
  return Array.from({ length: n }, (_, i) => {
    const tenure = Math.floor(r() * 72);
    const contract = contracts[Math.floor(r() * 3)];
    const monthly = +(20 + r() * 100).toFixed(2);
    const p = 0.1 + (contract === "Month-to-month" ? 0.3 : 0) + (tenure < 12 ? 0.2 : 0) + (monthly > 80 ? 0.1 : 0);
    return {
      customer_id: `CUST-${String(10000 + i)}`,
      gender: r() > 0.5 ? "Female" : "Male",
      senior_citizen: r() > 0.84 ? "1" : "0",
      tenure_months: String(tenure),
      contract,
      internet_service: internet[Math.floor(r() * 3)],
      payment_method: pay[Math.floor(r() * 4)],
      monthly_charges: String(monthly),
      total_charges: r() < 0.03 ? "" : String(+(monthly * Math.max(tenure, 1)).toFixed(2)),
      tech_support: r() < 0.05 ? "" : r() > 0.6 ? "Yes" : "No",
      churn: r() < p ? "Yes" : "No",
    };
  });
}

export type ColType = "numeric" | "category";
export interface ColInfo { name: string; type: ColType; missing: number; unique: number; flags: string[] }

export function profile(rows: Row[], columns: string[]): ColInfo[] {
  return columns.map((c) => {
    const vals = rows.map((r) => (r[c] ?? "").trim());
    const present = vals.filter((v) => v !== "");
    const numeric = present.length > 0 && present.every((v) => !isNaN(Number(v)));
    const unique = new Set(present).size;
    const flags: string[] = [];
    const lc = c.toLowerCase();
    if (/(^id$|_id$|^id_|customer.?id|uuid)/.test(lc) || (unique === rows.length && !numeric)) flags.push("Possible ID");
    if (/churn|target|label|exited/.test(lc)) flags.push("Possible target");
    if (/cancel|termination|exit_date|churn_date|retention_offer/.test(lc)) flags.push("Leakage review");
    return { name: c, type: numeric && unique > 2 ? "numeric" : "category", missing: vals.length - present.length, unique, flags };
  });
}
