import { CalendarPlus, MapPin, QrCode } from "lucide-react";
import {
  AdminShell,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EventsPage() {
  return (
    <AdminShell
      active="Events"
      title="Events"
      description="Create attendance events, generate QR codes, control registration mode, and set valid location radius."
      action={
        <Button>
          <CalendarPlus size={16} />
          Create event
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <TableShell>
          <SectionToolbar title="Event list">
            <Button variant="outline" className="h-8">
              <QrCode size={14} />
              Batch QR
            </Button>
          </SectionToolbar>
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-fg">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Radius</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Khmer Tech Summit",
                  "Open registration",
                  "Koh Pich Hall",
                  "120m",
                  "Live",
                ],
                [
                  "Leadership Forum",
                  "Pre-registered",
                  "Sofitel Ballroom",
                  "80m",
                  "Ready",
                ],
                [
                  "HR Onboarding",
                  "Pre-registered",
                  "HQ Floor 12",
                  "50m",
                  "Draft",
                ],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{row[0]}</td>
                  <td className="px-4 py-3 text-muted-fg">{row[1]}</td>
                  <td className="px-4 py-3 text-muted-fg">{row[2]}</td>
                  <td className="px-4 py-3 text-muted-fg">{row[3]}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={
                        row[4] === "Live"
                          ? "green"
                          : row[4] === "Ready"
                            ? "purple"
                            : "amber"
                      }
                    >
                      {row[4]}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>

        <Card>
          <CardHeader>
            <CardTitle>Quick event setup</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Event name" placeholder="Annual Forum 2026" />
            <Field label="Registration mode" placeholder="PRE_REGISTERED" />
            <Field label="Location name" placeholder="Main Hall" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" placeholder="11.5564" />
              <Field label="Longitude" placeholder="104.9282" />
            </div>
            <Field label="Valid radius" placeholder="100 meters" />
            <Button>
              <MapPin size={16} />
              Save and generate QR
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input placeholder={placeholder} />
    </div>
  );
}
