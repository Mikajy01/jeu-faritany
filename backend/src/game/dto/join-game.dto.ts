import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class JoinGameDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  joinCode?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
