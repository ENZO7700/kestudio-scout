import { useScout } from "@/lib/scout/store";

export function KpiBar() {
  const leads = useScout((s) => s.leads);
  const unread = useScout((s) => s.unreadCount);
  const pipeline = leads.filter((l) => !["lost", "suppressed", "won"].includes(l.stage));
  const review = pipeline.filter((l) => l.stage === "review").length;
  const ev = pipeline.reduce((a, l) => a + l.evEur, 0);
  const items = [
    { k: "V hre", v: String(pipeline.length) },
    { k: "Na schválenie", v: String(review) },
    { k: "Očakávaný prínos", v: `${ev.toLocaleString("sk-SK")} €` },
    { k: "Nové správy", v: String(unread) },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.k} className="bg-surface px-4 py-3">
          <div className="text-xs tracking-wide text-subtle uppercase">{it.k}</div>
          <div className="mt-1 font-mono text-xl tabular-nums">{it.v}</div>
        </div>
      ))}
    </div>
  );
}
