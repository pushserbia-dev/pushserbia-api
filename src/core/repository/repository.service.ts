import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { DEFAULT_PAGE_SIZE } from '../constants/constants';

export abstract class RepositoryService<T extends { id: string }> {
  protected abstract repository: Repository<T>;

  async create(entity: DeepPartial<T>): Promise<T> {
    return this.repository.save(entity);
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findAllOffset(
    options?: FindManyOptions<T>,
    limit: number = DEFAULT_PAGE_SIZE,
    offset: number = 0,
  ): Promise<{
    data: T[];
    total: number;
    limit: number;
    offset: number;
    currentPage: number;
    totalPages: number;
  }> {
    if (limit < 1) {
      throw new BadRequestException('Limit must be at least 1');
    }
    if (offset < 0) {
      throw new BadRequestException('Offset must be non-negative');
    }

    const [data, total] = await this.repository.findAndCount({
      ...options,
      take: limit,
      skip: offset,
    });

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    const currentPage = total > 0 ? Math.floor(offset / limit) + 1 : 0;

    return {
      data,
      total,
      limit,
      offset,
      currentPage,
      totalPages,
    };
  }

  findById(id: string) {
    return this.repository.findOneBy({ id } as FindOptionsWhere<T>);
  }

  findOneBy(query: FindOptionsWhere<T> | FindOptionsWhere<T>[]) {
    return this.repository.findOneBy(query);
  }

  async update(
    criteria: string | FindOptionsWhere<T>,
    entity: QueryDeepPartialEntity<T>,
  ) {
    const updated = await this.repository.update(criteria, entity);
    if (updated.affected === 0) {
      throw new HttpException('Entity not found', HttpStatus.NOT_FOUND);
    }
    return typeof criteria === 'string'
      ? this.findById(criteria)
      : this.findOneBy(criteria);
  }

  async remove(criteria: string | FindOptionsWhere<T>): Promise<void> {
    const result = await this.repository.delete(criteria);
    if (result.affected === 0) {
      throw new HttpException('Entity not found', HttpStatus.NOT_FOUND);
    }
  }
}
