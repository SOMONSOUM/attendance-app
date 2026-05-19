import axios, { AxiosError } from "axios";

export type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  path: string;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  statusCode: number;
  timestamp: string;
  path: string;
};

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error: AxiosError<ApiError>) => {
    const message =
      error.response?.data?.error.message ??
      error.message ??
      "Something went wrong";
    return Promise.reject(new Error(message));
  },
);

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  if (isFormData) {
    const response = await fetch(`/api${path}`, {
      method: init.method ?? "GET",
      body: init.body,
      credentials: "same-origin",
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Something went wrong");
    }
    return payload?.data ?? payload;
  }

  const response = await apiClient.request<T>({
    url: path,
    method: init?.method ?? "GET",
    data: isFormData
      ? init.body
      : init?.body
        ? JSON.parse(String(init.body))
        : undefined,
    headers: isFormData
      ? undefined
      : (init?.headers as Record<string, string> | undefined),
  });

  return response as T;
}
