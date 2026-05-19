const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiResponse<T> = {
  success: true;
  data: T;
};

type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  statusCode: number;
};

export class ApiRequestError extends Error {
  code: string;
  statusCode: number;
  details?: string[];

  constructor(response: ApiErrorResponse) {
    super(response.error.message);
    this.name = "ApiRequestError";
    this.code = response.error.code;
    this.statusCode = response.statusCode;
    this.details = response.error.details;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = (await res.json()) as ApiResponse<T> | T;

  if (!res.ok) {
    if (isApiErrorResponse(payload)) throw new ApiRequestError(payload);
    throw new Error("Request failed");
  }

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

function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  return (
    !!payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success: unknown }).success === false &&
    "error" in payload
  );
}
