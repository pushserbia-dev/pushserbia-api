import { ProjectsService } from './projects.service';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let mockRepository: jest.Mocked<Repository<Project>>;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new ProjectsService(mockRepository);
  });

  describe('findAll', () => {
    it('should query with isBanned false and order by createdAt DESC', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isBanned: false },
          order: { createdAt: 'DESC' },
          relations: { creator: true },
        }),
      );
    });

    it('should merge additional filter options', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findAll({ where: { slug: 'my-project' } } as any);

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'my-project', isBanned: false },
        }),
      );
    });
  });

  describe('findAllOffset', () => {
    it('should return paginated results', async () => {
      const mockProjects = [{ id: '1' }] as Project[];
      mockRepository.findAndCount.mockResolvedValue([mockProjects, 1]);

      const result = await service.findAllOffset(undefined, 10, 0);

      expect(result).toEqual({
        data: mockProjects,
        total: 1,
        limit: 10,
        offset: 0,
        currentPage: 1,
        totalPages: 1,
      });
    });
  });

  describe('findById', () => {
    it('should find project by id excluding banned', async () => {
      const mockProject = { id: '1', name: 'Test' } as Project;
      mockRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findById('1');

      expect(result).toEqual(mockProject);
      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1', isBanned: false },
          relations: { creator: true },
        }),
      );
    });

    it('should return null when project is not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
