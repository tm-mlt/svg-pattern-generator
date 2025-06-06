import {Vector2} from "./vector.js";
import {Transform} from "./Transform.js";

export class OrientedBoundingBox
{
  public readonly transform: Transform;
  public get center(): Vector2
  {
    return this.transform.position.add(this.transform.size.multiply(0.5));
  }

  constructor(center: Vector2, halfSize: Vector2) {
    this.transform.position = center.subtract(halfSize);
    this.transform.size = halfSize.multiply(2);
  }

  public intersectOBB(target: OrientedBoundingBox): boolean
  {


    return true;
  }

  public distanceToOOB(target: OrientedBoundingBox): number
  {
    const pointerVector = target.center.subtract(this.center);

    return 0;
  }
}