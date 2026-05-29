import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ChairpersonDto {
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

  @ApiProperty({ example: "ដារ៉ា" })
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

export class CreateChairpersonDto extends ChairpersonDto {}
export class UpdateChairpersonDto extends ChairpersonDto {}
