import type { Claim, Country, DealFlow, Lead, Pack, Stage } from "./types";

const P_CLOSE: Record<string, number> = {
  "Pražiarne & bio": 0.38,
  "Šport e-shop": 0.42,
  "B2B stavebniny": 0.28,
  "B2B obaly": 0.32,
  "Móda / svetlá": 0.35,
  "Live audit": 0.3,
};

function packOf(rev: number): { pack: Pack; packLabel: string; monthly: number } {
  if (rev >= 500_000) return { pack: "firma", packLabel: "Veľká firma", monthly: 4000 };
  if (rev >= 180_000) return { pack: "rast", packLabel: "Rast", monthly: 1500 };
  return { pack: "start", packLabel: "Štart", monthly: 500 };
}

const STAGE_MULT: Partial<Record<Stage, number>> = {
  new: 0.55,
  review: 0.6,
  approved: 0.7,
  contacted: 0.85,
  interest: 1.15,
  call: 1.45,
  won: 1,
};

export function computeDeal(input: {
  koi: number;
  country: Country;
  segment: string;
  platform: string;
  revenueEur?: number;
  dims: Lead["dims"];
  claims: Claim[];
  lcp: number;
  stage: Stage;
}): DealFlow {
  const quality = input.koi / 100;
  const rev = input.revenueEur ?? Math.round(80_000 + input.dims.budget.score * 900_000);
  const { pack, packLabel, monthly } = packOf(rev);
  const acv = monthly * 12;
  let pReply = 0.035 + quality * 0.11;
  let pMeeting = 0.3 + input.dims.fit.score * 0.28;
  let pClose = (P_CLOSE[input.segment] ?? 0.3) * (0.75 + input.dims.budget.score * 0.4);
  let urgency = 1;
  const legal404 = input.claims.some((c) => c.type === "legal" && c.http === 404);
  if (legal404) urgency += 0.15;
  if (input.lcp >= 5) urgency += 0.06;
  urgency = Math.min(1.6, urgency);
  const stageM = STAGE_MULT[input.stage] ?? 0.6;
  const evEur = Math.round(quality * pReply * pMeeting * pClose * acv * urgency * stageM);
  let days = 45;
  if (input.country === "DE" || input.country === "AT") days += 8;
  if (pack === "firma") days += 10;
  if (legal404) days -= 12;
  days = Math.max(12, Math.min(90, days));
  let churn = 18;
  if (input.lcp >= 5) churn += 8;
  if (input.dims.budget.score < 0.55) churn += 8;
  churn = Math.min(62, Math.max(8, churn));
  const churnBand = churn >= 36 ? "high" : churn >= 22 ? "mid" : "low";
  return {
    pReply,
    pMeeting,
    pClose,
    acv,
    urgency,
    monthly: pack === "firma" ? 3950 : pack === "rast" ? Math.round(monthly * (0.6 + quality * 0.5)) : monthly,
    pack,
    packLabel,
    daysToPay: days,
    churn,
    churnBand,
    revenueEur: rev,
    evEur,
    whyPay: legal404 ? "Chýbajúce podmienky sa dajú opraviť rýchlo." : "Pomalý alebo ťažký web brzdí dopyty.",
    whyChurn: churnBand === "high" ? "Rozpočet je tesný, treba menší začiatok." : "Držia, ak uvidia merateľný nález.",
  };
}
