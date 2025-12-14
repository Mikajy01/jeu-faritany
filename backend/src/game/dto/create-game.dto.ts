import { IsIn, IsOptional } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsIn(['public', 'private', 'AI'])
  type?: 'public' | 'private' | 'AI';
}
