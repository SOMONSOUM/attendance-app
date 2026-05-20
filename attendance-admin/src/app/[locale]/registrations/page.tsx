"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileSpreadsheet,
  ListFilter,
  Upload,
  Users,
} from "lucide-react";
import {
  AdminShell,
  EmptyState,
  SectionToolbar,
  StatusPill,
  TableShell,
} from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getRegistrationTemplate,
  listRegistrationImports,
  uploadRegistrationImport,
} from "@/lib/admin-data";

const importKeys = {
  all: ["registration-imports"] as const,
};

export default function RegistrationsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const importsQuery = useQuery({
    queryKey: importKeys.all,
    queryFn: listRegistrationImports,
  });
  const templateMutation = useMutation({
    mutationFn: getRegistrationTemplate,
    onSuccess: (template) =>
      downloadBase64(
        template.contentBase64,
        template.filename,
        template.mimeType,
      ),
  });
  const uploadMutation = useMutation({
    mutationFn: uploadRegistrationImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.all });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });
  const imports = importsQuery.data ?? [];
  const totalRows = imports.reduce((sum, item) => sum + item.rowCount, 0);

  return (
    <AdminShell
      active="Registrations"
      title="Registrations"
      description="Upload Excel files once, review attendee imports, and reuse them when creating pre-registered events."
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <ListFilter size={16} />
            Filter
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            Upload Excel
          </Button>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadMutation.mutate(file);
            }}
          />
        </div>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-5">
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
              <Button
                variant="outline"
                disabled={templateMutation.isPending}
                onClick={() => templateMutation.mutate()}
              >
                <Download size={16} />
                Download template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid grid-cols-2 gap-3 p-4">
              <SummaryTile label="Files" value={imports.length} />
              <SummaryTile label="Attendees" value={totalRows} icon={Users} />
            </CardContent>
          </Card>
        </div>

        <TableShell>
          <SectionToolbar title="Pre-registration imports">
            <span className="text-sm text-muted-fg">
              {uploadMutation.isPending
                ? "Uploading..."
                : `${imports.length} files`}
            </span>
          </SectionToolbar>
          {importsQuery.isLoading ? (
            <div className="p-5 text-sm text-muted-fg">Loading imports...</div>
          ) : imports.length ? (
            <Table className="min-w-180">
              <TableHeader>
                <TableRow className="border-t-0">
                  <TableHead>File</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Uploaded by</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{item.originalName}</p>
                        <p className="text-xs text-muted-fg">{item.fileName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.rowCount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-fg">
                      {item.uploadedBy?.fullNameEn ?? "System"}
                    </TableCell>
                    <TableCell className="text-muted-fg">
                      {new Date(item.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        tone={item.status === "IMPORTED" ? "green" : "blue"}
                      >
                        {titleCase(item.status)}
                      </StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No Excel imports yet"
              text="Upload a pre-registration file and it will be available when organizers create events."
            />
          )}
        </TableShell>
      </div>
    </AdminShell>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon = FileSpreadsheet,
}: {
  label: string;
  value: number;
  icon?: typeof FileSpreadsheet;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-fg">{label}</p>
        <Icon size={15} className="text-primary" />
      </div>
      <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}

function downloadBase64(contentBase64: string, filename: string, mimeType: string) {
  const bytes = Uint8Array.from(atob(contentBase64), (char) =>
    char.charCodeAt(0),
  );
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
