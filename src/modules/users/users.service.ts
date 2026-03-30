import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { RepositoryService } from '../../core/repository/repository.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService extends RepositoryService<User> {
  constructor(
    @InjectRepository(User) protected readonly repository: Repository<User>,
  ) {
    super();
  }
}
