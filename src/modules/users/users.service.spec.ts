import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { HttpException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    mockRepository = {
      find: jest.fn(),
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new UsersService(mockRepository);
  });

  describe('create', () => {
    it('should save the entity', async () => {
      const user = { fullName: 'Test', email: 'test@test.com' } as any;
      mockRepository.save.mockResolvedValue({ id: '1', ...user });

      const result = await service.create(user);

      expect(result).toEqual(expect.objectContaining({ fullName: 'Test' }));
      expect(mockRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const user = { id: '1', fullName: 'Test' } as User;
      mockRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(result).toEqual(user);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return the entity', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOneBy.mockResolvedValue({
        id: '1',
        fullName: 'Updated',
      } as User);

      const result = await service.update('1', { fullName: 'Updated' } as any);

      expect(result?.fullName).toBe('Updated');
    });

    it('should throw when entity not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);

      await expect(
        service.update('nonexistent', { fullName: 'Test' } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete the entity', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('1');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: '1' }, { id: '2' }] as User[];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });
  });
});
