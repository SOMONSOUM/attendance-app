import { Injectable } from "@nestjs/common";
import {
  HealthCheckService,
  HealthCheckResult,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from "@nestjs/terminus";
import { PrismaHealthIndicator } from "./indicators/prisma.health";

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  async checkAll(): Promise<HealthCheckResult> {
    const diskThresholdPercent = Number(
      process.env.HEALTH_DISK_THRESHOLD_PERCENT ?? 0.99,
    );
    const heapThresholdBytes = Number(
      process.env.HEALTH_HEAP_THRESHOLD_BYTES ?? 512 * 1024 * 1024,
    );
    const rssThresholdBytes = Number(
      process.env.HEALTH_RSS_THRESHOLD_BYTES ?? 768 * 1024 * 1024,
    );

    return this.health.check([
      () => this.prismaHealth.isHealthy("database"),
      () =>
        this.disk.checkStorage("storage", {
          path: "/",
          thresholdPercent: diskThresholdPercent,
        }),
      () => this.memory.checkHeap("memory_heap", heapThresholdBytes),
      () => this.memory.checkRSS("memory_rss", rssThresholdBytes),
    ]);
  }

  async checkDatabase(): Promise<HealthCheckResult> {
    return this.health.check([() => this.prismaHealth.isHealthy("database")]);
  }

  getPing() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV ?? "development",
    };
  }
}
