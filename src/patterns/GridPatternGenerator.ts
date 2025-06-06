import { AbstractPatternGenerator } from "./AbstractPatternGenerator.js";
import { DeepPartial, FigureData, FigureType, FormState, RandomGenerator } from "../types.js";
import { createFormState, degToRads, isSvgData, wrapIndex } from "../helpers.js";
import { Vector2 } from "../math/vector.js";
import { Global } from "../Global.js";

export class GridPatternGenerator extends AbstractPatternGenerator
{
  private _typeRandom: RandomGenerator;
  private _idRandom: RandomGenerator;
  private _positionRandom: RandomGenerator;
  private _rotationRandom: RandomGenerator;
  private _colorRandom: RandomGenerator;

  private lastPosition: Vector2 = Vector2.Zero();

  private getNextPosition(spacing: Vector2): Vector2
  {
    const canvasSize = this.canvas.size;
    const { x: w, y: h } = canvasSize;
    const x = wrapIndex(w, this.lastPosition.x + spacing.x);
    const y = wrapIndex(h, this.lastPosition.y + spacing.y);
    this.lastPosition = new Vector2(x, y);

    return new Vector2(x/w, y/h);
  }

  protected getNextValue(state?: FormState, done: boolean = false): FigureData {
    const _state = createFormState(state as DeepPartial<FormState>);
    const figure: FigureData = {
      index: this.index++,
      // type: Math.floor(this._typeRandom() * Object.keys(FigureType).length / 2),
      type: FigureType.Svg,
      size: Vector2.One(),
      scale: 1,
      position: this.getNextPosition(_state.grid.size),
      color: _state.colorValues[Math.floor(this._colorRandom() * _state.color.size)],
    };

    console.log(figure.position);

    if (isSvgData(figure)) {
      // const id = Math.floor(this._idRandom() * State._shapes.length);
      // figure.id = /*shapeIds[id] ||*/ toDecimalString(id);
      const randRotation = this._rotationRandom() * _state.rotationRandom;
      figure.rotation = degToRads(_state.baseRotation + randRotation);
    }
    return figure;
  }

  public getResult(state: FormState): FigureData[] {
    return [];
  }

  public reset() {
    const skipRandom = Global.GetRandomGenerator();
    const getSkipSteps = () => Math.floor(skipRandom() * 50);

    this._idRandom = Global.GetRandomGenerator().skip(getSkipSteps());
    this._positionRandom = Global.GetRandomGenerator();
    this._rotationRandom = Global.GetRandomGenerator();
    this._typeRandom = Global.GetRandomGenerator().skip(getSkipSteps());
    this._colorRandom = Global.GetRandomGenerator().skip(getSkipSteps());
  }
}