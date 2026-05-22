import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class JoinMeetingDto {
  @ApiPropertyOptional({ example: "clxparticipant001" })
  @IsOptional()
  @IsString()
  participantId?: string;

  @ApiProperty({ example: "Chan Sophea" })
  @IsString()
  fullNameEn!: string;

  @ApiPropertyOptional({ example: "ចាន់ សុភា" })
  @IsOptional()
  @IsString()
  fullNameKm?: string;

  @ApiPropertyOptional({ example: 11.5564 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 104.9282 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
