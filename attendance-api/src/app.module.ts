import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ModulesModule } from "./modules/modules.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ModulesModule],
})
export class AppModule {}
