import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BanProjectDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  banNote?: string;
}
