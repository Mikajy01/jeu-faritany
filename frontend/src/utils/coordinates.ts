import { PADDING, CELL_SIZE, DEFAULT_GRID_SIZE } from "../constants/game";

export const coordToKey = (x: number, y: number) => `${x},${y}`;

export const keyToCoord = (key: string) => {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
};

export const pixelToGrid = (x: number, y: number) => {
  const gridX = Math.round((x - PADDING) / CELL_SIZE);
  const gridY = Math.round((y - PADDING) / CELL_SIZE);
  return { x: gridX, y: gridY };
};

export const gridToPixel = (gridX: number, gridY: number) => ({
  x: PADDING + gridX * CELL_SIZE,
  y: PADDING + gridY * CELL_SIZE,
});

export const areStonesDiagonallyConnected = (
  coord1: { x: number; y: number },
  coord2: { x: number; y: number },
) => {
  return (
    Math.abs(coord1.x - coord2.x) === 1 && Math.abs(coord1.y - coord2.y) === 1
  );
};

export const isValidGridPosition = (
  x: number,
  y: number,
  gridSize: number = DEFAULT_GRID_SIZE,
) => {
  return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
};
