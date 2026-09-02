import type { KoiBand, Lead } from "./types";

const WEIGHTS = {
  legal: 0.22,
  revenue: 0.22,
  tech: 0.16,
  eaa: 0.1,
  budget: 0.18,
  timing: 0.07,
  fit: 0.05,
} as const;

export function bandFor(koi: number): KoiBand {
  if (koi >= 80) return "apex";
  if (koi >= 60) return "strong";
  if (koi >= 40) return "watch";
  return "suppress";
}

export function computeKoi(dims: Lead["dims"]): { koi: number; band: KoiBand } {
  let num = 0;
  let den = 0;
  (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).forEach((k) => {
    const w = WEIGHTS[k];
    const c = Math.min(1, Math.max(0.4, dims[k].conf));
    const s = Math.min(1, Math.max(0, dims[k].score));
    num += w * s * c;
    den += w * c;
  });
  const koi = Math.round((100 * num) / (den || 1));
  return { koi, band: bandFor(koi) };
}
