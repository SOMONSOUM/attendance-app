"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { loginAdmin } from "../actions";

export function LoginForm({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: () => {
      router.replace(searchParams.get("next") ?? `/${locale}`);
      router.refresh();
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Admin sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
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
          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <LogIn size={16} />
            )}
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
