import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.ComponentProps<"span"> & { tone?: "muted" | "accent" | "ok" | "warn" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide",
        tone === "muted" && "bg-elevated text-muted",
        tone === "accent" && "bg-accent/15 text-accent",
        tone === "ok" && "bg-ok/15 text-ok",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "danger" && "bg-danger/15 text-danger",
        className,
      )}
      {...props}
    />
  );
}
