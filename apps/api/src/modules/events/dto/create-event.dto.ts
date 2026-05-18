import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
} from "class-validator";

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
}
