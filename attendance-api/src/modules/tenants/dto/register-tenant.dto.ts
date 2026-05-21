import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class RegisterTenantDto {
  @ApiProperty({ example: "Acme University" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: "acme-university",
    description: "Optional. When omitted, the API generates a unique slug from the tenant name.",
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiProperty({ example: "owner@acme.edu" })
  @IsEmail()
  ownerEmail!: string;

  @ApiProperty({ example: "Sok Owner" })
  @IsString()
  ownerName!: string;

  @ApiProperty({ example: "password123", minLength: 6 })
  @IsString()
  @MinLength(6)
  ownerPassword!: string;
}
