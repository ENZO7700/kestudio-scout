import type { Claim, Lang, SubjectFamily, SubjectOption } from "./types";

export const FAMILY_ORDER: SubjectFamily[] = ["fakt", "pomoc", "cas"];

export function threeSubjects(input: { domain: string; lang: Lang; lcp: number; claims: Claim[] }): SubjectOption[] {
  const legal = input.claims.find((c) => c.type === "legal");
  const fact =
    legal?.http === 404
      ? `Na ${input.domain} sa nenašli obchodné podmienky`
      : input.claims.find((c) => c.allowed)?.text ?? `Poznámka k webu ${input.domain}`;
  return [
    { id: "A", family: "fakt", text: fact.slice(0, 90) },
    { id: "B", family: "pomoc", text: `Krátky pohľad na web ${input.domain}` },
    { id: "C", family: "cas", text: `15 minút k ${input.domain} — má to zmysel?` },
  ];
}

export function familyOf(subject: string): SubjectFamily {
  const s = subject.toLowerCase();
  if (/15|minút|minut|minuten/.test(s)) return "cas";
  if (/pohľad|pohled|blick|rzut|pillantás/.test(s)) return "pomoc";
  return "fakt";
}
