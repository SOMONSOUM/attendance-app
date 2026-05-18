import { LoginForm } from "./_components/login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <LoginForm locale={locale} />
    </main>
  );
}
