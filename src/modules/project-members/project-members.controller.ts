import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { GetUser } from '../../core/decorators/get-user.decorator';
import { CurrentUser } from '../auth/entities/current.user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('projects/:projectId/members')
@UseGuards(RolesGuard)
export class ProjectMembersController {
  constructor(
    private readonly projectMembersService: ProjectMembersService,
  ) {}

  @Get()
  getMembers(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectMembersService.getMembers(projectId);
  }

  @Get('voters')
  getVoters(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @GetUser() user: CurrentUser,
  ) {
    return this.projectMembersService.getVoters({
      projectId,
      currentUserId: user.id,
      currentUserRole: user.role,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  addMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AddProjectMemberDto,
    @GetUser() user: CurrentUser,
  ) {
    return this.projectMembersService.addMember({
      projectId,
      userId: dto.userId,
      currentUserId: user.id,
      currentUserRole: user.role,
    });
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @GetUser() user: CurrentUser,
  ) {
    return this.projectMembersService.removeMember({
      projectId,
      userId,
      currentUserId: user.id,
      currentUserRole: user.role,
    });
  }
}
