import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { BanProjectDto } from './dto/ban-project.dto';
import { GetUser } from '../../core/decorators/get-user.decorator';
import { CurrentUser } from '../auth/entities/current.user.entity';
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../core/constants/constants';
import { PaginationQueryDto } from '../../core/dto/pagination-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role';
import { RolesGuard } from '../auth/guards/roles.guard';
import { generateGravatar } from '../../core/utils/generate-gravatar';

@Controller('projects')
@UseGuards(RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @GetUser() creator: CurrentUser,
  ) {
    const newProjectData = {
      ...createProjectDto,
      creatorId: creator.id,
    };
    const project = await this.projectsService.create(newProjectData);
    return {
      ...project,
      creator: {
        id: creator.id,
        fullName: creator.name,
        gravatar: generateGravatar(creator.email),
      },
    };
  }

  @Get()
  findAll(
    @Query('slug') slug: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    const _pageSize = Math.min(
      pagination.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const _page =
      pagination.page && pagination.page > 0 ? pagination.page : DEFAULT_PAGE_NUMBER;
    const offset = (_page - 1) * _pageSize;

    return this.projectsService.findAllOffset(
      slug ? { where: { slug } } : undefined,
      _pageSize,
      offset,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser() user: CurrentUser,
  ) {
    const criteria =
      user.role === UserRole.Admin ? { id } : { id, creatorId: user.id };
    const project = await this.projectsService.update(
      criteria,
      updateProjectDto,
    );
    return {
      ...project,
      creator: {
        id: user.id,
        fullName: user.name,
        gravatar: generateGravatar(user.email),
      },
    };
  }

  @Patch(':id/ban')
  @Roles([UserRole.Admin])
  banProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() banProjectDto: BanProjectDto,
  ) {
    return this.projectsService.update(id, { isBanned: true, banNote: banProjectDto.banNote });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: CurrentUser,
  ) {
    const criteria =
      user.role === UserRole.Admin ? { id } : { id, creatorId: user.id };
    return this.projectsService.remove(criteria);
  }
}
