import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class PlaceDto {
  @ApiProperty({ example: "Main hall" })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "name should not be empty" })
  name!: string;

  @ApiPropertyOptional({ example: "Ground floor keynote hall." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requireLocation?: boolean;

  @ApiPropertyOptional({ example: "Building A, Hall 1" })
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

  @ApiPropertyOptional({ example: 100, minimum: 0, maximum: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  radiusMeters?: number;
}

export class CreatePlaceDto extends PlaceDto {}
export class UpdatePlaceDto extends PlaceDto {}
