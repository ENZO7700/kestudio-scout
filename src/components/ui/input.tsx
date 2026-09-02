import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-bg px-3 text-sm outline-none focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
