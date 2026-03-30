import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUser } from '../../core/decorators/get-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { CurrentUser } from '../auth/entities/current.user.entity';
import { FirebaseAuthService } from '../auth/services/firebase-auth.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../core/constants/constants';
import { PaginationQueryDto } from '../../core/dto/pagination-query.dto';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private firebaseAuthService: FirebaseAuthService,
  ) {}

  @Post()
  @Roles([UserRole.Admin])
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Post('account')
  async account(
    @Body() createUserDto: CreateUserDto,
    @GetUser() user: CurrentUser,
  ) {
    if (!user.email) {
      throw new HttpException('Token missing email claim', HttpStatus.UNAUTHORIZED);
    }
    if (user.email !== createUserDto.email) {
      throw new HttpException('Email does not match', HttpStatus.CONFLICT);
    }

    const existingUser = await this.usersService.findOneBy({
      email: createUserDto.email,
    });
    if (existingUser) {
      await this.firebaseAuthService.setCustomUserData(user.uid, {
        app_user_id: existingUser.id,
        app_user_role: existingUser.role,
        app_user_active: !existingUser.isBlocked,
      });
      return this.usersService.update(existingUser.id, {
        ...createUserDto,
        firebaseUid: user.uid,
      });
    }

    const account = await this.usersService.create({
      ...createUserDto,
      firebaseUid: user.uid,
    });

    await this.firebaseAuthService.setCustomUserData(user.uid, {
      app_user_id: account.id,
      app_user_role: account.role,
      app_user_active: !account.isBlocked,
    });

    return account;
  }

  @Get('me')
  @SerializeOptions({ groups: ['me'] })
  async me(@GetUser() user?: CurrentUser) {
    if (!user?.id) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const me = await this.usersService.findOneBy({ id: user.id });
    if (!me) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (!me.firebaseUid) {
      throw new HttpException('User not linked', HttpStatus.NOT_FOUND);
    }
    return me;
  }

  @Patch('me')
  async updateMe(
    @Body()
    payload: UpdateMeDto,
    @GetUser() user: CurrentUser,
  ): Promise<User | null> {
    return await this.usersService.update(user.id, payload);
  }

  @Patch(':id/block')
  @Roles([UserRole.Admin])
  async blockUser(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.update(id, { isBlocked: true });
    if (user?.firebaseUid) {
      await this.firebaseAuthService.setCustomUserData(user.firebaseUid, {
        app_user_id: user.id,
        app_user_role: user.role,
        app_user_active: false,
      });
    }
    return user;
  }

  @Patch(':id')
  @Roles([UserRole.Admin])
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles([UserRole.Admin])
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }

  @Get()
  @Roles([UserRole.Admin])
  async getAllUsers(
    @Query() pagination: PaginationQueryDto,
  ) {
    const _pageSize = Math.min(
      pagination.pageSize ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const _page =
      pagination.page && pagination.page > 0 ? pagination.page : DEFAULT_PAGE_NUMBER;
    const offset = (_page - 1) * _pageSize;

    return this.usersService.findAllOffset(undefined, _pageSize, offset);
  }
}
