import {AbstractPatternGenerator} from "../AbstractPatternGenerator.js";
import {CanvasInfo, DeepPartial, FigureData, FormState, RandomGenerator} from "../../types.js";
import {clamp, createFormState} from "../../helpers.js";
import {Global} from "../../Global.js";


export type ScaleGeneratorOptions = {
  min: () => number,
  max: () => number,
}

export class RandomScaleGenerator extends AbstractPatternGenerator {
  private _sizeRandom: RandomGenerator;

  private minScale: () => number;
  private maxScale: () => number;

  constructor(protected canvas: CanvasInfo, options: ScaleGeneratorOptions) {
    super(canvas);

    this.minScale = options.min;
    this.maxScale = options.max;
  }

  protected getNextValue(state?: FormState): FigureData {
    const min = this.minScale();
    const max = this.maxScale();
    const scale = clamp(this._sizeRandom() * (max - min) + min, min, max);
    return ({
      scale,
    }) as FigureData;
  }

  public getResult(state: FormState): FigureData[] {
    return [];
  }

  public reset(skipSteps: number): void {
    this._sizeRandom = Global.GetRandomGenerator(skipSteps)
  }
}