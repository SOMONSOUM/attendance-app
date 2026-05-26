"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { loginAdmin } from "../actions";

export function LoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const formMethods = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = formMethods;

  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: () => {
      router.replace(searchParams.get("next") ?? `/${locale}`);
      router.refresh();
    },
  });

  return (
    <Card className="w-full border-white/60 bg-card/90 shadow-soft backdrop-blur">
      <CardHeader className="items-center gap-3 pb-4 text-center">
        <span className="grid size-12 place-items-center rounded-md bg-secondary text-primary">
          <ShieldCheck size={24} />
        </span>
        <div>
          <CardTitle className="text-2xl">Admin sign in</CardTitle>
          <p className="mt-2 text-sm text-muted-fg">
            Access attendance, events, meetings, and QR management.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...formMethods}>
          <form
            className="grid gap-4"
            onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
          >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="h-11 bg-background/80"
              placeholder="admin@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="h-11 bg-background/80 pr-10"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-foreground"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((value) => !value)}
              >
                <Eye size={16} />
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          {loginMutation.error ? (
            <p className="text-sm text-destructive">
              {loginMutation.error.message}
            </p>
          ) : null}
          <Button className="h-11 w-full" type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <LogIn size={16} />
            )}
            Sign in
          </Button>
          <div className="relative py-2 text-center text-xs text-muted-fg">
            <span className="relative z-10 bg-card px-3">or</span>
            <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
          </div>
          <Button type="button" variant="secondary" className="h-11 w-full">
            <ShieldCheck size={16} />
            Continue as MOC Officer
          </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
