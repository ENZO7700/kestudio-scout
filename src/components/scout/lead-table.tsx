import { Link } from "@tanstack/react-router";
import { useScout } from "@/lib/scout/store";
import { BAND_LABELS, STAGES, type Lead } from "@/lib/scout/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const bandTone = {
  apex: "danger",
  strong: "accent",
  watch: "warn",
  suppress: "ok",
} as const;

function Row({ lead }: { lead: Lead }) {
  const select = useScout((s) => s.select);
  const selected = useScout((s) => s.selectedId === lead.id);
  const claim = lead.claims.find((c) => c.allowed);

  return (
    <tr
      onClick={() => select(lead.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select(lead.id);
        }
      }}
      tabIndex={0}
      className={cn(
        "cursor-pointer border-t border-border outline-none hover:bg-elevated focus-visible:bg-elevated",
        selected && "bg-elevated",
      )}
    >
      <th scope="row" className="sticky left-0 bg-surface px-4 py-3 text-left font-medium hover:bg-elevated">
        <div className="tracking-tight">{lead.domain}</div>
        <div className="text-xs font-normal text-muted">{lead.accountName}</div>
      </th>
      <td className="hidden px-3 py-3 text-xs text-muted sm:table-cell">{lead.country}</td>
      <td className="px-3 py-3">
        <Badge tone={bandTone[lead.koiBand]}>{BAND_LABELS[lead.koiBand]}</Badge>
        <div className="mt-1 font-mono text-xs text-subtle">{lead.koi}</div>
      </td>
      <td className="hidden px-3 py-3 text-xs text-muted md:table-cell">
        {lead.deal.packLabel}
        <div className="font-mono">{lead.deal.monthly.toLocaleString("sk-SK")} €/mes</div>
      </td>
      <td className="px-3 py-3 text-right font-mono text-sm">
        {lead.evEur.toLocaleString("sk-SK")} €
        <div className="text-xs text-subtle">o {lead.deal.daysToPay} dní</div>
      </td>
      <td className="hidden max-w-sm px-4 py-3 text-xs text-muted lg:table-cell">
        <span className="line-clamp-2">{claim?.text ?? "—"}</span>
      </td>
    </tr>
  );
}

export function LeadTable() {
  const leads = useScout((s) => s.leads);

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-16 text-center">
        <p className="text-sm font-medium">Zatiaľ žiadna firma</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Otvor Web, vlož adresu e-shopu a Scout ju skontroluje naživo. E-mail ostane na tvoje schválenie.
        </p>
        <Link to="/audit" className="mt-4 inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg">
          Skontrolovať prvý web
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-xl border-collapse text-sm">
        <caption className="sr-only">Firmy podľa stavu, zoradené podľa očakávaného prínosu</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs tracking-wide text-subtle uppercase">
            <th className="sticky left-0 bg-surface px-4 py-2.5 font-medium">Firma</th>
            <th className="hidden px-3 py-2.5 font-medium sm:table-cell">Krajina</th>
            <th className="px-3 py-2.5 font-medium">Šanca</th>
            <th className="hidden px-3 py-2.5 font-medium md:table-cell">Balík</th>
            <th className="px-3 py-2.5 text-right font-medium">Prínos</th>
            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Čo sme videli na webe</th>
          </tr>
        </thead>
        {STAGES.map((col) => {
          const rows = leads.filter((l) => l.stage === col.id).sort((a, b) => b.evEur - a.evEur);
          if (!rows.length) return null;
          return (
            <tbody key={col.id}>
              <tr className="bg-elevated">
                <th colSpan={6} className="px-4 py-2 text-left text-xs font-medium tracking-wide text-muted uppercase">
                  {col.label}
                  <span className="ml-2 font-mono text-subtle">{rows.length}</span>
                </th>
              </tr>
              {rows.map((l) => (
                <Row key={l.id} lead={l} />
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
