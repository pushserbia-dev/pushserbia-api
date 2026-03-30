import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersGravatarBackfill implements OnModuleInit {
  private readonly logger = new Logger(UsersGravatarBackfill.name);
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    try {
      const result = await this.usersRepo
        .createQueryBuilder()
        .update(User)
        .set({ gravatar: () => 'md5(lower(btrim(email)))' })
        .where("(gravatar IS NULL OR gravatar = '')")
        .execute();

      if (result.affected && result.affected > 0) {
        this.logger.log(`Backfilled gravatar for ${result.affected} users`);
      }
    } catch (error) {
      this.logger.warn(
        'Gravatar backfill skipped — user table may not exist yet',
      );
    }
  }
}
