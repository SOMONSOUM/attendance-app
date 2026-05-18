import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class JoinEventDto {
  @ApiProperty({ example: 11.5564 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 104.9282 })
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({ example: "clxregistration001" })
  @IsOptional()
  @IsString()
  registrationId?: string;

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

  @ApiPropertyOptional({ example: "Technology" })
  @IsOptional()
  @IsString()
  department?: string;
}
