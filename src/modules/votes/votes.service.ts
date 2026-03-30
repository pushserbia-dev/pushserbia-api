import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Vote } from './entities/vote.entity';
import { RepositoryService } from '../../core/repository/repository.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { ProjectStatus } from '../projects/enums/project-status.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class VotesService extends RepositoryService<Vote> {
  constructor(
    @InjectRepository(Vote)
    protected readonly repository: Repository<Vote>,
  ) {
    super();
  }

  async voteForProject(params: {
    userId: string;
    projectId: string;
  }): Promise<Vote> {
    return await this.repository.manager.transaction(async (manager) => {
      const [user, project] = await Promise.all([
        manager.findOne(User, {
          where: { id: params.userId },
          select: ['id', 'level', 'isBlocked'],
        }),
        manager.findOne(Project, {
          where: { id: params.projectId },
          select: ['id', 'isBanned', 'status'],
        }),
      ]);

      if (!user) {
        throw new NotFoundException(`User not found`);
      }
      if (user.isBlocked) {
        throw new ForbiddenException('User is blocked');
      }

      if (!project) {
        throw new NotFoundException(
          `Project with id ${params.projectId} not found`,
        );
      }
      if (project.isBanned) {
        throw new ConflictException('Cannot vote for a banned project');
      }
      if (project.status !== ProjectStatus.VOTING) {
        throw new ConflictException('Voting is not open for this project');
      }

      const vote = manager.create(Vote, {
        userId: params.userId,
        projectId: params.projectId,
        weight: user.level,
      });

      try {
        const savedVote = await manager.save(vote);

        await manager
          .createQueryBuilder()
          .update(Project)
          .set({
            totalVotes: () => `"totalVotes" + :weight`,
            totalVoters: () => `"totalVoters" + 1`,
          })
          .where('id = :id', { id: params.projectId })
          .setParameters({ weight: user.level })
          .execute();

        await manager.increment(
          User,
          { id: params.userId },
          'projectsSupported',
          1,
        );

        return savedVote;
      } catch (error) {
        // Handle unique constraint violation (Postgres error code 23505)
        if (error.code === '23505') {
          throw new ConflictException(
            'User has already voted for this project',
          );
        }
        throw error;
      }
    });
  }
}
