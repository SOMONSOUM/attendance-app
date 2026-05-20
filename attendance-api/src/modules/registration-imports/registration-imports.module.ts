import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RegistrationImportsController } from "./registration-imports.controller";
import { RegistrationImportsService } from "./registration-imports.service";

@Module({
  imports: [PrismaModule],
  controllers: [RegistrationImportsController],
  providers: [RegistrationImportsService],
})
export class RegistrationImportsModule {}
