import {AbstractPatternGenerator} from "./AbstractPatternGenerator.js";
import {CanvasInfo, CompositeGenerators, FigureData, FigureType, FormState} from "../types.js";
import {PatternGenerator} from "./types.js";
import {Vector2} from "../math/vector.js";
import {Global} from "../Global.js";

export class CompositePatternGenerator extends AbstractPatternGenerator {
  public readonly childGenerators: CompositeGenerators = {};

  constructor(protected canvas: CanvasInfo) {
    super(canvas);

    if(this.onRegisterChildGenerators !== CompositePatternGenerator.prototype.onRegisterChildGenerators) {
      this.childGenerators = this.onRegisterChildGenerators();
    }
  }

  /**
   * Override method in derived class to register child generators
   */
  protected onRegisterChildGenerators(): CompositeGenerators{
    throw new Error('It must not be called at all wtf');
  }

  protected addGenerator(field: keyof FigureData, generator: AbstractPatternGenerator): void
  {
    // this.childGenerators.set(field, generator);
  }

  protected getNextValue(state?: FormState, done: boolean = false): FigureData {
    const compositeFigure: FigureData = {
      index: this.index++,
      type: FigureType.Svg,
      position: Vector2.Zero(),
      size: new Vector2(30, 30),
      scale: 1,
    };

    const exceptions: Array<keyof Partial<FigureData>> = ['scale', 'size'];

    for (const [name, generator] of Object.entries(this.childGenerators)) {
      if (name in compositeFigure && !(exceptions as string[]).includes(name)) {
        console.warn(`Composite figure already has a property with name ${name}`);
      }
      Object.assign(compositeFigure, generator.next(state).value);
    }
    return compositeFigure;
  }

  protected getNextCompositeValue(state?: FormState, done: boolean = false): FigureData
  {
    return this.getNextValue(state, done);
  }

  public getResult(state: FormState): FigureData[] {
    return [];
  }

  public reset(skipSteps: number = 0): void {
    const random = Global.GetRandomGenerator();
    this.skipRandom = () => Math.floor(random() * 10);
    const getSkipSteps = () => Math.floor(this.skipRandom() * 10);

    for (const [name, generator] of Object.entries(this.childGenerators)) {
      generator.reset(getSkipSteps());
    }
  }
}