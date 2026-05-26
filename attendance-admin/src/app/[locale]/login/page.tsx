import { LoginForm } from "./_components/login-form";
import { LoginControls } from "./_components/login-controls";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background text-foreground lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden min-h-screen items-center justify-center overflow-hidden bg-primary text-primary-foreground lg:flex">
        <div className="absolute inset-0 opacity-20">
          <div className="grid h-full rotate-[-12deg] grid-cols-4 gap-8 p-12">
            {Array.from({ length: 12 }, (_, index) => (
              <div
                key={index}
                className="h-80 rounded-[2rem] border border-white/25 bg-white/10 shadow-2xl"
              />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-primary/75" />
        <div className="relative z-10 grid max-w-xl justify-items-center px-12 text-center">
          <BrandMark size="lg" />
          <p className="mt-8 text-3xl font-bold leading-tight">
            Ministry of Commerce
          </p>
          <h1 className="mt-24 text-4xl font-bold leading-tight">
            Mobile Application Center System
          </h1>
        </div>
      </section>
      <section className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-info/20 px-4 py-10">
        <LoginControls locale={locale} />
        <div className="w-full max-w-md">
          <div className="mb-8 grid justify-items-center text-center lg:hidden">
            <BrandMark />
            <h1 className="mt-4 text-2xl font-bold">
              Mobile Application Center System
            </h1>
          </div>
          <LoginForm locale={locale} />
        </div>
      </section>
    </main>
  );
}

function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div
      className={`grid place-items-center rounded-full border-4 border-white bg-white shadow-soft ${
        size === "lg" ? "size-28" : "size-20"
      }`}
    >
      <div className="grid size-[78%] place-items-center rounded-full bg-primary text-center text-primary-foreground">
        <span className="text-xs font-bold leading-tight">MOC</span>
      </div>
    </div>
  );
}
