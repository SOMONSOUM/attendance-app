import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";
import type { ApiSuccessResponse } from "../interfaces/api-response.interface";

type HttpRequest = {
  url: string;
};

type MessageResponse<T> = {
  data: T;
  message?: string;
};

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    const request = context.switchToHttp().getRequest<HttpRequest>();

    return next.handle().pipe(
      map((response) => {
        if (isApiResponse(response)) {
          return response as unknown as ApiSuccessResponse<T>;
        }

        const normalized = normalizeResponse(response);
        return {
          success: true,
          data: normalized.data,
          message: normalized.message,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}

function normalizeResponse<T>(response: T): MessageResponse<T> {
  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Object.keys(response).every((key) => key === "data" || key === "message")
  ) {
    return response as MessageResponse<T>;
  }

  return { data: response };
}

function isApiResponse(response: unknown) {
  return (
    !!response &&
    typeof response === "object" &&
    "success" in response &&
    "timestamp" in response &&
    "path" in response
  );
}
