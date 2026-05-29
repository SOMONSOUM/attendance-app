import { Module } from "@nestjs/common";
import { AttendanceModule } from "./attendance/attendance.module";
import { AuthModule } from "./auth/auth.module";
import { EventsModule } from "./events/events.module";
import { MeetingsModule } from "./meetings/meetings.module";
import { ChairpersonsModule } from "./chairpersons/chairpersons.module";
import { PlacesModule } from "./places/places.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RbacModule } from "./rbac/rbac.module";
import { RegistrationImportsModule } from "./registration-imports/registration-imports.module";
import { TenantsModule } from "./tenants/tenants.module";
import { ThemeModule } from "./theme/theme.module";
import { UsersModule } from "./users/users.module";
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    AuthModule,
    UsersModule,
    EventsModule,
    MeetingsModule,
    PlacesModule,
    ChairpersonsModule,
    RegistrationImportsModule,
    TenantsModule,
    AttendanceModule,
    ThemeModule,
    HealthModule,
  ],
})
export class ModulesModule {}
