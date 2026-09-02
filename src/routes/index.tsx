import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/scout/app-shell";
import { DealStrip } from "@/components/scout/deal-strip";
import { KpiBar } from "@/components/scout/kpis";
import { LeadTable } from "@/components/scout/lead-table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Dnešné firmy</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Ostrá prevádzka. Žiadne ukážkové firmy. Pridaj web, schváľ e-mail, až potom ide von.
          </p>
        </div>
        <Button asChild>
          <Link to="/audit">Skontrolovať web</Link>
        </Button>
      </div>
      <KpiBar />
      <DealStrip />
      <div className="mt-5">
        <LeadTable />
      </div>
    </AppShell>
  );
}
