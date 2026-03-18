import React from 'react';
import { Circle, Group } from 'react-konva';
import { COLORS, STONE_RADIUS } from '../../constants/game';
import { coordToKey, gridToPixel } from '../../utils/coordinates';

export const HoverEffect = ({ hoveredCoord, currentPlayer, gameActive, playerId, animationFrame, grid, isDarkMode = true }) => {
  if (!hoveredCoord || !gameActive || playerId !== currentPlayer) return null;
  
  const coordKey = coordToKey(hoveredCoord.x, hoveredCoord.y);
  if (grid.has(coordKey)) return null;

  const pixel = gridToPixel(hoveredCoord.x, hoveredCoord.y);
  const pulseScale = 1 + Math.sin(animationFrame * 0.2) * 0.1;
  const alpha = isDarkMode 
    ? 0.3 + Math.sin(animationFrame * 0.15) * 0.2 
    : 0.4 + Math.sin(animationFrame * 0.15) * 0.2;

  const playerColors = COLORS[currentPlayer];

  return (
    <Group>
      <Circle
        x={pixel.x}
        y={pixel.y}
        radius={(STONE_RADIUS + 4) * pulseScale}
        fill={playerColors.main}
        opacity={alpha}
      />
      <Circle
        x={pixel.x}
        y={pixel.y}
        radius={STONE_RADIUS}
        stroke={isDarkMode ? playerColors.main : playerColors.shadow}
        strokeWidth={2}
        opacity={0.8}
      />
    </Group>
  );
};