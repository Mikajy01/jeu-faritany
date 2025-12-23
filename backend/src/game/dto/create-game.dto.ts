import { IsIn, IsOptional } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsIn(['public', 'private', 'AI'])
  type?: 'public' | 'private' | 'AI';

  @IsOptional()
  moveTimeLimit?: number; // in seconds

  @IsOptional()
  gameDurationLimit?: number; // in seconds

}
