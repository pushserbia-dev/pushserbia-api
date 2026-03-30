import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FeedbackCategory } from '../enums/feedback-category.enum';

export class CreateFeedbackDto {
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsDefined()
  @IsNotEmpty()
  @IsEnum(FeedbackCategory)
  category: FeedbackCategory;

  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  message: string;
}
