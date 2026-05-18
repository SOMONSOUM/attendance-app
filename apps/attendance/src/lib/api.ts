const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiResponse<T> = {
  success: true;
  data: T;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const payload = (await res.json()) as ApiResponse<T> | T;
  return isApiResponse(payload) ? payload.data : payload;
}

function isApiResponse<T>(
  payload: ApiResponse<T> | T,
): payload is ApiResponse<T> {
  return (
    !!payload &&
    typeof payload === "object" &&
    "success" in payload &&
    "data" in payload
  );
}
