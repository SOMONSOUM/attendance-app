import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateRoleDto {
  @ApiProperty({ example: "scanner" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "Can scan attendees and view events." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ["events:read", "attendance:create", "attendance:read"],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions!: string[];
}
