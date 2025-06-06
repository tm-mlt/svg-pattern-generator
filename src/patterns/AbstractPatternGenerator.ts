import { PatternGenerator } from "./types.js";
import {CanvasInfo, FigureData, FormState} from "../types.js";
import {Global} from "../Global.js";

export abstract class AbstractPatternGenerator implements PatternGenerator<FigureData, FigureData, FormState> {
  protected skipRandom: () => number = Global.GetRandomGenerator();
  protected index: number = 0;
  constructor(protected canvas: CanvasInfo) {
    // this.reset();
  }

  protected abstract getNextValue(state?: FormState): FigureData;

  public next(state?: FormState): IteratorResult<FigureData> {
    return this.getIterationResult(this.getNextValue(state));
  }

  public return(state?: FormState): IteratorResult<FigureData> {
    return this.getIterationResult(this.getNextValue(state), true);
  }

  public abstract getResult(state: FormState): FigureData[];

  public throw(e?: any): IteratorResult<FigureData> {
    console.error(e);
    return {value: undefined, done: true};
  }

  public abstract reset(skipSteps?: number): void;

  protected getIterationResult(value: FigureData, done: boolean = false): IteratorResult<FigureData> {
    return ({
      value,
      done,
    }) as IteratorResult<FigureData>;
  }
}