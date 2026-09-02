import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/scout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inspectWebsite } from "@/lib/scout/inspect";
import { useScout } from "@/lib/scout/store";

export const Route = createFileRoute("/audit")({ component: AuditPage });

function AuditPage() {
  const upsert = useScout((s) => s.upsertLead);
  const select = useScout((s) => s.select);
  const [url, setUrl] = useState("https://");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    const r = await inspectWebsite({ data: { url } });
    setBusy(false);
    if (!r.ok) toast.error(r.error);
    else {
      upsert(r.lead);
      select(r.lead.id);
      toast.success(`${r.lead.domain} je v tabuľke na schválenie.`);
    }
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight">Web</h1>
      <p className="mt-1 max-w-xl text-sm text-muted">
        Otvoríme stránku naživo. Ak chýbajú podmienky, pripravíme e-mail. Von nejde, kým ho neschváliš.
      </p>
      <form
        className="mt-6 flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="firma.sk" aria-label="Adresa webu" />
        <Button type="submit" disabled={busy}>
          {busy ? "Kontrolujem…" : "Skontrolovať"}
        </Button>
      </form>
    </AppShell>
  );
}
