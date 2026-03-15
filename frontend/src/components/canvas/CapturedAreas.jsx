import React from "react";
import { Line, Group } from "react-konva";
import { COLORS, GRID_SIZE } from "../../constants/game";
import {
  gridToPixel,
  coordToKey,
  areStonesDiagonallyConnected,
} from "../../utils/coordinates";

export const CapturedAreas = React.memo(
  ({ capturedAreas, grid, isDarkMode = true }) => {
    return (
      <Group>
        {capturedAreas.map((area, areaIndex) => {
          const playerColors = COLORS[area.owner];
          const color = playerColors.main;
          const fillColor =
            area.owner === 1
              ? isDarkMode
                ? "rgba(231, 76, 60, 0.15)"
                : "rgba(231, 76, 60, 0.25)"
              : isDarkMode
                ? "rgba(52, 152, 219, 0.15)"
                : "rgba(52, 152, 219, 0.25)";

          const strokeColor = isDarkMode ? color : playerColors.shadow;
          const strokeWidth = isDarkMode ? 1 : 2;

          // Compute centroid
          let centroidX = 0;
          let centroidY = 0;
          area.stones.forEach((stone) => {
            centroidX += stone.x;
            centroidY += stone.y;
          });
          if (area.stones.length > 0) {
            centroidX /= area.stones.length;
            centroidY /= area.stones.length;
          }

          // Sort stones by polar angle around centroid for proper polygon ordering
          const sortedStones = [...area.stones].sort((a, b) => {
            const angleA = Math.atan2(a.y - centroidY, a.x - centroidX);
            const angleB = Math.atan2(b.y - centroidY, b.x - centroidX);
            return angleA - angleB;
          });

          return (
            <Group key={`area-${areaIndex}`}>
              {sortedStones.length > 2 && (
                <Line
                  points={sortedStones.flatMap((coord) => {
                    const pixel = gridToPixel(coord.x, coord.y);
                    return [pixel.x, pixel.y];
                  })}
                  closed
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={0.9}
                />
              )}

              {area.stones.map((stone, stoneIndex) => {
                const connections = [];
                const directions = [
                  [-1, 0],
                  [1, 0],
                  [0, -1],
                  [0, 1],
                ];

                directions.forEach(([dx, dy]) => {
                  const adjX = stone.x + dx;
                  const adjY = stone.y + dy;
                  if (
                    adjX >= 0 &&
                    adjX < GRID_SIZE &&
                    adjY >= 0 &&
                    adjY < GRID_SIZE
                  ) {
                    const adjKey = coordToKey(adjX, adjY);
                    if (grid.get(adjKey) === area.owner) {
                      const pixel1 = gridToPixel(stone.x, stone.y);
                      const pixel2 = gridToPixel(adjX, adjY);
                      connections.push(
                        <Line
                          key={`conn-${stoneIndex}-${dx}-${dy}`}
                          points={[pixel1.x, pixel1.y, pixel2.x, pixel2.y]}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth + 2}
                          opacity={0.7}
                        />,
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
                        stroke={strokeColor}
                        strokeWidth={strokeWidth + 1}
                        // dash={[8, 4]}
                        opacity={0.8}
                      />,
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
  },
);

CapturedAreas.displayName = "CapturedAreas";
