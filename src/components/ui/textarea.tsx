import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-32 w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
