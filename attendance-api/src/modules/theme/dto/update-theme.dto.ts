import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ThemeAppearance } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateThemeDto {
  @ApiProperty({ example: "#2563eb" })
  @IsString()
  primaryColor!: string;

  @ApiProperty({ example: "#f8fafc" })
  @IsString()
  backgroundColor!: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/event-bg.jpg" })
  @IsOptional()
  @IsString()
  backgroundImageUrl?: string;

  @ApiProperty({ example: "Inter" })
  @IsString()
  fontFamily!: string;

  @ApiProperty({ example: 16, minimum: 12, maximum: 22 })
  @IsInt()
  @Min(12)
  @Max(22)
  fontSize!: number;

  @ApiProperty({ example: 8, minimum: 0, maximum: 24 })
  @IsInt()
  @Min(0)
  @Max(24)
  radius!: number;

  @ApiProperty({ enum: ThemeAppearance, example: ThemeAppearance.system })
  @IsEnum(ThemeAppearance)
  appearance!: ThemeAppearance;
}
