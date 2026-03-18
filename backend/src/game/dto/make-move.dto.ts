import { IsInt, Min } from 'class-validator';

export class MakeMoveDto {
  @IsInt()
  @Min(0)
  x: number;

  @IsInt()
  @Min(0)
  y: number;
}
