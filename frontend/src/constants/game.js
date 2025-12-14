export const GRID_SIZE = 19;
export const CELL_SIZE = 30;
export const STONE_RADIUS = 4;
export const PADDING = 30;
export const STAGE_WIDTH = GRID_SIZE * CELL_SIZE + PADDING * 2;
export const STAGE_HEIGHT = GRID_SIZE * CELL_SIZE + PADDING * 2;

export const COLORS = {
  1: { 
    main: '#e74c3c', 
    shadow: '#c0392b', 
    highlight: '#ff6b7a', 
    glow: '#ff4757' 
  },
  2: { 
    main: '#3498db', 
    shadow: '#2980b9', 
    highlight: '#74b9ff', 
    glow: '#00cec9' 
  }
};

export const SOCKET_URL = "http://192.168.1.149:5555";