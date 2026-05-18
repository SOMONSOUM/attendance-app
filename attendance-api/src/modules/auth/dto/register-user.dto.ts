import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class RegisterUserDto {
  @ApiProperty({ example: "new.user@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: "New User" })
  @IsString()
  fullNameEn!: string;

  @ApiPropertyOptional({ example: "MALE", enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: "HR Officer" })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: "Human Resources" })
  @IsOptional()
  @IsString()
  department?: string;
}
