import { Building2, ShieldCheck } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/tenancy/form-field";
import type { TenantRegistrationValues } from "@/lib/validation";

export function TenantForm({
  form,
  onSubmit,
}: {
  form: UseFormReturn<TenantRegistrationValues>;
  onSubmit: (values: TenantRegistrationValues) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 size={18} />
          Create tenant and owner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Tenant name"
              error={form.formState.errors.name?.message}
              input={form.register("name")}
            />
            <FormField
              label="Owner name"
              error={form.formState.errors.ownerName?.message}
              input={form.register("ownerName")}
            />
            <FormField
              label="Owner email"
              type="email"
              error={form.formState.errors.ownerEmail?.message}
              input={form.register("ownerEmail")}
            />
          </div>
          <FormField
            label="Owner password"
            type="password"
            error={form.formState.errors.ownerPassword?.message}
            input={form.register("ownerPassword")}
          />
          <Button type="submit" className="w-fit">
            <ShieldCheck size={16} />
            Create tenant
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
