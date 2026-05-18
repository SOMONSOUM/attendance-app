import { Download, FileSpreadsheet, Upload } from "lucide-react";
import {
  AdminShell,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegistrationsPage() {
  return (
    <AdminShell
      active="Registrations"
      title="Registrations"
      description="Upload Excel files for pre-registered events and review guest records before attendance starts."
      action={
        <Button>
          <Upload size={16} />
          Upload Excel
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Excel template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid size-16 place-items-center rounded-lg bg-secondary text-primary">
              <FileSpreadsheet size={28} />
            </div>
            <p className="text-sm text-muted-fg">
              Required columns: Fullname English, Fullname Khmer, Gender,
              Position, Department.
            </p>
            <Button variant="outline">
              <Download size={16} />
              Download template
            </Button>
          </CardContent>
        </Card>

        <TableShell>
          <SectionToolbar title="Pre-registration imports" />
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-fg">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">File</th>
                <th className="px-4 py-3 font-medium">Rows</th>
                <th className="px-4 py-3 font-medium">Uploaded by</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Leadership Forum",
                  "leadership-guests.xlsx",
                  "850",
                  "Admin",
                  "Imported",
                ],
                [
                  "HR Onboarding",
                  "new-staff.xlsx",
                  "124",
                  "HR Manager",
                  "Validating",
                ],
                ["Partner Meetup", "partners.xlsx", "310", "Admin", "Imported"],
              ].map((row) => (
                <tr key={row[1]} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{row[0]}</td>
                  <td className="px-4 py-3 text-muted-fg">{row[1]}</td>
                  <td className="px-4 py-3">{row[2]}</td>
                  <td className="px-4 py-3 text-muted-fg">{row[3]}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={row[4] === "Imported" ? "green" : "blue"}>
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
