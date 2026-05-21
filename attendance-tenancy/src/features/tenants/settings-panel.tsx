import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { AppearanceMode } from "@/components/providers/appearance-provider";
import type { Locale } from "./types";

export function SettingsPanel({
  locale,
  theme,
  onLocaleChange,
  onThemeChange,
}: {
  locale: Locale;
  theme: AppearanceMode;
  onLocaleChange: (locale: Locale) => void;
  onThemeChange: (theme: AppearanceMode) => void;
}) {
  const t = useTranslations("tenancy");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>{t("language")}</Label>
          <Select
            value={locale}
            onChange={(event) => onLocaleChange(event.target.value as Locale)}
          >
            <option value="en">{t("english")}</option>
            <option value="km">{t("khmer")}</option>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>{t("theme")}</Label>
          <Select
            value={theme}
            onChange={(event) =>
              onThemeChange(event.target.value as AppearanceMode)
            }
          >
            <option value="system">{t("system")}</option>
            <option value="light">{t("light")}</option>
            <option value="dark">{t("dark")}</option>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
