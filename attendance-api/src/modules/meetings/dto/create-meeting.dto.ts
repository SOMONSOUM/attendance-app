import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { EventMode, Gender, MeetingParticipantStatus } from "@prisma/client";
import { EventShiftDto } from "../../events/dto/create-event.dto";

export class MeetingChairpersonDto {
  @ApiPropertyOptional({ example: "clxchairperson001" })
  @IsOptional()
  @IsString()
  catalogChairpersonId?: string;

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

  @ApiPropertyOptional({ example: "clxcatalogplace001" })
  @IsOptional()
  @IsString()
  catalogPlaceId?: string;

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

  @ApiPropertyOptional({ example: "Ministry of Commerce" })
  @IsOptional()
  @IsString()
  organization?: string;

  @ApiPropertyOptional({ example: "+855 12 345 678" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: "sophea@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "clxplace001" })
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiPropertyOptional({ example: "clxshift001" })
  @IsOptional()
  @IsString()
  shiftId?: string;

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

  @ApiProperty({ enum: EventMode, example: EventMode.BULK_REGISTRATION })
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

  @ApiPropertyOptional({ example: "Conference Room A" })
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

  @ApiPropertyOptional({ type: [EventShiftDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventShiftDto)
  shifts?: EventShiftDto[];

  @ApiPropertyOptional({ type: [MeetingParticipantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingParticipantDto)
  participants?: MeetingParticipantDto[];
}
