export type Stage =
  | "new"
  | "review"
  | "approved"
  | "contacted"
  | "interest"
  | "call"
  | "won"
  | "lost"
  | "suppressed";

export type KoiBand = "apex" | "strong" | "watch" | "suppress";
export type Country = "SK" | "CZ" | "AT" | "DE" | "PL" | "HU";
export type Lang = "sk" | "cs" | "de" | "pl" | "hu";
export type ClaimType = "legal" | "consent" | "perf" | "a11y" | "revenue" | "stack";
export type SubjectFamily = "fakt" | "pomoc" | "cas";
export type VariantId = "A" | "B" | "C";
export type Pack = "start" | "rast" | "firma";

export type Dim = { score: number; conf: number };

export type Claim = {
  id: string;
  type: ClaimType;
  text: string;
  url: string;
  http?: number;
  confidence: number;
  allowed: boolean;
};

export type DealFlow = {
  pReply: number;
  pMeeting: number;
  pClose: number;
  acv: number;
  urgency: number;
  monthly: number;
  pack: Pack;
  packLabel: string;
  daysToPay: number;
  churn: number;
  churnBand: "low" | "mid" | "high";
  revenueEur: number;
  evEur: number;
  whyPay: string;
  whyChurn: string;
};

export type SubjectOption = { id: VariantId; family: SubjectFamily; text: string };

export type Lead = {
  id: string;
  domain: string;
  accountName: string;
  country: Country;
  lang: Lang;
  ico?: string;
  viability: "pass" | "fail";
  platform: string;
  segment: string;
  stage: Stage;
  contactEmail: string;
  sequenceStep: number;
  lcp: number;
  dims: Record<"legal" | "revenue" | "tech" | "eaa" | "budget" | "timing" | "fit", Dim>;
  claims: Claim[];
  explain: string[];
  unverified: string[];
  koi: number;
  koiBand: KoiBand;
  evEur: number;
  deal: DealFlow;
  subject: string;
  body: string;
  lintOk: boolean;
  revenueEur?: number;
  sentAt?: number;
  subjectOptions?: SubjectOption[];
  subjectPick?: VariantId;
  followStop?: boolean;
  followSnoozeUntil?: number;
};

export type MailSend = {
  id: string;
  domain: string;
  leadId: string;
  lang: Lang;
  koi: number;
  subject: string;
  family: SubjectFamily;
  bodyWords: number;
  sentAt: number;
  opened: boolean;
  clicked: boolean;
  replied: boolean;
  meeting: boolean;
  won: boolean;
  openedAt?: number;
  clickedAt?: number;
};

export type IntentClass =
  | "meeting_yes"
  | "interested_question"
  | "send_audit"
  | "reject_soft"
  | "reject_hard"
  | "ooo"
  | "bounce"
  | "human_unclear";

export type Inbound = {
  id: string;
  leadId: string;
  from: string;
  intent: IntentClass;
  confidence: number;
  snippet: string;
  at: number;
  read: boolean;
};

export const STAGES: { id: Stage; label: string }[] = [
  { id: "new", label: "Nové" },
  { id: "review", label: "Na schválenie" },
  { id: "approved", label: "Pripravené" },
  { id: "contacted", label: "Oslovené" },
  { id: "interest", label: "Majú záujem" },
  { id: "call", label: "Dohodnúť hovor" },
];

export const BAND_LABELS: Record<KoiBand, string> = {
  apex: "Top šanca",
  strong: "Dobrá šanca",
  watch: "Slabá šanca",
  suppress: "Neposielať",
};

export const FAMILY_LABELS: Record<SubjectFamily, string> = {
  fakt: "Konkrétny problém",
  pomoc: "Ponuka pomoci",
  cas: "Krátky hovor",
};

export const LANG_LABEL: Record<Lang, string> = {
  sk: "slovenčina",
  cs: "čeština",
  de: "nemčina",
  pl: "poľština",
  hu: "maďarčina",
};
