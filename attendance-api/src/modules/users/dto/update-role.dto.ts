import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: "scanner" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Can scan attendees and view events." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: ["events:read", "attendance:create", "attendance:read"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
