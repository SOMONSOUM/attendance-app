import { Injectable } from "@nestjs/common";
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from "@nestjs/terminus";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Prisma 7: $queryRawUnsafe is preferred for simple checks
      await this.prisma.$queryRawUnsafe("SELECT 1");
      return this.getStatus(key, true, {
        message: "MySQL connection is healthy",
      });
    } catch (error) {
      throw new HealthCheckError(
        "Database health check failed",
        this.getStatus(key, false, {
          message: "MySQL connection failed",
          error: (error as Error).message,
        }),
      );
    }
  }
}
