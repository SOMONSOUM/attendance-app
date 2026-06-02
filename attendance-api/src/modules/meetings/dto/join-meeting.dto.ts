import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Gender } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class JoinMeetingDto {
  @ApiPropertyOptional({ example: "clxparticipant001" })
  @IsOptional()
  @IsString()
  participantId?: string;

  @ApiPropertyOptional({ example: "clxshift001" })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({ example: "clxplace001" })
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiProperty({ example: "Chan Sophea" })
  @IsString()
  fullNameEn!: string;

  @ApiPropertyOptional({ example: "ចាន់ សុភា" })
  @IsOptional()
  @IsString()
  fullNameKm?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: "Director" })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: "Policy Department" })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: "sophea@example.com" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 11.5564 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 104.9282 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

}
