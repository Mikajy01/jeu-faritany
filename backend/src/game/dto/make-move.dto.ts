import { IsInt, Min, Max } from 'class-validator';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';

export class MakeMoveDto {
  @IsInt()
  @Min(0)
  @Max(GAME_CONSTANTS.GRID_SIZE - 1)
  x: number;

  @IsInt()
  @Min(0)
  @Max(GAME_CONSTANTS.GRID_SIZE - 1)
  y: number;
}