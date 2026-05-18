"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Languages, Monitor, Moon, Save, Sun } from "lucide-react";
import { AdminShell, DataSourceBadge } from "@/components/admin/admin-shell";
import type { AppearanceMode } from "@/components/providers/appearance-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme } = useTheme();
  const [appearance, setAppearance] = useState<AppearanceMode>("system");

  useEffect(() => {
    setAppearance((theme as AppearanceMode | undefined) ?? "system");
  }, [theme]);

  function changeLocale(locale: string) {
    const nextPath = pathname.replace(/^\/(en|km)(?=\/|$)/, `/${locale}`);
    startTransition(() => router.replace(`${nextPath}${window.location.search}`));
  }

  function changeAppearance(mode: AppearanceMode) {
    setAppearance(mode);
    setTheme(mode);
  }

  return (
    <AdminShell
      active="Settings"
      title={t("title")}
      description={t("description")}
      action={
        <Button>
          <Save size={16} />
          {t("savedLocally")}
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("organization")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label={t("organizationName")} placeholder="Nest Attendance" />
            <div className="grid gap-2">
              <Label>{t("translate")}</Label>
              <Select
                value={params.locale}
                onChange={(event) => changeLocale(event.target.value)}
                disabled={isPending}
              >
                <option value="en">{t("english")}</option>
                <option value="km">{t("khmer")}</option>
              </Select>
            </div>
            <Field label={t("timezone")} placeholder="Asia/Phnom_Penh" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("appearance")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>{t("mode")}</Label>
              <div className="grid grid-cols-3 gap-2">
                <ModeButton
                  icon={Sun}
                  label={t("light")}
                  active={appearance === "light"}
                  onClick={() => changeAppearance("light")}
                />
                <ModeButton
                  icon={Moon}
                  label={t("dark")}
                  active={appearance === "dark"}
                  onClick={() => changeAppearance("dark")}
                />
                <ModeButton
                  icon={Monitor}
                  label={t("systemMode")}
                  active={appearance === "system"}
                  onClick={() => changeAppearance("system")}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
              <Languages size={17} className="text-primary" />
              <span className="text-sm text-muted-fg">
                {t("languageHint")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("system")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-background p-3">
              <span className="text-sm font-medium">{t("database")}</span>
              <DataSourceBadge />
            </div>
            <Field label={t("apiUrl")} placeholder="http://localhost:3001/api" />
            <Field
              label={t("attendanceAppUrl")}
              placeholder="http://localhost:3000"
            />
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function ModeButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sun;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      className="justify-center"
      onClick={onClick}
    >
      <Icon size={16} />
      {label}
    </Button>
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
