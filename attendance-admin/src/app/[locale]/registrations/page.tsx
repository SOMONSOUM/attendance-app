"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileSpreadsheet,
  ListFilter,
  Trash2,
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
import { PaginationFooter } from "@/components/admin/pagination-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteRegistrationImport,
  downloadRegistrationImport,
  getRegistrationTemplate,
  listMeetingRegistrationImports,
  listRegistrationImports,
  uploadMeetingRegistrationImport,
  uploadRegistrationImport,
  type RegistrationImportRecord,
} from "@/lib/admin-data";

const importKeys = {
  all: ["registration-imports"] as const,
};

const ALL = "ALL";
const PAGE_SIZE = 5;

export default function RegistrationsPage() {
  const t = useTranslations("registrations");
  const common = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meetingFileInputRef = useRef<HTMLInputElement>(null);
  const [targetFilter, setTargetFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] =
    useState<RegistrationImportRecord | null>(null);
  const queryClient = useQueryClient();
  const importsQuery = useQuery({
    queryKey: [...importKeys.all, targetFilter, page],
    queryFn: () =>
      listRegistrationImports({
        page,
        pageSize: PAGE_SIZE,
        target:
          targetFilter === ALL
            ? undefined
            : (targetFilter as "EVENT" | "MEETING"),
      }),
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
  const meetingUploadMutation = useMutation({
    mutationFn: uploadMeetingRegistrationImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.all });
      if (meetingFileInputRef.current) meetingFileInputRef.current.value = "";
    },
  });
  const downloadMutation = useMutation({
    mutationFn: downloadRegistrationImport,
    onSuccess: (file) =>
      downloadBase64(file.contentBase64, file.filename, file.mimeType),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteRegistrationImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: importKeys.all });
      setDeleteTarget(null);
    },
  });
  const allImports = importsQuery.data?.items ?? [];
  const pageImports = allImports;
  const summaryQuery = useQuery({
    queryKey: [...importKeys.all, "summary"],
    queryFn: () => listRegistrationImports({ pageSize: 100 }),
  });
  const summaryImports = summaryQuery.data?.items ?? [];
  const imports = summaryImports.filter((item) => item.target === "EVENT");
  const meetingImports = summaryImports.filter((item) => item.target === "MEETING");
  const eventRows = imports.reduce((sum, item) => sum + item.rowCount, 0);
  const meetingRows = meetingImports.reduce((sum, item) => sum + item.rowCount, 0);

  function changeTargetFilter(value: string) {
    setTargetFilter(value);
    setPage(1);
  }

  return (
    <AdminShell
      active="Registrations"
      title={t("title")}
      description={t("description")}
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <ListFilter size={16} />
            {common("filter")}
          </Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            {t("eventExcel")}
          </Button>
          <Button onClick={() => meetingFileInputRef.current?.click()}>
            <Upload size={16} />
            {t("meetingExcel")}
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
          <input
            ref={meetingFileInputRef}
            className="hidden"
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) meetingUploadMutation.mutate(file);
            }}
          />
        </div>
      }
    >
      <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>{t("excelTemplates")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-start gap-3 rounded-md border border-border p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                  <FileSpreadsheet size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t("eventAttendees")}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-fg">
                    {t("templateColumns")}
                  </p>
                  <Button
                    className="mt-3 h-8"
                    variant="outline"
                    disabled={templateMutation.isPending}
                    onClick={() => templateMutation.mutate()}
                  >
                    <Download size={14} />
                    {t("eventTemplate")}
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-border p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                  <FileSpreadsheet size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    {t("meetingParticipants")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-fg">
                    {t("templateColumns")}
                  </p>
                  <Button
                    className="mt-3 h-8"
                    variant="outline"
                    disabled={templateMutation.isPending}
                    onClick={() => templateMutation.mutate()}
                  >
                    <Download size={14} />
                    {t("meetingTemplate")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid grid-cols-2 gap-3 p-4">
              <SummaryTile label={t("eventFiles")} value={imports.length} />
              <SummaryTile label={t("eventAttendees")} value={eventRows} icon={Users} />
              <SummaryTile label={t("meetingFiles")} value={meetingImports.length} />
              <SummaryTile
                label={t("meetingParticipants")}
                value={meetingRows}
                icon={Users}
              />
            </CardContent>
          </Card>
        </div>

        <TableShell>
          <SectionToolbar title={t("importsTitle")}>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                className="h-8 w-36"
                value={targetFilter}
                onChange={(event) => changeTargetFilter(event.target.value)}
              >
                <option value={ALL}>{t("allTypes")}</option>
                <option value="EVENT">{common("events")}</option>
                <option value="MEETING">{common("meetings")}</option>
              </Select>
              <span className="text-sm text-muted-fg">
                {uploadMutation.isPending || meetingUploadMutation.isPending
                  ? t("uploading")
                  : t("fileCount", { count: allImports.length })}
              </span>
            </div>
          </SectionToolbar>
          {importsQuery.isLoading ? (
            <div className="p-5 text-sm text-muted-fg">{t("loading")}</div>
          ) : allImports.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-t-0">
                    <TableHead>{t("file")}</TableHead>
                    <TableHead>{common("type")}</TableHead>
                    <TableHead>{t("rows")}</TableHead>
                    <TableHead>{t("uploadedBy")}</TableHead>
                    <TableHead>{t("uploaded")}</TableHead>
                    <TableHead>{common("status")}</TableHead>
                    <TableHead className="text-right">{common("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageImports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-3 font-medium">
                        <div>
                          <p>{item.originalName}</p>
                          <p className="text-xs text-muted-fg">{item.fileName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusPill tone={item.target === "MEETING" ? "purple" : "blue"}>
                          {item.target === "MEETING" ? common("meeting") : common("event")}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="py-3">{item.rowCount.toLocaleString()}</TableCell>
                      <TableCell className="py-3 text-muted-fg">
                        {item.uploadedBy?.fullNameEn ?? common("system")}
                      </TableCell>
                      <TableCell className="py-3 text-muted-fg">
                        {new Date(item.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusPill
                          tone={item.status === "IMPORTED" ? "green" : "blue"}
                        >
                          {item.status === "IMPORTED"
                            ? t("imported")
                            : titleCase(item.status)}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="size-8 px-0"
                            aria-label={t("downloadImport")}
                            disabled={downloadMutation.isPending}
                            onClick={() => downloadMutation.mutate(item.id)}
                          >
                            <Download size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            className="size-8 px-0"
                            aria-label={t("deleteImport")}
                            disabled={deleteMutation.isPending}
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationFooter
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={importsQuery.data?.meta.totalItems ?? 0}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState
              title={t("emptyTitle")}
              text={t("emptyText")}
            />
          )}
        </TableShell>
      </div>
      <Dialog
        open={Boolean(deleteTarget)}
        title={t("deleteTitle")}
        description={
          deleteTarget
            ? t("deleteDescription", { name: deleteTarget.originalName })
            : undefined
        }
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeleteTarget(null)}
          >
            {common("cancel")}
          </Button>
          <Button
            type="button"
            disabled={!deleteTarget || deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            {deleteMutation.isPending ? t("deleting") : common("delete")}
          </Button>
        </div>
      </Dialog>
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
