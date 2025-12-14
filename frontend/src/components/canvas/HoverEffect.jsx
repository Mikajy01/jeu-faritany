import React from 'react';
import { Circle, Group } from 'react-konva';
import { COLORS, STONE_RADIUS } from '../../constants/game';
import { coordToKey, gridToPixel } from '../../utils/coordinates';

export const HoverEffect = ({ hoveredCoord, currentPlayer, gameActive, playerId, animationFrame, grid }) => {
  if (!hoveredCoord || !gameActive || playerId !== currentPlayer) return null;
  
  const coordKey = coordToKey(hoveredCoord.x, hoveredCoord.y);
  if (grid.has(coordKey)) return null;

  const pixel = gridToPixel(hoveredCoord.x, hoveredCoord.y);
  const pulseScale = 1 + Math.sin(animationFrame * 0.2) * 0.1;
  const alpha = 0.3 + Math.sin(animationFrame * 0.15) * 0.2;

  return (
    <Group>
      <Circle
        x={pixel.x}
        y={pixel.y}
        radius={(STONE_RADIUS + 4) * pulseScale}
        fill={COLORS[currentPlayer].main}
        opacity={alpha}
      />
      <Circle
        x={pixel.x}
        y={pixel.y}
        radius={STONE_RADIUS}
        stroke={COLORS[currentPlayer].main}
        strokeWidth={2}
        opacity={0.8}
      />
    </Group>
  );
};