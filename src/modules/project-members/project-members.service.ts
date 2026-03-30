import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMember } from './entities/project-member.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { Vote } from '../votes/entities/vote.entity';
import { UserRole } from '../users/enums/user-role';

@Injectable()
export class ProjectMembersService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly repository: Repository<ProjectMember>,
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async addMember(params: {
    projectId: string;
    userId: string;
    currentUserId: string;
    currentUserRole: UserRole;
  }): Promise<ProjectMember> {
    return this.repository.manager.transaction(async (manager) => {
      const [project, user] = await Promise.all([
        manager.findOne(Project, {
          where: { id: params.projectId },
          select: ['id', 'creatorId', 'isBanned'],
        }),
        manager.findOne(User, {
          where: { id: params.userId },
          select: ['id', 'fullName', 'imageUrl', 'gravatar'],
        }),
      ]);

      if (!project) {
        throw new NotFoundException('Project not found');
      }
      if (project.isBanned) {
        throw new ConflictException('Cannot add members to a banned project');
      }

      if (
        params.currentUserRole !== UserRole.Admin &&
        project.creatorId !== params.currentUserId
      ) {
        throw new ForbiddenException(
          'Only the project owner or admin can assign members',
        );
      }

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const vote = await manager.findOne(Vote, {
        where: { userId: params.userId, projectId: params.projectId },
        select: ['id'],
      });

      if (!vote) {
        throw new ConflictException(
          'Only users who have voted for this project can be added as members',
        );
      }

      try {
        const member = manager.create(ProjectMember, {
          userId: params.userId,
          projectId: params.projectId,
        });
        const saved = await manager.save(member);

        saved.user = user;
        return saved;
      } catch (error) {
        if (error.code === '23505') {
          throw new ConflictException(
            'User is already a member of this project',
          );
        }
        throw error;
      }
    });
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    return this.repository.find({
      where: { projectId },
      relations: { user: true },
      select: {
        id: true,
        userId: true,
        assignedAt: true,
        user: {
          id: true,
          fullName: true,
          imageUrl: true,
          gravatar: true,
        },
      },
      order: { assignedAt: 'ASC' },
    });
  }

  async getVoters(params: {
    projectId: string;
    currentUserId: string;
    currentUserRole: UserRole;
  }): Promise<User[]> {
    const project = await this.projectRepository.findOne({
      where: { id: params.projectId },
      select: ['id', 'creatorId'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      params.currentUserRole !== UserRole.Admin &&
      project.creatorId !== params.currentUserId
    ) {
      throw new ForbiddenException(
        'Only the project owner or admin can view voters',
      );
    }

    const votes = await this.voteRepository
      .createQueryBuilder('vote')
      .innerJoinAndSelect('vote.user', 'user')
      .leftJoin(
        ProjectMember,
        'pm',
        'pm."userId" = vote."userId" AND pm."projectId" = vote."projectId"',
      )
      .where('vote."projectId" = :projectId', {
        projectId: params.projectId,
      })
      .andWhere('pm.id IS NULL')
      .select([
        'vote.id',
        'user.id',
        'user.fullName',
        'user.imageUrl',
        'user.gravatar',
      ])
      .getMany();

    return votes.map((vote) => vote.user);
  }

  async removeMember(params: {
    projectId: string;
    userId: string;
    currentUserId: string;
    currentUserRole: UserRole;
  }): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: params.projectId },
      select: ['id', 'creatorId'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (
      params.currentUserRole !== UserRole.Admin &&
      project.creatorId !== params.currentUserId
    ) {
      throw new ForbiddenException(
        'Only the project owner or admin can remove members',
      );
    }

    const result = await this.repository.delete({
      projectId: params.projectId,
      userId: params.userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Member not found');
    }
  }
}
