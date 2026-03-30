import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be a valid URL-friendly slug (lowercase, hyphens only)',
  })
  slug: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shortDescription: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description: string;

  @Transform(({ value }: { value: string }) => value || undefined)
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  github?: string;

  @Transform(({ value }: { value: string }) => value || undefined)
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  image?: string;
}
