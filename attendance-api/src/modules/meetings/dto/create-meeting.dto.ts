import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { EventMode, Gender, MeetingParticipantStatus } from "@prisma/client";

export class MeetingChairpersonDto {
  @ApiProperty({ example: "H.E." })
  @IsString()
  honorificTitleEn!: string;

  @ApiProperty({ example: "ឯកឧត្តម" })
  @IsString()
  honorificTitleKm!: string;

  @ApiProperty({ example: "Sok" })
  @IsString()
  firstNameEn!: string;

  @ApiProperty({ example: "សុខ" })
  @IsString()
  firstNameKm!: string;

  @ApiProperty({ example: "Dara" })
  @IsString()
  lastNameEn!: string;

  @ApiProperty({ example: "ដារា" })
  @IsString()
  lastNameKm!: string;

  @ApiPropertyOptional({ example: "Chairperson" })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: "Ministry of Education" })
  @IsOptional()
  @IsString()
  organization?: string;
}

export class MeetingPlaceDto {
  @ApiPropertyOptional({ example: "clxplace001" })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: "Conference Room A" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "Main discussion room." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Building 1, Floor 2" })
  @IsOptional()
  @IsString()
  locationName?: string;
}

export class MeetingParticipantDto {
  @ApiProperty({ example: "Chan Sophea" })
  @IsString()
  fullNameEn!: string;

  @ApiPropertyOptional({ example: "ចាន់ សុភា" })
  @IsOptional()
  @IsString()
  fullNameKm?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.FEMALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: "Project Lead" })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: "Operations" })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: "sophea@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "clxplace001" })
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiPropertyOptional({
    enum: MeetingParticipantStatus,
    example: MeetingParticipantStatus.INVITED,
  })
  @IsOptional()
  @IsEnum(MeetingParticipantStatus)
  status?: MeetingParticipantStatus;
}

export class CreateMeetingDto {
  @ApiProperty({ example: "Quarterly Steering Committee Meeting" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "Review attendance operations and next steps." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: EventMode, example: EventMode.PRE_REGISTERED })
  @IsEnum(EventMode)
  mode!: EventMode;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  separateQrByPlace?: boolean;

  @ApiPropertyOptional({ example: "Conference Room A" })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiProperty({ example: "2026-06-01T01:30:00.000Z" })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: "2026-06-01T03:30:00.000Z" })
  @IsDateString()
  endsAt!: string;

  @ApiProperty({ type: [MeetingChairpersonDto] })
  @IsArray()
  @ArrayMinSize(1, { message: "At least one meeting chairperson is required." })
  @ValidateNested({ each: true })
  @Type(() => MeetingChairpersonDto)
  chairpersons!: MeetingChairpersonDto[];

  @ApiPropertyOptional({ type: [MeetingPlaceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingPlaceDto)
  places?: MeetingPlaceDto[];

  @ApiPropertyOptional({ type: [MeetingParticipantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingParticipantDto)
  participants?: MeetingParticipantDto[];
}
