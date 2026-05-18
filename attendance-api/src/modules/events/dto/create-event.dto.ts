import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { EventMode, ThemeAppearance } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class EventThemeDto {
  @ApiPropertyOptional({ example: "#5b3fd5" })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ example: "#fbfafc" })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/event-bg.jpg" })
  @IsOptional()
  @IsString()
  backgroundImageUrl?: string;

  @ApiPropertyOptional({ example: "Inter" })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({ example: 16, minimum: 12, maximum: 22 })
  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(22)
  fontSize?: number;

  @ApiPropertyOptional({ example: 8, minimum: 0, maximum: 24 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(24)
  radius?: number;

  @ApiPropertyOptional({ enum: ThemeAppearance, example: ThemeAppearance.system })
  @IsOptional()
  @IsEnum(ThemeAppearance)
  appearance?: ThemeAppearance;
}

export class CreateEventDto {
  @ApiProperty({ example: "Khmer Tech Summit 2026" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: "Annual product and engineering attendance event.",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: EventMode,
    example: EventMode.PRE_REGISTERED,
  })
  @IsEnum(EventMode)
  mode!: EventMode;

  @ApiProperty({ example: "Phnom Penh Convention Center" })
  @IsString()
  locationName!: string;

  @ApiProperty({ example: 11.5564 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 104.9282 })
  @IsNumber()
  longitude!: number;

  @ApiProperty({ example: 150, minimum: 10, maximum: 5000 })
  @IsInt()
  @Min(10)
  @Max(5000)
  radiusMeters!: number;

  @ApiProperty({ example: "2026-06-01T01:30:00.000Z" })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: "2026-06-01T10:30:00.000Z" })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ type: EventThemeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventThemeDto)
  theme?: EventThemeDto;
}
