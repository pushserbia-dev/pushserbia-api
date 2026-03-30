import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateVoteDto {
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;
}
