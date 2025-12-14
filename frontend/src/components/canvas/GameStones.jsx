import React from 'react';
import { Circle, Group } from 'react-konva';
import { COLORS, STONE_RADIUS } from '../../constants/game';
import { keyToCoord, gridToPixel } from '../../utils/coordinates';

export const GameStones = ({ grid, lastMove, animationFrame }) => {
  const stones = [];
  
  grid.forEach((player, coordKey) => {
    const coord = keyToCoord(coordKey);
    const pixel = gridToPixel(coord.x, coord.y);
    
    const isLastMove = lastMove && lastMove.x === coord.x && lastMove.y === coord.y;
    const playerColors = COLORS[player];
    const time = animationFrame * 0.05;
    const pulseScale = isLastMove ? 1 + Math.sin(time) * 0.15 : 1;
    const glowIntensity = isLastMove ? (Math.sin(time * 2) * 0.3 + 0.7) : 0;

    stones.push(
      <Group key={coordKey}>
        {isLastMove && (
          <Circle
            x={pixel.x}
            y={pixel.y}
            radius={STONE_RADIUS * 2.5 * pulseScale}
            fill={playerColors.glow}
            opacity={glowIntensity * 0.3}
          />
        )}
        
        <Circle
          x={pixel.x + 1}
          y={pixel.y + 2}
          radius={STONE_RADIUS * pulseScale}
          fill={playerColors.shadow}
          opacity={0.4}
        />
        
        <Circle
          x={pixel.x}
          y={pixel.y}
          radius={STONE_RADIUS * pulseScale}
          fill={playerColors.main}
          shadowColor={playerColors.shadow}
          shadowBlur={4}
          shadowOffset={{ x: 1, y: 2 }}
          shadowOpacity={0.3}
        />
        
        <Circle
          x={pixel.x - 2}
          y={pixel.y - 2}
          radius={STONE_RADIUS * 0.4}
          fill="rgba(255, 255, 255, 0.6)"
          opacity={0.8}
        />
        
        {isLastMove && (
          <>
            <Circle
              x={pixel.x}
              y={pixel.y}
              radius={(STONE_RADIUS + 6) * pulseScale}
              stroke={playerColors.glow}
              strokeWidth={3}
              opacity={glowIntensity * 0.8}
            />
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2 + time * 0.5;
              const dotX = pixel.x + Math.cos(angle) * (STONE_RADIUS + 8) * pulseScale;
              const dotY = pixel.y + Math.sin(angle) * (STONE_RADIUS + 8) * pulseScale;
              
              return (
                <Circle
                  key={`dot-${i}`}
                  x={dotX}
                  y={dotY}
                  radius={2 * glowIntensity}
                  fill={playerColors.glow}
                  opacity={glowIntensity}
                />
              );
            })}
          </>
        )}
      </Group>
    );
  });
  
  return <Group>{stones}</Group>;
};