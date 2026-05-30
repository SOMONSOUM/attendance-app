import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { ApiErrorResponse } from "../interfaces/api-response.interface";

type HttpRequest = {
  url: string;
};

type HttpResponse = {
  status: (statusCode: number) => { json: (body: ApiErrorResponse) => void };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponse>();
    const request = context.getRequest<HttpRequest>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (isHealthRequest(request.url) && exception instanceof HttpException) {
      response.status(statusCode).json(exception.getResponse() as ApiErrorResponse);
      return;
    }

    const payload = this.toPayload(exception, statusCode);
    const body: ApiErrorResponse = {
      success: false,
      error: payload,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }

  private toPayload(exception: unknown, statusCode: number) {
    if (!(exception instanceof HttpException)) {
      return {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      };
    }

    const response = exception.getResponse();
    if (typeof response === "string") {
      return {
        code: this.toCode(statusCode),
        message: response,
      };
    }

    const body = response as Record<string, unknown>;
    const message = Array.isArray(body.message)
      ? body.message.join(", ")
      : typeof body.message === "string"
        ? body.message
        : exception.message;

    return {
      code:
        typeof body.error === "string"
          ? this.toConstantCase(body.error)
          : this.toCode(statusCode),
      message,
      details: Array.isArray(body.message) ? body.message : undefined,
    };
  }

  private toCode(statusCode: number) {
    return HttpStatus[statusCode] ?? "ERROR";
  }

  private toConstantCase(value: string) {
    return value
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[\s-]+/g, "_")
      .toUpperCase();
  }
}

function isHealthRequest(url: string) {
  return /^\/api\/v\d+\/health(?:\/|$)/.test(url);
}
