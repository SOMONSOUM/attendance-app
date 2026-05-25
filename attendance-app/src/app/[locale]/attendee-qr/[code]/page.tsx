import { BadgeCheck, QrCode } from "lucide-react";
import { Card } from "@/components/ui/card";

export default async function AttendeeQrPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <Card className="mx-auto grid max-w-md gap-4 p-5 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-md bg-secondary text-primary">
          <QrCode size={24} />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Personal check-in QR</h1>
          <p className="mt-2 text-sm text-muted-fg">
            Show this code to an admin when you arrive. The admin scan records
            your attendance.
          </p>
        </div>
        <div className="rounded-md border border-border bg-muted p-3 font-mono text-sm break-all">
          {code}
        </div>
        <p className="inline-flex items-center justify-center gap-2 text-sm font-medium text-success">
          <BadgeCheck size={16} />
          Registration saved
        </p>
      </Card>
    </main>
  );
}
