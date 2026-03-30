import { Injectable } from '@nestjs/common';
import { Feedback } from './entities/feedback.entity';
import { RepositoryService } from '../../core/repository/repository.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService extends RepositoryService<Feedback> {
  constructor(
    @InjectRepository(Feedback)
    protected readonly repository: Repository<Feedback>,
  ) {
    super();
  }

  async submitFeedback(
    userId: string,
    dto: CreateFeedbackDto,
  ): Promise<Feedback> {
    return this.create({
      userId,
      rating: dto.rating,
      category: dto.category,
      message: dto.message,
    });
  }
}
