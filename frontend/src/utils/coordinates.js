import { PADDING, CELL_SIZE, GRID_SIZE } from '../constants/game';

export const coordToKey = (x, y) => `${x},${y}`;

export const keyToCoord = (key) => {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
};

export const pixelToGrid = (x, y) => {
  const gridX = Math.round((x - PADDING) / CELL_SIZE);
  const gridY = Math.round((y - PADDING) / CELL_SIZE);
  return { x: gridX, y: gridY };
};

export const gridToPixel = (gridX, gridY) => ({
  x: PADDING + gridX * CELL_SIZE,
  y: PADDING + gridY * CELL_SIZE
});

export const areStonesDiagonallyConnected = (coord1, coord2) => {
  return Math.abs(coord1.x - coord2.x) === 1 && Math.abs(coord1.y - coord2.y) === 1;
};

export const isValidGridPosition = (x, y) => {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
};