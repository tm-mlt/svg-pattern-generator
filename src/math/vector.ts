import { isObject } from "../helpers.js";

export interface VectorLike {
  x: number,
  y: number,
}

export class Vector2 implements Vector2 {
  public x: number;
  public y: number;

  constructor(vecLike: VectorLike);
  constructor(vec: Vector2);
  constructor(size: number);
  constructor();
  constructor(x: number, y: number);
  constructor(
    x: number | Vector2 | VectorLike = 0,
    y?: number,
  ) {
    if(isObject(x)) {
      this.x = (x as VectorLike).x;
      this.y = (x as VectorLike).y;
    } else {
      this.x = x;
      this.y = y !== undefined ? y : x;
    }
  }

  public static Zero() {
    return new Vector2(0);
  }

  public static One() {
    return new Vector2(1);
  }

  public static Dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  }

  public static DistanceSquared(a: Vector2, b: Vector2): number {
    return (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
  }

  public static Distance(a: Vector2, b: Vector2): number {
    return Math.sqrt(Vector2.DistanceSquared(a, b));
  }

  public multiply(times: number): Vector2
  {
    return new Vector2(this.x * times, this.y * times);
  }

  public add(vec: Vector2): Vector2
  {
    return new Vector2(this.x + vec.x, this.y + vec.y);
  }

  public subtract(vec: Vector2): Vector2
  {
    return new Vector2(this.x - vec.x, this.y - vec.y);
  }

  public inverse(): Vector2
  {
    return new Vector2(-this.x, -this.y);
  }

  public lengthSquared(): number
  {
    return this.x * this.x + this.y * this.y;
  }

  public length(): number
  {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}