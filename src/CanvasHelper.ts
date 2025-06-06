import { CanvasInfo } from "./types.js";
import { Vector2 } from "./math/vector.js";

export class CanvasHelper implements CanvasInfo {
  public get context(): CanvasRenderingContext2D {
    const context =  this.element.getContext("2d") as CanvasRenderingContext2D;
    if (!context) {
      throw new Error("No 2d context found");
    }
    return context;
  }

  public get size(): Vector2
  {
    return new Vector2(this.element.width, this.element.height);
  }

  public set size(value: Vector2) {
    this.element.width = value.x;
    this.element.height = value.y;
    this.element.style.width = value.x + 'px';
    this.element.style.height = value.y + 'px';
  }

  constructor(public readonly element: HTMLCanvasElement) {

  }

  public scaleCanvasToPixelRatio(pixelRatio: number): void {
    this.element.width = this.size.x * pixelRatio;
    this.element.height = this.size.y * pixelRatio;
    this.context.scale(pixelRatio, pixelRatio);
  }
}