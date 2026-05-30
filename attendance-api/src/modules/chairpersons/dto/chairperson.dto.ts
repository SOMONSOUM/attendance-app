import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class ChairpersonDto {
  @ApiProperty({ example: "H.E." })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "honorificTitleEn should not be empty" })
  honorificTitleEn!: string;

  @ApiProperty({ example: "ឯកឧត្តម" })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "honorificTitleKm should not be empty" })
  honorificTitleKm!: string;

  @ApiProperty({ example: "Sok" })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "firstNameEn should not be empty" })
  firstNameEn!: string;

  @ApiProperty({ example: "សុខ" })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "firstNameKm should not be empty" })
  firstNameKm!: string;

  @ApiProperty({ example: "Dara" })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "lastNameEn should not be empty" })
  lastNameEn!: string;

  @ApiProperty({ example: "ដារ៉ា" })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: "lastNameKm should not be empty" })
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

export class CreateChairpersonDto extends ChairpersonDto {}
export class UpdateChairpersonDto extends ChairpersonDto {}
