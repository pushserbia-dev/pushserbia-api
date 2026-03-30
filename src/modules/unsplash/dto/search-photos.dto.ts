// src/unsplash/dto/search.dto.ts
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchPhotosDto {
  @IsString() @MaxLength(200) query!: string;
  @IsString() orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape';

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(30) per_page = 30;

  // 'latest' | 'relevant'
  @IsOptional() @IsString() order_by?: 'latest' | 'relevant';
}
