import { VotesService } from './votes.service';
import { Repository } from 'typeorm';
import { Vote } from './entities/vote.entity';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '../projects/enums/project-status.enum';

describe('VotesService', () => {
  let service: VotesService;
  let mockRepository: jest.Mocked<Repository<Vote>>;
  let mockManager: any;

  beforeEach(() => {
    mockManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      }),
      increment: jest.fn().mockResolvedValue({}),
    };

    mockRepository = {
      manager: {
        transaction: jest.fn((cb) => cb(mockManager)),
      },
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new VotesService(mockRepository);
  });

  describe('voteForProject', () => {
    const params = { userId: 'user-1', projectId: 'project-1' };

    it('should throw NotFoundException when user not found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);
      mockManager.findOne.mockResolvedValueOnce({ id: 'project-1' });

      await expect(service.voteForProject(params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is blocked', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        id: 'user-1',
        level: 1,
        isBlocked: true,
      });
      mockManager.findOne.mockResolvedValueOnce({
        id: 'project-1',
        isBanned: false,
      });

      await expect(service.voteForProject(params)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        id: 'user-1',
        level: 1,
        isBlocked: false,
      });
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(service.voteForProject(params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when project is banned', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        id: 'user-1',
        level: 1,
        isBlocked: false,
      });
      mockManager.findOne.mockResolvedValueOnce({
        id: 'project-1',
        isBanned: true,
      });

      await expect(service.voteForProject(params)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when project is not in voting status', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        id: 'user-1',
        level: 1,
        isBlocked: false,
      });
      mockManager.findOne.mockResolvedValueOnce({
        id: 'project-1',
        isBanned: false,
        status: ProjectStatus.PENDING,
      });

      await expect(service.voteForProject(params)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create vote and update project/user counters on success', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        id: 'user-1',
        level: 2,
        isBlocked: false,
      });
      mockManager.findOne.mockResolvedValueOnce({
        id: 'project-1',
        isBanned: false,
        status: ProjectStatus.VOTING,
      });

      const mockVote = {
        id: 'vote-1',
        userId: 'user-1',
        projectId: 'project-1',
        weight: 2,
      };
      mockManager.create.mockReturnValue(mockVote);
      mockManager.save.mockResolvedValue(mockVote);

      const result = await service.voteForProject(params);

      expect(result).toEqual(mockVote);
      expect(mockManager.create).toHaveBeenCalledWith(Vote, {
        userId: 'user-1',
        projectId: 'project-1',
        weight: 2,
      });
      expect(mockManager.increment).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate vote', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        id: 'user-1',
        level: 1,
        isBlocked: false,
      });
      mockManager.findOne.mockResolvedValueOnce({
        id: 'project-1',
        isBanned: false,
        status: ProjectStatus.VOTING,
      });

      mockManager.create.mockReturnValue({});
      mockManager.save.mockRejectedValue({ code: '23505' });

      await expect(service.voteForProject(params)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
