import { useScout } from "@/lib/scout/store";

export function DealStrip() {
  const select = useScout((s) => s.select);
  const leads = useScout((s) => s.leads);
  const top = [...leads]
    .filter((l) => !["lost", "suppressed", "won"].includes(l.stage))
    .sort((a, b) => b.evEur - a.evEur)
    .slice(0, 3);
  if (!top.length) return null;
  return (
    <section className="mt-4 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-medium">Najprv tieto tri</h2>
      <p className="mt-1 text-xs text-muted">Najväčší očakávaný prínos — otvor riadok a schváľ e-mail.</p>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {top.map((l, i) => (
          <button
            key={l.id}
            type="button"
            onClick={() => select(l.id)}
            className="rounded-md border border-border bg-elevated p-3 text-left hover:border-muted"
          >
            <div className="text-xs text-subtle">{i + 1}. na rade</div>
            <div className="mt-1 text-sm font-medium">{l.domain}</div>
            <div className="mt-1 text-xs text-muted">
              {l.deal.packLabel} · {l.evEur.toLocaleString("sk-SK")} € · o {l.deal.daysToPay} dní
            </div>
          </button>
        ))}
      </ol>
    </section>
  );
}
