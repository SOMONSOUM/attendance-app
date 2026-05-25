import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { EventMode, ThemeAppearance } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  Matches,
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

export class EventShiftDto {
  @ApiProperty({ example: "Morning shift" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "07:00" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  startTime!: string;

  @ApiProperty({ example: "12:00" })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  endTime!: string;
}

export class EventPlaceDto {
  @ApiPropertyOptional({ example: "clxplace001" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: "Main hall" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "Ground floor keynote hall." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Hall A" })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requireLocation?: boolean;

  @ApiPropertyOptional({ example: 11.5564 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 104.9282 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 100, minimum: 0, maximum: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  radiusMeters?: number;
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
    example: EventMode.BULK_REGISTRATION,
  })
  @IsEnum(EventMode)
  mode!: EventMode;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  separateQrByPlace?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requireLocation?: boolean;

  @ApiPropertyOptional({ example: "Not required" })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  radiusMeters?: number;

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

  @ApiPropertyOptional({ type: [EventShiftDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventShiftDto)
  shifts?: EventShiftDto[];

  @ApiPropertyOptional({ type: [EventPlaceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventPlaceDto)
  places?: EventPlaceDto[];
}
