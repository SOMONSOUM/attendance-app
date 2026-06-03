import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class JoinEventDto {
  @ApiPropertyOptional({ example: 11.5564 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 104.9282 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: "clxregistration001" })
  @IsOptional()
  @IsString()
  registrationId?: string;

  @ApiPropertyOptional({ example: "clxshift001" })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiProperty({ example: "Sok Dara" })
  @IsString()
  fullNameEn!: string;

  @ApiPropertyOptional({ example: "សុខ ដារ៉ា" })
  @IsOptional()
  @IsString()
  fullNameKm?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: "Engineering Manager" })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: "Dr." })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: "Ministry of Commerce" })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiPropertyOptional({ example: "+855 12 345 678" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: "sok.dara@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "telegram" })
  @IsOptional()
  @IsString()
  deliveryMethod?: string;
}
