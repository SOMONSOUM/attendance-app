import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class RegisterGuestDto {
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
