import { checkCompliance } from "./compliance";
import type { Lead } from "./types";

export function killCap(kill: boolean, sentToday: number, cap: number, countsAsSend: boolean) {
  if (kill) return { ok: false as const, error: "Odosielanie je vypnuté v Nastaveniach." };
  if (countsAsSend && sentToday >= cap) return { ok: false as const, error: "Dnes už neposielame viac (limit 35)." };
  return { ok: true as const };
}

export function lintOrBlock(lead: {
  country: Lead["country"];
  lang: Lead["lang"];
  subject: string;
  body: string;
  claims: Lead["claims"];
  viability: Lead["viability"];
}) {
  const rep = checkCompliance(lead);
  if (!rep.ok) {
    const first = rep.checks.find((c) => c.block && !c.pass);
    return { ok: false as const, error: first?.text ?? "Text e-mailu treba ešte upraviť.", rep };
  }
  return { ok: true as const, rep };
}
