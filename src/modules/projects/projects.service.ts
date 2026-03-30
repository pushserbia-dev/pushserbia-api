import { Injectable } from '@nestjs/common';
import { Project } from './entities/project.entity';
import { DEFAULT_PAGE_SIZE } from '../../core/constants/constants';
import { RepositoryService } from '../../core/repository/repository.service';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';

@Injectable()
export class ProjectsService extends RepositoryService<Project> {
  constructor(
    @InjectRepository(Project)
    protected readonly repository: Repository<Project>,
  ) {
    super();
  }

  async findAll(options?: FindManyOptions<Project>): Promise<Project[]> {
    return this.repository.find({
      where: { ...(options?.where as Partial<Project>), isBanned: false },
      order: { createdAt: 'DESC' },
      relations: { creator: true },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        totalVotes: true,
        totalVoters: true,
        image: true,
        createdAt: true,
        creator: {
          id: true,
          fullName: true,
          imageUrl: true,
        },
      },
    });
  }

  async findAllOffset(
    options?: FindManyOptions<Project>,
    limit: number = DEFAULT_PAGE_SIZE,
    offset: number = 0,
  ): Promise<{
    data: Project[];
    total: number;
    limit: number;
    offset: number;
    currentPage: number;
    totalPages: number;
  }> {
    return super.findAllOffset(
      {
        where: { ...(options?.where as Partial<Project>), isBanned: false },
        order: { createdAt: 'DESC' },
        relations: { creator: true },
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          description: true,
          totalVotes: true,
          totalVoters: true,
          image: true,
          createdAt: true,
          status: true,
          creator: {
            id: true,
            fullName: true,
            imageUrl: true,
          },
        },
      },
      limit,
      offset,
    );
  }

  findById(id: string) {
    return this.repository.findOne({
      where: { id, isBanned: false },
      relations: { creator: true },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        status: true,
        totalVotes: true,
        totalVoters: true,
        github: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          id: true,
          fullName: true,
          imageUrl: true,
        },
      },
    });
  }
}
