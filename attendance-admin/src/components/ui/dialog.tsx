import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Dialog({
  open,
  title,
  description,
  children,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            {description ? (
              <p className="mt-1 text-xs text-muted-fg">{description}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            className="size-8 shrink-0 px-0"
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
          >
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
