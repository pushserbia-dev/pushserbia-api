import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { VotesService } from './votes.service';
import { GetUser } from '../../core/decorators/get-user.decorator';
import { CreateVoteDto } from './dto/create-vote.dto';
import { CurrentUser } from '../auth/entities/current.user.entity';
import { PaginationQueryDto } from '../../core/dto/pagination-query.dto';
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../core/constants/constants';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get('my-votes')
  getMyVotes(
    @GetUser() user: CurrentUser,
    @Query() pagination: PaginationQueryDto,
  ) {
    const _pageSize = Math.min(
      pagination.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const _page =
      pagination.page && pagination.page > 0 ? pagination.page : DEFAULT_PAGE_NUMBER;
    const offset = (_page - 1) * _pageSize;

    return this.votesService.findAllOffset(
      { where: { userId: user.id } },
      _pageSize,
      offset,
    );
  }

  @Post()
  async create(
    @Body() createVoteDto: CreateVoteDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.votesService.voteForProject({
      userId: user.id,
      projectId: createVoteDto.projectId,
    });
  }
}
