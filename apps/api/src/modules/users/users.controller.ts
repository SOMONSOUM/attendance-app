import { Controller, Get } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { apiSuccess } from "../../common/swagger/api-examples";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiOperation({ summary: "List admin users" })
  @ApiOkResponse({
    description: "Users list",
    schema: {
      example: apiSuccess([
        {
          id: "clxuser001",
          email: "admin@example.com",
          fullNameEn: "System Admin",
          fullNameKm: null,
          gender: null,
          position: "Administrator",
          department: "Operations",
          roles: [{ role: { id: "clxrole001", name: "Admin" } }],
          createdAt: "2026-05-18T03:00:00.000Z",
          updatedAt: "2026-05-18T03:00:00.000Z",
        },
      ]),
    },
  })
  @Get()
  list() {
    return this.users.list();
  }
}
