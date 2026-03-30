import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { GetUser } from '../../core/decorators/get-user.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CurrentUser } from '../auth/entities/current.user.entity';
import { PaginationQueryDto } from '../../core/dto/pagination-query.dto';
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../core/constants/constants';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('feedback')
@UseGuards(RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.feedbackService.submitFeedback(user.id, createFeedbackDto);
  }

  @Get()
  getAll(
    @GetUser() user: CurrentUser,
    @Query() pagination: PaginationQueryDto,
  ) {
    const _pageSize = Math.min(
      pagination.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const _page =
      pagination.page && pagination.page > 0
        ? pagination.page
        : DEFAULT_PAGE_NUMBER;
    const offset = (_page - 1) * _pageSize;

    return this.feedbackService.findAllOffset(
      { where: { userId: user.id }, order: { createdAt: 'DESC' } },
      _pageSize,
      offset,
    );
  }
}
