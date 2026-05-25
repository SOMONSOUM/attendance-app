import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckResult } from "@nestjs/terminus";
import { HealthService } from "./health.service";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  FullHealthResponseDto,
  DbHealthResponseDto,
  PingResponseDto,
} from "./dto/health.dto";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: "Full system health check",
    description:
      "Checks database connectivity, disk storage, heap memory, and RSS memory. Returns HTTP 503 if any check fails.",
  })
  @ApiResponse({
    status: 200,
    description: "All systems are healthy",
    type: FullHealthResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: "One or more systems are unhealthy",
    type: FullHealthResponseDto,
  })
  checkAll(): Promise<HealthCheckResult> {
    return this.healthService.checkAll();
  }

  @Public()
  @Get("db")
  @HealthCheck()
  @ApiResponse({
    status: 200,
    description: "Database is healthy",
    type: DbHealthResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: "Database is unhealthy",
    type: DbHealthResponseDto,
  })
  checkDatabase(): Promise<HealthCheckResult> {
    return this.healthService.checkDatabase();
  }

  @Public()
  @Get("ping")
  @ApiOperation({
    summary: "Liveness probe",
    description:
      "Lightweight check that returns 200 immediately with no DB calls. Ideal for Kubernetes liveness probes.",
  })
  @ApiResponse({
    status: 200,
    description: "Service is alive",
    type: PingResponseDto,
  })
  ping(): PingResponseDto {
    return this.healthService.getPing();
  }
}
