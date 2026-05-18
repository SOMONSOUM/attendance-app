import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { EventMode } from "@prisma/client";
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
import { EventThemeDto } from "./create-event.dto";

export class UpdateEventDto {
  @ApiPropertyOptional({ example: "Khmer Tech Summit 2026" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "Annual product and engineering attendance event." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: EventMode, example: EventMode.PRE_REGISTERED })
  @IsOptional()
  @IsEnum(EventMode)
  mode?: EventMode;

  @ApiPropertyOptional({ example: "Phnom Penh Convention Center" })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ example: 11.5564 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 104.9282 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 150, minimum: 10, maximum: 5000 })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(5000)
  radiusMeters?: number;

  @ApiPropertyOptional({ example: "2026-06-01T01:30:00.000Z" })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: "2026-06-01T10:30:00.000Z" })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ type: EventThemeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventThemeDto)
  theme?: EventThemeDto;
}
