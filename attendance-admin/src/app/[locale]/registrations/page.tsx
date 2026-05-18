import { Download, FileSpreadsheet, Upload } from "lucide-react";
import {
  AdminShell,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
          <Table className="min-w-180">
            <TableHeader>
              <TableRow className="border-t-0">
                <TableHead>Event</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                <TableRow key={row[1]}>
                  <TableCell className="font-medium">{row[0]}</TableCell>
                  <TableCell className="text-muted-fg">{row[1]}</TableCell>
                  <TableCell>{row[2]}</TableCell>
                  <TableCell className="text-muted-fg">{row[3]}</TableCell>
                  <TableCell>
                    <StatusPill tone={row[4] === "Imported" ? "green" : "blue"}>
                      {row[4]}
                    </StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </div>
    </AdminShell>
  );
}
