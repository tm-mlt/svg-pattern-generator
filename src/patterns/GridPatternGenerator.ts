import {AbstractPatternGenerator} from "./AbstractPatternGenerator.js";
import {CompositeGenerators, DeepPartial, FigureData, FigureType, FormState, RandomGenerator} from "../types.js";
import {clamp, createFormState, degToRads, isSvgData, toDecimalString, wrapIndex} from "../helpers.js";
import {Vector2} from "../math/vector.js";
import {Global} from "../Global.js";
import {CompositePatternGenerator} from "./CompositePatternGenerator.js";
import {RandomColorPatternGenerator} from "./RandomColorPatternGenerator.js";
import {RandomScaleGenerator} from "./scale/RandomScaleGenerator.js";
import {RandomFigurePatternGenerator} from "./RandomFigurePatternGenerator.js";

export class GridPatternGenerator extends CompositePatternGenerator {
  private _typeRandom: RandomGenerator;
  private _positionRandom: RandomGenerator;
  private _rotationRandom: RandomGenerator;

  protected override onRegisterChildGenerators(): CompositeGenerators {
    return Object.fromEntries([
      ['color', new RandomColorPatternGenerator(this.canvas)],
      ['scale', new RandomScaleGenerator(this.canvas, {
        min: () => window.State.data.scaleRandom.min,
        max: () => window.State.data.scaleRandom.max,
      })],
      ['id', new RandomFigurePatternGenerator(this.canvas)],
    ]) as CompositeGenerators;
  }

  private maxWidth: number = 0;
  private maxHeight: number = 0;
  private shapesUsed: number[] = [];

  private getNextPosition(spacing: Vector2): Vector2 {
    const canvasSize = this.canvas.size;
    const {x: w, y: h} = canvasSize;
    const x = spacing.x + this.index % this.maxWidth * spacing.x;

    const rowIndex = Math.floor(this.index / this.maxWidth);
    const y = spacing.y + spacing.y * rowIndex;
    return  new Vector2(x, y);
  }

  private getAmount(stateAmount: number): number {
    const maxFill = this.maxWidth * this.maxHeight;
    return (clamp(stateAmount, 0, maxFill) || maxFill);
  }

  protected getNextValue(state?: FormState, done: boolean = false): FigureData {
    const _state = createFormState(state as DeepPartial<FormState>);
    const figure = super.getNextValue(_state);
    figure.position = this.getNextPosition(_state.grid.size);

    if (isSvgData(figure)) {
      const randRotation = this._rotationRandom() * _state.rotationRandom;
      figure.rotation = degToRads(_state.baseRotation + randRotation);
    }
    return figure;
  }

  public getResult(state: FormState): FigureData[] {
    let i = 0;
    const {x: w, y: h} = state.grid.size;
    this.maxWidth = Math.floor((this.canvas.size.x - w) / w);
    this.maxHeight = Math.floor((this.canvas.size.y - h) / h);

    const result: FigureData[] = [];
    while (i < this.getAmount(state.amount)) {
      result[i] = this.getNextValue(state);
      i++;
    }

    return result;
  }

  public reset(skipSteps?: number) {
    super.reset(skipSteps);

    const skipRandom = Global.GetRandomGenerator();
    const getSkipSteps = () => Math.floor(skipRandom() * 50);

    this._positionRandom = Global.GetRandomGenerator();
    this._rotationRandom = Global.GetRandomGenerator();
    this._typeRandom = Global.GetRandomGenerator().skip(getSkipSteps());
  }
}