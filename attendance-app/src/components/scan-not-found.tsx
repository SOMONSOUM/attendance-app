import { CircleAlert, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ScanNotFound({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center">
        <Card className="w-full border-border bg-card p-6 text-center text-card-foreground shadow-sm">
          <div className="mx-auto grid size-14 place-items-center rounded-xl bg-secondary text-primary">
            <QrCode size={26} />
          </div>
          <div className="mt-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-semibold text-primary">
              <CircleAlert size={16} />
              QR unavailable
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-fg">
            {message}
          </p>
        </Card>
      </div>
    </main>
  );
}
