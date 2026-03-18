import React from "react";
import { Line, Group } from "react-konva";
import {
  CELL_SIZE,
  PADDING,
  DEFAULT_GRID_SIZE,
  getStageSize,
} from "../../constants/game";

export const GridLines = React.memo(
  ({ color = "#334155", gridSize = DEFAULT_GRID_SIZE }: any) => {
    const { width: stageWidth, height: stageHeight } = getStageSize(gridSize);
  const lines = [];

  for (let i = 0; i < gridSize; i++) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[
          PADDING,
          PADDING + i * CELL_SIZE,
          stageWidth - PADDING,
          PADDING + i * CELL_SIZE,
        ]}
        stroke={color}
        strokeWidth={1}
        opacity={0.4}
      />,
    );
  }

  for (let i = 0; i < gridSize; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[
          PADDING + i * CELL_SIZE,
          PADDING,
          PADDING + i * CELL_SIZE,
          stageHeight - PADDING,
        ]}
        stroke={color}
        strokeWidth={1}
        opacity={0.4}
      />,
    );
  }

  return <Group>{lines}</Group>;
  },
);

GridLines.displayName = "GridLines";
