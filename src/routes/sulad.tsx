import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/scout/app-shell";
import { useScout } from "@/lib/scout/store";
import { checkCompliance } from "@/lib/scout/compliance";

export const Route = createFileRoute("/sulad")({ component: SuladPage });

function SuladPage() {
  const leads = useScout((s) => s.leads);
  const select = useScout((s) => s.select);
  const waiting = leads.filter((l) => l.stage === "review" || l.stage === "approved");

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight">Súlad</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        E-mail nejde von bez stop, dôvodu, mena keSTUDIO a dôkazu z webu.
      </p>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-xl border-collapse text-sm">
          <caption className="px-4 py-3 text-left text-sm font-medium">Čakajúce texty</caption>
          <thead>
            <tr className="border-y border-border text-left text-xs tracking-wide text-subtle uppercase">
              <th className="px-4 py-2 font-medium">Firma</th>
              <th className="px-4 py-2 font-medium">Stop</th>
              <th className="px-4 py-2 font-medium">Dôkaz</th>
              <th className="px-4 py-2 font-medium">Meno</th>
            </tr>
          </thead>
          <tbody>
            {waiting.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-sm text-muted">
                  Žiadny text na schválenie. Pridaj firmu vo Webe.
                </td>
              </tr>
            )}
            {waiting.map((l) => {
              const r = checkCompliance(l);
              const cell = (id: string) => r.checks.find((c) => c.id === id)?.pass;
              return (
                <tr
                  key={l.id}
                  className="cursor-pointer border-t border-border hover:bg-elevated"
                  onClick={() => select(l.id)}
                >
                  <td className="px-4 py-3 font-medium">{l.domain}</td>
                  <td className="px-4 py-3">{cell("optout") ? "áno" : "chýba"}</td>
                  <td className="px-4 py-3">{cell("fact") ? "áno" : "chýba"}</td>
                  <td className="px-4 py-3">{cell("identity") ? "áno" : "chýba"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
