import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

export class AddProjectMemberDto {
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
