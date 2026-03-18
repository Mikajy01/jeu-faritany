import React from "react";
import { Line, Group } from "react-konva";
import {
  GRID_SIZE,
  CELL_SIZE,
  PADDING,
  STAGE_WIDTH,
  STAGE_HEIGHT,
} from "../../constants/game";

export const GridLines = React.memo(({ color = "#334155" }: any) => {
  const lines = [];

  for (let i = 0; i < GRID_SIZE; i++) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[
          PADDING,
          PADDING + i * CELL_SIZE,
          STAGE_WIDTH - PADDING,
          PADDING + i * CELL_SIZE,
        ]}
        stroke={color}
        strokeWidth={1}
        opacity={0.4}
      />,
    );
  }

  for (let i = 0; i < GRID_SIZE; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[
          PADDING + i * CELL_SIZE,
          PADDING,
          PADDING + i * CELL_SIZE,
          STAGE_HEIGHT - PADDING,
        ]}
        stroke={color}
        strokeWidth={1}
        opacity={0.4}
      />,
    );
  }

  return <Group>{lines}</Group>;
});

GridLines.displayName = "GridLines";
