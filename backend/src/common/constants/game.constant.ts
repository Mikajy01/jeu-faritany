export const GAME_CONSTANTS = {
  GRID_SIZE: 19,
  MIN_CYCLE_LENGTH: 4,
  PLAYER_ONE: 1,
  PLAYER_TWO: 2,
  AI_PLAYER_ID: 'AI_BOT_SOCKET_ID',
  EMPTY_CELL: 0,
  DEFAULT_MOVE_TIME_LIMIT: 60,      // seconds
  DEFAULT_TOTAL_TIME_LIMIT: 1800,    // seconds
  DEFAULT_GAME_MODE: 'TIME',
  DEFAULT_TARGET_SCORE: 20,
} as const;

export const DIRECTIONS = {
  ORTHOGONAL: [
    [-1, 0],  // Left
    [1, 0],   // Right
    [0, -1],  // Up
    [0, 1],   // Down
  ],
  ALL: [
    [-1, 0],  // Left
    [1, 0],   // Right
    [0, -1],  // Up
    [0, 1],   // Down
    [-1, -1], // Top-left
    [-1, 1],  // Bottom-left
    [1, -1],  // Top-right
    [1, 1],   // Bottom-right
  ],
} as const;