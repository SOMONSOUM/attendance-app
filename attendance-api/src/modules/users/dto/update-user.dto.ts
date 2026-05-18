import { ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "staff@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "password123", minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: "Staff User" })
  @IsOptional()
  @IsString()
  fullNameEn?: string;

  @ApiPropertyOptional({ example: "MALE", enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: "Coordinator" })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: "Operations" })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: "viewer" })
  @IsOptional()
  @IsString()
  roleName?: string;
}
