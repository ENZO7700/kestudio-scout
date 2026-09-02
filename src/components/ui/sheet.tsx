import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/70" />
      <Dialog.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-lg flex-col border-l border-border bg-surface shadow-xl",
          className,
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
export function SheetClose({ className }: { className?: string }) {
  return (
    <Dialog.Close className={cn("rounded-md p-2 text-muted hover:text-fg", className)} aria-label="Zavrieť">
      <X className="size-4" />
    </Dialog.Close>
  );
}
export const SheetTitle = Dialog.Title;
