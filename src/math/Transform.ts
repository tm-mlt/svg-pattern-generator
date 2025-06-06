import {createIdentityMatrix3, Matrix3} from "./matrix.js";
import {Vector2} from "./vector.js";

export class Transform {
  public matrix: Matrix3 = createIdentityMatrix3();
  private get m() {
    return this.matrix;
  }
  private get x(): number {
    return this.m[0][2];
  }
  private set x(v: number) {
    this.m[0][2] = v;
  }
  private get y(): number {
    return this.m[1][2];
  }
  private set y(v: number) {
    this.m[1][2] = v;
  }

  public get position(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  public set position(v: Vector2) {
    this.x = v.x;
    this.y = v.y;
  }


  private get w(): number {
    return this.m[0][0];
  }
  private set w(v: number) {
    this.m[0][0] = v;
  }
  private get h(): number {
    return this.m[1][1];
  }
  private set h(v: number) {
    this.m[1][1] = v;
  }

  public get size(): Vector2 {
    return new Vector2(this.w, this.h);
  }

  public set size(v: Vector2) {
    this.w = v.x;
    this.h = v.y;
  }

  private _r: number = 0;
  public get rotation(): number {
    return 0;
  }
}