import { lookup } from "node:dns/promises";

export function isBlockedHost(host: string) {
  const h = host.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!h) return true;
  if (h === "localhost" || h === "0.0.0.0" || h === "::" || h === "::1" || h === "https://example.net/id/garnet") return true;
  if (h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localhost")) return true;
  if (h === "metadata.google.internal" || h.endsWith(".metadata.google.internal")) return true;
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  if (h.startsWith("::ffff:")) return isBlockedHost(h.slice(7));
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 127 || a === 0 || a === 10) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function checkUrlShape(raw: string, opts?: { httpsOnly?: boolean }) {
  const input = raw.trim();
  if (!input) return { ok: false as const, error: "Táto adresa nie je v poriadku." };
  if (/^file:/i.test(input) || /^javascript:/i.test(input) || /^data:/i.test(input)) {
    return { ok: false as const, error: "Len bežná webová adresa." };
  }
  let url: URL;
  try {
    url = new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return { ok: false as const, error: "Táto adresa nie je v poriadku." };
  }
  if (opts?.httpsOnly && url.protocol !== "https:") {
    return { ok: false as const, error: "Odkaz musí začínať https." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false as const, error: "Len bežná webová adresa." };
  }
  if (url.username || url.password) {
    return { ok: false as const, error: "Adresa nesmie obsahovať prihlásenie." };
  }
  if (isBlockedHost(url.hostname)) {
    return { ok: false as const, error: "Túto adresu nepovoľujeme." };
  }
  return { ok: true as const, url };
}

export async function assertSafeUrl(raw: string, opts?: { httpsOnly?: boolean }) {
  const shape = checkUrlShape(raw, opts);
  if (!shape.ok) return shape;
  try {
    const { address } = await lookup(shape.url.hostname);
    if (isBlockedHost(address)) return { ok: false as const, error: "Túto adresu nepovoľujeme." };
  } catch {
    /* DNS zlyhá aj tak pri fetchi */
  }
  return shape;
}
