import React from 'react';
import { Circle, Group, Ring } from 'react-konva';
import { COLORS, STONE_RADIUS } from '../../constants/game';
import { keyToCoord, gridToPixel } from '../../utils/coordinates';

export const GameStones = ({ grid, lastMove, isDarkMode = true }) => {
  const stones = [];
  
  grid.forEach((player, coordKey) => {
    const coord = keyToCoord(coordKey);
    const pixel = gridToPixel(coord.x, coord.y);
    
    const isLastMove = lastMove && lastMove.x === coord.x && lastMove.y === coord.y;
    const playerColors = COLORS[player];

    stones.push(
      <Group key={coordKey}>
        {/* Static glow for last move - no animation */}
        {isLastMove && (
          <Circle
            x={pixel.x}
            y={pixel.y}
            radius={STONE_RADIUS * 2}
            fill={playerColors.glow}
            opacity={0.15}
          />
        )}

        {/* Shadow */}
        <Circle
          x={pixel.x + 1}
          y={pixel.y + 2}
          radius={STONE_RADIUS}
          fill={isDarkMode ? playerColors.shadow : "#000"}
          opacity={isDarkMode ? 0.4 : 0.2}
        />

        {/* Main Stone */}
        <Circle
          x={pixel.x}
          y={pixel.y}
          radius={STONE_RADIUS}
          fill={playerColors.main}
          stroke={isDarkMode ? "transparent" : "rgba(0,0,0,0.1)"}
          strokeWidth={1}
          shadowColor={playerColors.shadow}
          shadowBlur={isDarkMode ? 4 : 2}
          shadowOffset={{ x: 1, y: 2 }}
          shadowOpacity={isDarkMode ? 0.3 : 0.5}
        />

        {/* Highlight Reflection */}
        <Circle
          x={pixel.x - 2}
          y={pixel.y - 2}
          radius={STONE_RADIUS * 0.4}
          fill="rgba(255, 255, 255, 0.6)"
          opacity={0.8}
        />

        {/* Static ring indicator for last move */}
        {isLastMove && (
          <Ring
            x={pixel.x}
            y={pixel.y}
            innerRadius={STONE_RADIUS + 3}
            outerRadius={STONE_RADIUS + 6}
            fill={playerColors.glow}
            opacity={0.9}
          />
        )}
      </Group>
    );
  });
  
  return <Group>{stones}</Group>;
};