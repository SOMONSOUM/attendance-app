type ApiEnvelope<T> = {
  data?: T;
  error?: { message?: string };
};

export async function api<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : {};

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }

  return (payload.data ?? payload) as T;
}
