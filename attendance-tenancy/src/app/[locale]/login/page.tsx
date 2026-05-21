"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { LoginPanel } from "@/features/auth/login-panel";
import { useAuthStore } from "@/features/auth/auth-store";
import { loginSchema, type LoginValues } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "en";
  const t = useTranslations("tenancy");
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState("");
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function submit(values: LoginValues) {
    setError("");
    await login(values);
    router.replace(searchParams.get("next") ?? `/${locale}`);
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center border-t-4 border-primary bg-background px-4">
      <div className="grid w-full gap-4">
        {error ? (
          <p className="mx-auto w-full max-w-md rounded-md border border-border bg-card px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <LoginPanel
          title={t("operator")}
          description={t("operatorHelp")}
          form={form}
          onSubmit={(values) =>
            submit(values).catch((err: Error) => setError(err.message))
          }
        />
      </div>
    </main>
  );
}
