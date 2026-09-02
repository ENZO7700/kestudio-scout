import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/scout/app-shell";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScout } from "@/lib/scout/store";

export const Route = createFileRoute("/ops")({ component: OpsPage });

function OpsPage() {
  const kill = useScout((s) => s.killSwitch);
  const setKill = useScout((s) => s.setKill);
  const sent = useScout((s) => s.sentToday);
  const cap = useScout((s) => s.dailyCap);
  const log = useScout((s) => s.nightLog);
  const reset = useScout((s) => s.reset);

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight">Nastavenia</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Ostrá prevádzka. Firmy a e-maily ostávajú v tomto prehliadači. E-maily idú zo scout@, nie z info@.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">Odosielanie e-mailov</h2>
              <p className="text-xs text-muted">Vypni, keď nemá ísť von žiadny e-mail.</p>
            </div>
            <Switch checked={!kill} onCheckedChange={(on) => setKill(!on)} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-subtle">Schránka</dt>
              <dd className="text-xs">scout@kestudio.sk</dd>
            </div>
            <div>
              <dt className="text-subtle">Odoslané dnes</dt>
              <dd className="font-mono tabular-nums">
                {sent} / {cap}
              </dd>
            </div>
          </dl>
          {kill && (
            <p className="mt-3">
              <Badge tone="danger">stop</Badge>
            </p>
          )}
        </section>
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-medium">Prehľad</h2>
          <ol className="mt-3 space-y-1 text-xs text-muted">
            {log.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/audit">Pridať firmu z webu</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                toast.success("Prehľad je prázdny.");
              }}
            >
              Vymazať všetky firmy
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
