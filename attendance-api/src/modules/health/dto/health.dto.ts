import { ApiProperty } from "@nestjs/swagger";

export class HealthStatusDetail {
  @ApiProperty({ example: "up", enum: ["up", "down"] })
  status: string;

  @ApiProperty({ example: "MySQL connection is healthy", required: false })
  message?: string;
}

export class HealthCheckInfoDto {
  @ApiProperty({ type: HealthStatusDetail })
  database: HealthStatusDetail;

  @ApiProperty({ type: HealthStatusDetail })
  storage: HealthStatusDetail;

  @ApiProperty({ type: HealthStatusDetail })
  memory_heap: HealthStatusDetail;

  @ApiProperty({ type: HealthStatusDetail })
  memory_rss: HealthStatusDetail;
}

export class FullHealthResponseDto {
  @ApiProperty({ example: "ok", enum: ["ok", "error", "shutting_down"] })
  status: string;

  @ApiProperty({ type: HealthCheckInfoDto })
  info: HealthCheckInfoDto;

  @ApiProperty({ type: HealthCheckInfoDto })
  error: Partial<HealthCheckInfoDto>;

  @ApiProperty({ type: HealthCheckInfoDto })
  details: HealthCheckInfoDto;
}

export class DbHealthResponseDto {
  @ApiProperty({ example: "ok", enum: ["ok", "error"] })
  status: string;

  @ApiProperty({
    example: {
      database: { status: "up", message: "MySQL connection is healthy" },
    },
  })
  info: Record<string, HealthStatusDetail>;

  @ApiProperty({ example: {} })
  error: Record<string, HealthStatusDetail>;

  @ApiProperty({
    example: {
      database: { status: "up", message: "MySQL connection is healthy" },
    },
  })
  details: Record<string, HealthStatusDetail>;
}

export class PingResponseDto {
  @ApiProperty({ example: "ok" })
  status: string;

  @ApiProperty({ example: "2026-05-23T10:00:00.000Z" })
  timestamp: string;

  @ApiProperty({ example: 3600 })
  uptime: number;

  @ApiProperty({ example: "production" })
  environment: string;
}
