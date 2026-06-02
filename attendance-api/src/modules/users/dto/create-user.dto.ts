import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "staff@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: "Staff User" })
  @IsString()
  fullNameEn!: string;

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
  organization?: string;

  @ApiPropertyOptional({ example: "viewer" })
  @IsOptional()
  @IsString()
  roleName?: string;
}
