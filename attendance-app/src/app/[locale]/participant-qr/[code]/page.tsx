import { Download } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default async function ParticipantQrPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cardDataUrl = await getCardDataUrl(
    `/meetings/participants/qr/${encodeURIComponent(code)}/card`,
  );

  return (
    <main className="min-h-screen bg-[#061f5d] px-4 py-6">
      <div className="mx-auto grid max-w-[420px] justify-items-center gap-4">
        {cardDataUrl ? (
          <img
            src={cardDataUrl}
            alt="Personal meeting check-in card"
            className="w-full rounded-md shadow-2xl"
          />
        ) : (
          <div className="grid min-h-[560px] w-full place-items-center rounded-md border border-white/20 bg-white/10 p-6 text-center text-white">
            <div>
              <p className="text-lg font-semibold">Personal meeting card</p>
              <p className="mt-3 break-all font-mono text-sm">{code}</p>
            </div>
          </div>
        )}
        {cardDataUrl ? (
          <a
            href={cardDataUrl}
            download={`participant-card-${code}.png`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-[#075fc2] shadow-sm transition hover:bg-slate-100"
          >
            <Download size={16} />
            Download card
          </a>
        ) : null}
      </div>
    </main>
  );
}

async function getCardDataUrl(path: string) {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
