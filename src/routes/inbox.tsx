import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/scout/app-shell";
import { Button } from "@/components/ui/button";
import { useScout } from "@/lib/scout/store";

export const Route = createFileRoute("/inbox")({ component: InboxPage });

function InboxPage() {
  const inbound = useScout((s) => s.inbound);
  const leads = useScout((s) => s.leads);
  const mark = useScout((s) => s.markInboundRead);
  const select = useScout((s) => s.select);

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight">Odpovede</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">Čo prišlo na scout@. Klikni firmu a uvidíš e-mail.</p>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-subtle uppercase">
              <th className="px-4 py-2 font-medium">Od</th>
              <th className="px-4 py-2 font-medium">Firma</th>
              <th className="px-4 py-2 font-medium">Úryvok</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {inbound.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-sm text-muted">
                  Zatiaľ žiadna odpoveď. Keď niekto odpíše na scout@, uvidíš to tu.
                </td>
              </tr>
            )}
            {inbound.map((m) => {
              const lead = leads.find((l) => l.id === m.leadId);
              return (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-3">{m.from}</td>
                  <td className="px-4 py-3 font-medium">{lead?.domain ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{m.snippet}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        mark(m.id);
                        if (lead) select(lead.id);
                      }}
                    >
                      Otvoriť
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
