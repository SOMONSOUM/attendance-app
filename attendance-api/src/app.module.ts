import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ModulesModule } from "./modules/modules.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", "attendance-api/.env"],
      isGlobal: true,
    }),
    ModulesModule,
  ],
})
export class AppModule {}
