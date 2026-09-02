import { toast } from "sonner";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useScout } from "@/lib/scout/store";
import { BAND_LABELS, FAMILY_LABELS, LANG_LABEL } from "@/lib/scout/types";
import { checkCompliance } from "@/lib/scout/compliance";

export function LeadDrawer() {
  const selectedId = useScout((s) => s.selectedId);
  const lead = useScout((s) => s.leads.find((l) => l.id === selectedId) ?? null);
  const select = useScout((s) => s.select);
  const updateLead = useScout((s) => s.updateLead);
  const pickSubject = useScout((s) => s.pickSubject);
  const approve = useScout((s) => s.approve);
  const send = useScout((s) => s.send);
  const reject = useScout((s) => s.reject);
  if (!lead) return null;
  const lint = checkCompliance(lead);

  const onApprove = () => {
    const r = approve(lead.id);
    if (!r.ok) toast.error(r.error);
    else toast.success("Schválené. Môžeš poslať.");
  };
  const onSend = () => {
    const r = send(lead.id);
    if (!r.ok) toast.error(r.error);
    else toast.success("E-mail ide zo scout@.");
  };

  return (
    <Sheet open onOpenChange={(o) => !o && select(null)}>
      <SheetContent>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <SheetTitle className="text-base">{lead.domain}</SheetTitle>
          <SheetClose />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={lead.koiBand === "apex" ? "danger" : "accent"}>{BAND_LABELS[lead.koiBand]} {lead.koi}</Badge>
              <Badge>{lead.deal.packLabel}</Badge>
              <Badge tone="muted">{LANG_LABEL[lead.lang]}</Badge>
            </div>
            <p className="text-sm text-muted">
              {lead.deal.packLabel} · {lead.deal.monthly.toLocaleString("sk-SK")} €/mes · prínos {lead.evEur.toLocaleString("sk-SK")} € · o {lead.deal.daysToPay} dní
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted">
              {lead.explain.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <div className="rounded-md border border-border bg-bg p-3">
              <div className="text-xs tracking-wide text-subtle uppercase">Súlad</div>
              <ul className="mt-2 space-y-1 text-xs">
                {lint.checks.map((c) => (
                  <li key={c.id} className={c.pass ? "text-ok" : "text-danger"}>
                    {c.pass ? "OK" : "Blok"} · {c.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <div className="text-xs tracking-wide text-subtle uppercase">Návrh e-mailu</div>
              <Input value={lead.subject} onChange={(e) => updateLead(lead.id, { subject: e.target.value })} aria-label="Predmet" />
              {lead.subjectOptions && (
                <div className="flex flex-wrap gap-2">
                  {lead.subjectOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => pickSubject(lead.id, opt.id)}
                      className={
                        lead.subjectPick === opt.id
                          ? "rounded-md border border-accent bg-elevated px-2 py-1 text-left text-xs"
                          : "rounded-md border border-border px-2 py-1 text-left text-xs text-muted"
                      }
                    >
                      {opt.id} {FAMILY_LABELS[opt.family]}
                      <span className="mt-0.5 block max-w-56 truncate text-fg">{opt.text}</span>
                    </button>
                  ))}
                </div>
              )}
              <Textarea value={lead.body} onChange={(e) => updateLead(lead.id, { body: e.target.value })} aria-label="Text" />
              <p className="text-xs text-subtle">Komu: {lead.contactEmail} · Od: scout@kestudio.sk</p>
            </div>
            <div className="flex flex-wrap gap-2 pb-8">
              {(lead.stage === "review" || lead.stage === "new") && (
                <Button type="button" onClick={onApprove}>
                  Schváliť e-mail
                </Button>
              )}
              {lead.stage === "approved" && (
                <Button type="button" onClick={onSend}>
                  Poslať e-mail
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => reject(lead.id, "Nehodí sa")}>
                Neposielať
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
