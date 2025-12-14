import React from 'react';
import { Line, Group } from 'react-konva';
import { GRID_SIZE, CELL_SIZE, PADDING, STAGE_WIDTH, STAGE_HEIGHT } from '../../constants/game';

export const GridLines = React.memo(() => {
  const lines = [];
  
  for (let i = 0; i < GRID_SIZE; i++) {
    lines.push(
      <Line
        key={`h-${i}`}
        points={[PADDING, PADDING + i * CELL_SIZE, STAGE_WIDTH - PADDING, PADDING + i * CELL_SIZE]}
        stroke="#4a5568"
        strokeWidth={1}
        opacity={0.6}
      />
    );
  }
  
  for (let i = 0; i < GRID_SIZE; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[PADDING + i * CELL_SIZE, PADDING, PADDING + i * CELL_SIZE, STAGE_HEIGHT - PADDING]}
        stroke="#4a5568"
        strokeWidth={1}
        opacity={0.6}
      />
    );
  }
  
  return <Group>{lines}</Group>;
});

GridLines.displayName = 'GridLines';