import React from 'react';
import { Line, Group } from 'react-konva';
import { COLORS, GRID_SIZE } from '../../constants/game';
import { gridToPixel, coordToKey, areStonesDiagonallyConnected } from '../../utils/coordinates';

export const CapturedAreas = React.memo(({ capturedAreas, grid }) => {
  return (
    <Group>
      {capturedAreas.map((area, areaIndex) => {
        const color = COLORS[area.owner].main;
        const fillColor = area.owner === 1 ? 'rgba(231, 76, 60, 0.15)' : 'rgba(52, 152, 219, 0.15)';
        
        return (
          <Group key={`area-${areaIndex}`}>
            {area.stones.length > 2 && (
              <Line
                points={area.stones.flatMap(coord => {
                  const pixel = gridToPixel(coord.x, coord.y);
                  return [pixel.x, pixel.y];
                })}
                closed
                fill={fillColor}
                stroke={color}
                strokeWidth={1}
                opacity={0.3}
              />
            )}
            
            {area.stones.map((stone, stoneIndex) => {
              const connections = [];
              const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
              
              directions.forEach(([dx, dy]) => {
                const adjX = stone.x + dx;
                const adjY = stone.y + dy;
                if (adjX >= 0 && adjX < GRID_SIZE && adjY >= 0 && adjY < GRID_SIZE) {
                  const adjKey = coordToKey(adjX, adjY);
                  if (grid.get(adjKey) === area.owner) {
                    const pixel1 = gridToPixel(stone.x, stone.y);
                    const pixel2 = gridToPixel(adjX, adjY);
                    connections.push(
                      <Line
                        key={`conn-${stoneIndex}-${dx}-${dy}`}
                        points={[pixel1.x, pixel1.y, pixel2.x, pixel2.y]}
                        stroke={color}
                        strokeWidth={3}
                        opacity={0.7}
                      />
                    );
                  }
                }
              });
              return connections;
            })}
            
            {area.stones.map((stone, i) => {
              const diagonalConnections = [];
              for (let j = i + 1; j < area.stones.length; j++) {
                const otherStone = area.stones[j];
                if (areStonesDiagonallyConnected(stone, otherStone)) {
                  const pixel1 = gridToPixel(stone.x, stone.y);
                  const pixel2 = gridToPixel(otherStone.x, otherStone.y);
                  diagonalConnections.push(
                    <Line
                      key={`diag-${i}-${j}`}
                      points={[pixel1.x, pixel1.y, pixel2.x, pixel2.y]}
                      stroke={color}
                      strokeWidth={2}
                      dash={[8, 4]}
                      opacity={0.8}
                    />
                  );
                }
              }
              return diagonalConnections;
            })}
          </Group>
        );
      })}
    </Group>
  );
});

CapturedAreas.displayName = 'CapturedAreas';