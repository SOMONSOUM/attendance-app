import { Module } from "@nestjs/common";
import { AttendanceModule } from "./attendance/attendance.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RbacModule } from "./rbac/rbac.module";
import { RegistrationImportsModule } from "./registration-imports/registration-imports.module";
import { ThemeModule } from "./theme/theme.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    AuthModule,
    UsersModule,
    EventsModule,
    RegistrationImportsModule,
    AttendanceModule,
    ThemeModule,
  ],
})
export class ModulesModule {}
