import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class AssignTenantOwnerDto {
  @ApiProperty({ example: "clxuser001" })
  @IsString()
  userId!: string;
}
