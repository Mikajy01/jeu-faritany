import { Coordinate, PolygonBounds } from '../../game/interfaces/game.interface';

export class PolygonUtil {
  /**
   * Ray casting algorithm for point-in-polygon test
   * Returns true if point is inside polygon, false otherwise
   */
  static isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    let intersections = 0;
    const [x, y] = point;

    for (let k = 0; k < polygon.length - 1; k++) {
      const [x1, y1] = polygon[k];
      const [x2, y2] = polygon[k + 1];

      if ((y < y1) !== (y < y2) && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
        intersections++;
      }
    }

    return intersections % 2 === 1;
  }

  /**
   * Convert cycle to closed polygon format
   */
  static cycleToPoly(cycle: Coordinate[]): [number, number][] {
    const polygonCoords = cycle.map((point) => [point.x, point.y] as [number, number]);

    // Ensure polygon is closed
    const first = polygonCoords[0];
    const last = polygonCoords[polygonCoords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      polygonCoords.push([first[0], first[1]]);
    }

    return polygonCoords;
  }

  /**
   * Calculate bounding box of a polygon
   */
  static getBounds(polygon: Coordinate[]): PolygonBounds {
    if (polygon.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = polygon[0].x;
    let maxX = polygon[0].x;
    let minY = polygon[0].y;
    let maxY = polygon[0].y;

    for (const point of polygon) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    return { minX, maxX, minY, maxY };
  }
}