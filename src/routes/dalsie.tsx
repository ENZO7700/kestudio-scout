import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/scout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtWhen, KIND_LABEL, planAll, type FollowPlan } from "@/lib/scout/follow";
import { useScout } from "@/lib/scout/store";

export const Route = createFileRoute("/dalsie")({ component: DalsiePage });

const RULES: { kind: FollowPlan["kind"]; wait: string; what: string }[] = [
  { kind: "no_reply", wait: "3–5 dní", what: "Krátke zopakovanie nálezu" },
  { kind: "open_no_click", wait: "7 dní", what: "Tri body + 15 minút" },
  { kind: "click_no_reply", wait: "5 dní", what: "Ako to robíme u podobných" },
  { kind: "soft_no", wait: "14 dní", what: "Menší začiatok, potom ticho" },
  { kind: "hard_no", wait: "—", what: "Už nepísať" },
];

function DalsiePage() {
  const leads = useScout((s) => s.leads);
  const mail = useScout((s) => s.mailLog);
  const inbound = useScout((s) => s.inbound);
  const sendFollow = useScout((s) => s.sendFollow);
  const skipFollow = useScout((s) => s.skipFollow);
  const stopFollow = useScout((s) => s.stopFollow);
  const { due, later } = planAll(leads, mail, inbound);

  const onSend = (id: string) => {
    const r = sendFollow(id);
    if (!r.ok) toast.error(r.error);
    else toast.success("Ďalší e-mail ide zo scout@.");
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight">Ďalší e-mail</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">Väčšina firiem na prvý e-mail neodpovie. Ďalší ide v hodinu, keď dávali pozor.</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-xl border-collapse text-left text-sm">
          <caption className="px-5 py-3 text-left text-sm font-medium">Kedy čo poslať</caption>
          <thead>
            <tr className="border-y border-border text-xs tracking-wide text-subtle uppercase">
              <th className="px-5 py-2 font-medium">Čo urobili</th>
              <th className="px-5 py-2 font-medium">Čakať</th>
              <th className="px-5 py-2 font-medium">Ďalší e-mail</th>
            </tr>
          </thead>
          <tbody>
            {RULES.map((r) => (
              <tr key={r.kind} className="border-t border-border">
                <td className="px-5 py-3 font-medium">{KIND_LABEL[r.kind]}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted">{r.wait}</td>
                <td className="px-5 py-3 text-muted">{r.what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-xl border-collapse text-sm">
          <caption className="px-5 py-3 text-left text-sm font-medium">Fronta</caption>
          <thead>
            <tr className="border-y border-border text-left text-xs tracking-wide text-subtle uppercase">
              <th className="px-5 py-2 font-medium">Firma</th>
              <th className="px-5 py-2 font-medium">Stav</th>
              <th className="px-5 py-2 font-medium">Kedy</th>
              <th className="px-5 py-2 font-medium">Akcia</th>
            </tr>
          </thead>
          <tbody>
            {[...due, ...later].map((p) => (
              <tr key={p.leadId} className="border-t border-border">
                <td className="px-5 py-3 font-medium">{p.domain}</td>
                <td className="px-5 py-3">
                  <Badge tone={p.dueNow ? "warn" : "muted"}>{p.label}</Badge>
                </td>
                <td className="px-5 py-3 text-xs text-muted">{fmtWhen(p.dueAt)}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    {p.channel === "email" && (
                      <Button type="button" size="sm" onClick={() => onSend(p.leadId)}>
                        Poslať
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" onClick={() => skipFollow(p.leadId)}>
                      O 3 dni
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => stopFollow(p.leadId)}>
                      Stop
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {due.length + later.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-sm text-muted">
                  Nikto nečaká na ďalší e-mail.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
