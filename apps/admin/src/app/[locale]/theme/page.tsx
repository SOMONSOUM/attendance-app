import { Image, Moon, Palette, Sun } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ThemePage() {
  return (
    <AdminShell
      active="Theme Builder"
      title="Theme builder"
      description="Customize the attendee scan page by event: color, font, background image, radius, size, and appearance."
      action={
        <Button>
          <Palette size={16} />
          Save theme
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Scan page appearance</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Primary color" placeholder="#5b3fd5" />
            <Field
              label="Font family"
              placeholder="Inter, Koh Santepheap, Noto Sans Khmer"
            />
            <Field label="Font size" placeholder="16" />
            <Field label="Radius" placeholder="8" />
            <Field label="Background image URL" placeholder="https://..." />
            <div className="flex gap-2">
              <Button variant="secondary">
                <Sun size={16} />
                Light
              </Button>
              <Button variant="outline">
                <Moon size={16} />
                Dark
              </Button>
            </div>
          </CardContent>
        </Card>

        <section className="min-h-[540px] rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="mx-auto max-w-md rounded-lg bg-background p-4">
            <div className="mb-4 rounded-lg bg-secondary p-5">
              <p className="text-sm text-muted-fg">Main Hall, Phnom Penh</p>
              <h2 className="mt-2 text-3xl font-semibold">Leadership Forum</h2>
              <p className="mt-3 text-sm text-muted-fg">
                Scan preview with your event color, radius, fonts, and
                background.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-fg">
                <Image size={16} />
                Background image preview
              </div>
              <Input placeholder="Search English or Khmer name" />
              <Button className="mt-3 w-full">Join event</Button>
            </div>
          </div>
        </section>
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
