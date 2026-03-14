import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsIn(['public', 'private', 'AI'])
  type?: 'public' | 'private' | 'AI';

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(600)
  moveTimeLimit?: number; // in seconds

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(7200)
  gameDurationLimit?: number; // in seconds

  @IsOptional()
  @IsIn(['TIME', 'SCORE'])
  gameMode?: 'TIME' | 'SCORE';

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  targetScore?: number; // score to reach to win

  @IsOptional()
  @IsString()
  userId?: string;
}
