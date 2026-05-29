import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ChairpersonsController } from "./chairpersons.controller";
import { ChairpersonsRepository } from "./chairpersons.repository";
import { ChairpersonsService } from "./chairpersons.service";

@Module({
  imports: [PrismaModule],
  controllers: [ChairpersonsController],
  providers: [ChairpersonsService, ChairpersonsRepository],
})
export class ChairpersonsModule {}
