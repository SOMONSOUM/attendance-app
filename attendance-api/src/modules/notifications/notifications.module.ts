import { Module } from "@nestjs/common";
import { RegistrationDeliveryService } from "./registration-delivery.service";

@Module({
  providers: [RegistrationDeliveryService],
  exports: [RegistrationDeliveryService],
})
export class NotificationsModule {}
