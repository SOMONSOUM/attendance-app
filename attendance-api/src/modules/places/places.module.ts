import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PlacesController } from "./places.controller";
import { PlacesRepository } from "./places.repository";
import { PlacesService } from "./places.service";

@Module({
  imports: [PrismaModule],
  controllers: [PlacesController],
  providers: [PlacesService, PlacesRepository],
})
export class PlacesModule {}
