import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormField({
  label,
  input,
  error,
  type = "text",
}: {
  label: string;
  input: object;
  error?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input type={type} {...input} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
