import {
  CalendarPlus,
  Download,
  QrCode,
  RefreshCw,
} from "lucide-react";
import {
  AdminShell,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  {
    label: "Active events",
    value: "24",
    change: "+12% vs last month",
    bars: [34, 46, 39, 58, 45, 64, 55],
  },
  {
    label: "QR scans",
    value: "8,492",
    change: "+8.3% vs last month",
    bars: [52, 36, 44, 60, 38, 48, 68],
  },
  {
    label: "Checked in",
    value: "6,318",
    change: "+5.1% vs last month",
    bars: [42, 54, 47, 61, 57, 70, 66],
  },
  {
    label: "Join rate",
    value: "74.4%",
    change: "-1.1% vs last month",
    bars: [68, 62, 57, 66, 52, 48, 55],
  },
];

const rows = [
  [
    "EVT-2406",
    "Khmer Tech Summit",
    "Open registration",
    "Today, 8:30 AM",
    "Live",
  ],
  ["EVT-2405", "Leadership Forum", "Pre-registered", "May 21, 2026", "Ready"],
  ["EVT-2404", "HR Onboarding", "Pre-registered", "May 24, 2026", "Draft"],
];

export function DashboardPageContent() {
  return (
    <AdminShell
      active="Dashboard"
      title="Good morning, Admin"
      description="Monitor QR scans, attendance performance, event health, and registration coverage."
      action={
        <Button>
          <CalendarPlus size={16} />
          Create event
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="rounded-lg">
              <CardContent className="p-4">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm font-medium">{metric.label}</p>
                  <span className="grid size-7 place-items-center rounded-md border border-border bg-background text-muted-fg">
                    <QrCode size={14} />
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-xs text-success">{metric.change}</p>
                  </div>
                  <MiniLine values={metric.bars} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attendance funnel</CardTitle>
              <Button variant="outline" className="h-8">
                <RefreshCw size={14} />
                Month
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid h-64 grid-cols-[42px_1fr] gap-4">
                <div className="flex flex-col justify-between py-2 text-xs text-muted-fg">
                  <span>5000</span>
                  <span>4000</span>
                  <span>3000</span>
                  <span>2000</span>
                  <span>1000</span>
                  <span>0</span>
                </div>
                <div className="flex items-end justify-between gap-4 border-l border-border pl-4">
                  {[
                    ["Invited", 86],
                    ["Registered", 72],
                    ["Scanned", 58],
                    ["Verified", 44],
                    ["Joined", 30],
                  ].map(([label, height]) => (
                    <div
                      key={label}
                      className="flex flex-1 flex-col items-center gap-3"
                    >
                      <div
                        className="w-full rounded-t-lg bg-primary shadow-soft"
                        style={{
                          height: `${height}%`,
                          backgroundImage:
                            "repeating-linear-gradient(135deg, rgba(255,255,255,.28) 0 2px, transparent 2px 6px)",
                        }}
                      />
                      <span className="text-xs text-muted-fg">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attendance mix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mx-auto mb-8 h-56 max-w-sm">
                <Bubble
                  className="left-6 top-12 size-28 bg-info-soft text-info"
                  label="32%"
                  text="Walk-in"
                />
                <Bubble
                  className="left-24 top-0 size-24 bg-warning-soft text-[#9a7a21]"
                  label="20%"
                  text="Manual"
                />
                <Bubble
                  className="right-4 top-10 size-40 bg-secondary text-primary"
                  label="48%"
                  text="QR verified"
                />
              </div>
              <div className="space-y-3 text-sm">
                <MixRow
                  color="bg-primary"
                  label="QR verified"
                  value="4.8K"
                  change="+2.3%"
                />
                <MixRow
                  color="bg-info"
                  label="Walk-in approved"
                  value="3.2K"
                  change="+0.5%"
                />
                <MixRow
                  color="bg-warning"
                  label="Manual registrations"
                  value="2.0K"
                  change="+1.1%"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <TableShell>
          <SectionToolbar title="Upcoming events">
            <Button variant="outline" className="h-8">
              <Download size={14} />
              Export
            </Button>
          </SectionToolbar>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted text-left text-xs text-muted-fg">
              <tr>
                <th className="px-4 py-3 font-medium">Event ID</th>
                <th className="px-4 py-3 font-medium">Event name</th>
                <th className="px-4 py-3 font-medium">Registration mode</th>
                <th className="px-4 py-3 font-medium">Schedule</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{row[0]}</td>
                  <td className="px-4 py-3">{row[1]}</td>
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
      </div>
    </AdminShell>
  );
}

function MiniLine({ values }: { values: number[] }) {
  const points = values
    .map(
      (value, index) =>
        `${(index / (values.length - 1)) * 96 + 2},${76 - value}`,
    )
    .join(" ");
  return (
    <svg width="96" height="54" viewBox="0 0 100 80" aria-hidden="true">
      <polyline
        fill="none"
        stroke="var(--success)"
        strokeWidth="3"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Bubble({
  className,
  label,
  text,
}: {
  className: string;
  label: string;
  text: string;
}) {
  return (
    <div
      className={`absolute grid place-items-center rounded-full text-center ${className}`}
    >
      <div>
        <p className="text-3xl font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted-fg">{text}</p>
      </div>
    </div>
  );
}

function MixRow({
  color,
  label,
  value,
  change,
}: {
  color: string;
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`size-2 rounded-full ${color}`} />
      <span className="flex-1 text-muted-fg">{label}</span>
      <span>{value}</span>
      <span className="text-xs text-success">{change}</span>
    </div>
  );
}
