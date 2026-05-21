import { KeyRound } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/tenancy/form-field";
import type { LoginValues } from "@/lib/validation";

export function LoginPanel({
  title,
  description,
  form,
  onSubmit,
}: {
  title: string;
  description: string;
  form: UseFormReturn<LoginValues>;
  onSubmit: (values: LoginValues) => void;
}) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound size={18} />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-fg">{description}</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            label="Email"
            type="email"
            error={form.formState.errors.email?.message}
            input={form.register("email")}
          />
          <FormField
            label="Password"
            type="password"
            error={form.formState.errors.password?.message}
            input={form.register("password")}
          />
          <Button type="submit">Sign in</Button>
        </form>
      </CardContent>
    </Card>
  );
}
