import { Download, LocateFixed } from "lucide-react";
import {
  AdminShell,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";

export default function AttendancePage() {
  return (
    <AdminShell
      active="Attendance"
      title="Attendance"
      description="Audit check-ins, location distance, scan time, and attendee status for every event."
      action={
        <Button>
          <Download size={16} />
          Export logs
        </Button>
      }
    >
      <TableShell>
        <SectionToolbar title="Live attendance logs">
          <Button variant="outline" className="h-8">
            <LocateFixed size={14} />
            Validate range
          </Button>
        </SectionToolbar>
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs text-muted-fg">
            <tr>
              <th className="px-4 py-3 font-medium">Attendee</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Distance</th>
              <th className="px-4 py-3 font-medium">Check-in time</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Sok Dara",
                "Khmer Tech Summit",
                "Engineering",
                "24m",
                "08:42",
                "Joined",
              ],
              [
                "Chan Sopheak",
                "Leadership Forum",
                "Finance",
                "61m",
                "09:04",
                "Joined",
              ],
              ["Emily Kong", "Partner Meetup", "Sales", "132m", "Review"],
            ].map((row) => (
              <tr
                key={`${row[0]}-${row[1]}`}
                className="border-t border-border"
              >
                <td className="px-4 py-3 font-medium">{row[0]}</td>
                <td className="px-4 py-3">{row[1]}</td>
                <td className="px-4 py-3 text-muted-fg">{row[2]}</td>
                <td className="px-4 py-3 text-muted-fg">{row[3]}</td>
                <td className="px-4 py-3 text-muted-fg">{row[4]}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={row[5] === "Joined" ? "green" : "amber"}>
                    {row[5]}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </AdminShell>
  );
}
