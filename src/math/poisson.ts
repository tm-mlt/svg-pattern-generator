import {Vector2} from "./vector.js";
import {RandomGenerator} from "../types.js";
import {degToRads} from "../helpers.js";

export type Grid<T> = (T | null)[][]


// https://code.tutsplus.com/collision-detection-using-the-separating-axis-theorem--gamedev-169t
function checkRotatedDistance(aPos: Vector2, aSize: Vector2, bPos: Vector2, bSize: Vector2) {

}

function insertPoint(grid: Grid<Vector2>, cellSize: number, point: Vector2): void {
  const xindex = Math.floor(point.x / cellSize);
  const yindex = Math.floor(point.y / cellSize);
  grid[xindex][yindex] = point;
}

function isValidPoint(grid: Grid<Vector2>,
                      canvasSize: Vector2,
                      cellsize: number,
                      gwidth: number,
                      gheight: number,
                      p: Vector2,
                      radius: number): boolean {
  /* Make sure the point is on the screen */
  if (p.x < 0 || p.x >= canvasSize.x || p.y < 0 || p.y >= canvasSize.y)
    return false;

  /* Check neighboring eight cells */
  const xindex = Math.floor(p.x / cellsize);
  const yindex = Math.floor(p.y / cellsize);
  const i0 = Math.max(xindex - 1, 0);
  const i1 = Math.min(xindex + 1, gwidth - 1);
  const j0 = Math.max(yindex - 1, 0);
  const j1 = Math.min(yindex + 1, gheight - 1);

  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++)
      if (grid[i][j] !== null) {
        if (Vector2.DistanceSquared(grid[i][j]!, p) < radius * radius) {
          return false;
        }
      }

  /* If we get here, return true */
  return true;
}

/**
 * @link https://sighack.com/post/poisson-disk-sampling-bridsons-algorithm
 */
export function poissonDiskSampling(radius: number, k: number, canvasSize: Vector2, random: RandomGenerator): Vector2[] {
  const {x: width, y: height} = canvasSize;
  const N: number = 2;
  const points: Vector2[] = [];
  const active: Vector2[] = [];
  const p0: Vector2 = new Vector2(random() * width, random() * height);

  const cellsize: number = Math.max(Math.floor(radius / Math.sqrt(N)), 1);

  const ncells_width = Math.ceil(width / cellsize) + 1;
  const ncells_height = Math.ceil(height / cellsize) + 1;

  const grid: (Vector2 | null)[][] = [];

  for (let i = 0; i < ncells_width; i++) {
    grid[i] = [];
    for (let j = 0; j < ncells_height; j++) {
      grid[i][j] = null;
    }
  }

  insertPoint(grid, cellsize, p0);
  points.push(p0);
  active.push(p0);

  // Step 2
  while (active.length > 0) {
    /* Pick a point 'p' from our active list */
    const random_index: number = Math.floor(random() * active.length);
    const p: Vector2 = active[random_index];

    let found: boolean = false;

    let tries = 0;
    for (; tries < k; tries++) {
      /* Pick a random angle */
      const theta = random() * 360;
      /* Pick a random radius between r and 2r */
      const new_radius = random() * 2 * radius + radius;
      /* Find X & Y coordinates relative to point p */

      const pnewx = p.x + new_radius * Math.cos(degToRads(theta));
      const pnewy = p.y + new_radius * Math.sin(degToRads(theta));
      const pnew = new Vector2(pnewx, pnewy);

      if (!isValidPoint(
        grid,
        canvasSize,
        cellsize,
        ncells_width,
        ncells_height,
        pnew,
        radius)
      ) {
        continue;
      }

      /* 3. Add point and set 'found' if valid */
      points.push(pnew);
      insertPoint(grid, cellsize, pnew);
      active.push(pnew);
      found = true;
      break;
    }

    /* If we succeed in finding a point, add to grid and lists */

    /* Otherwise, remove point 'p' from the active list */
    if (!found) {
      active.splice(random_index, 1);
    }
  }

  // Step 3

  return points;
}