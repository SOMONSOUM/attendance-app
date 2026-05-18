import { Save } from "lucide-react";
import { AdminShell, DataSourceBadge } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <AdminShell
      active="Settings"
      title="Settings"
      description="Configure organization defaults, localization, security, and system preferences."
      action={
        <Button>
          <Save size={16} />
          Save settings
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Organization name" placeholder="Nest Attendance" />
            <Field label="Default locale" placeholder="en, km" />
            <Field label="Timezone" placeholder="Asia/Phnom_Penh" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
              <span className="text-sm font-medium">Database</span>
              <DataSourceBadge />
            </div>
            <Field label="API URL" placeholder="http://localhost:3001/api" />
            <Field
              label="Attendance app URL"
              placeholder="http://localhost:3000"
            />
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
