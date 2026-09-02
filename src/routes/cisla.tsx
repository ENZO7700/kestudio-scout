import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/scout/app-shell";
import { useScout } from "@/lib/scout/store";
import { computeStats, fmtPct } from "@/lib/scout/stats";
import { LANG_LABEL } from "@/lib/scout/types";

export const Route = createFileRoute("/cisla")({ component: CislaPage });

function CislaPage() {
  const leads = useScout((s) => s.leads);
  const mail = useScout((s) => s.mailLog);
  const s = computeStats(leads, mail);

  if (leads.length === 0 && mail.length === 0) {
    return (
      <AppShell>
        <h1 className="text-2xl font-medium tracking-tight">Čísla</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">Zatiaľ nie sú odoslané e-maily. Čísla sa doplnia po prvej schválenej správe.</p>
        <Link to="/audit" className="mt-6 inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg">
          Skontrolovať web
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight">Čísla</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">Čo ľudia otvárajú a na čo odpíšu. Z odoslaných správ, nie odhad.</p>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-xl border-collapse text-sm">
          <caption className="px-4 py-3 text-left text-sm font-medium">Ako firmy postupujú</caption>
          <thead>
            <tr className="border-y border-border text-left text-xs tracking-wide text-subtle uppercase">
              <th className="px-4 py-2 font-medium">Krok</th>
              <th className="px-4 py-2 text-right font-medium">Firiem</th>
            </tr>
          </thead>
          <tbody>
            {s.funnel.map((f) => (
              <tr key={f.id} className="border-t border-border">
                <td className="px-4 py-2">{f.label}</td>
                <td className="px-4 py-2 text-right font-mono">{f.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-xl border-collapse text-sm">
          <caption className="px-4 py-3 text-left text-sm font-medium">Ktoré predmety otvárajú</caption>
          <thead>
            <tr className="border-y border-border text-left text-xs tracking-wide text-subtle uppercase">
              <th className="px-4 py-2 font-medium">Predmet</th>
              <th className="px-4 py-2 text-right font-medium">Odoslané</th>
              <th className="px-4 py-2 text-right font-medium">Otvorili</th>
              <th className="px-4 py-2 text-right font-medium">Odpovedali</th>
            </tr>
          </thead>
          <tbody>
            {s.families.map((f) => (
              <tr key={f.family} className="border-t border-border">
                <td className="px-4 py-2">
                  {f.label}
                  {f.family === s.winnerFamily && <span className="ml-2 text-xs text-accent">víťaz</span>}
                </td>
                <td className="px-4 py-2 text-right font-mono">{f.sent}</td>
                <td className="px-4 py-2 text-right font-mono">{fmtPct(f.open)}</td>
                <td className="px-4 py-2 text-right font-mono">{fmtPct(f.reply)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-xl border-collapse text-sm">
          <caption className="px-4 py-3 text-left text-sm font-medium">Jazyk</caption>
          <thead>
            <tr className="border-y border-border text-left text-xs tracking-wide text-subtle uppercase">
              <th className="px-4 py-2 font-medium">Jazyk</th>
              <th className="px-4 py-2 text-right font-medium">Otvorili</th>
              <th className="px-4 py-2 text-right font-medium">Odpovedali</th>
            </tr>
          </thead>
          <tbody>
            {s.byLang.filter((r) => r.sent).map((r) => (
              <tr key={r.lang} className="border-t border-border">
                <td className="px-4 py-2">{LANG_LABEL[r.lang]}</td>
                <td className="px-4 py-2 text-right font-mono">{fmtPct(r.open)}</td>
                <td className="px-4 py-2 text-right font-mono">{fmtPct(r.reply)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
