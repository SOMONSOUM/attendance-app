"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TenantForm } from "@/features/tenants/tenant-form";
import type { Tenant } from "@/features/tenants/types";
import { api } from "@/lib/api";
import {
  tenantRegistrationSchema,
  type TenantRegistrationValues,
} from "@/lib/validation";

export default function CreateTenantPage() {
  const router = useRouter();
  const locale = useLocale();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const form = useForm<TenantRegistrationValues>({
    resolver: zodResolver(tenantRegistrationSchema),
    defaultValues: {
      name: "",
      ownerName: "",
      ownerEmail: "",
      ownerPassword: "",
    },
  });

  async function registerTenant(values: TenantRegistrationValues) {
    setError("");
    const tenant = await api<Tenant>("/tenants/register", {
      method: "POST",
      body: JSON.stringify(values),
    });
    form.reset();
    setMessage(`Tenant ${tenant.name} is ready.`);
    router.push(`/${locale}/tenants`);
  }

  return (
    <>
      {message ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-fg">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <TenantForm
        form={form}
        onSubmit={(values) =>
          registerTenant(values).catch((err: Error) => setError(err.message))
        }
      />
    </>
  );
}
