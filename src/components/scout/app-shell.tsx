import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useScout } from "@/lib/scout/store";
import { Badge } from "@/components/ui/badge";
import { LeadDrawer } from "./lead-drawer";

const NAV = [
  { to: "/", label: "Firmy" },
  { to: "/audit", label: "Web" },
  { to: "/cisla", label: "Čísla" },
  { to: "/dalsie", label: "Ďalej" },
  { to: "/sulad", label: "Súlad" },
  { to: "/inbox", label: "Odpovede" },
  { to: "/ops", label: "Nastavenia" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const killSwitch = useScout((s) => s.killSwitch);
  const unread = useScout((s) => s.unreadCount);
  const sentToday = useScout((s) => s.sentToday);
  const dailyCap = useScout((s) => s.dailyCap);
  const hydrate = useScout((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
          <Link to="/" className="flex shrink-0 items-baseline gap-2">
            <span className="font-mono text-xs tracking-widest text-accent">KESTUDIO</span>
            <span className="text-sm font-medium tracking-tight">Scout OS</span>
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-9 shrink-0 items-center rounded-sm px-3 text-sm",
                  path === item.to ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                {item.label}
                {item.to === "/inbox" && unread > 0 && (
                  <span className="ml-1 font-mono text-xs text-accent">{unread}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden font-mono text-xs tabular-nums text-muted sm:inline">
              {sentToday}/{dailyCap} dnes
            </span>
            {killSwitch ? <Badge tone="danger">stop</Badge> : <Badge tone="ok">schránka OK</Badge>}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 pb-24 md:pb-5">{children}</main>
      <LeadDrawer />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden">
        <div className="flex overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 min-w-14 flex-1 flex-col items-center justify-center px-1 text-xs",
                path === item.to ? "text-accent" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
