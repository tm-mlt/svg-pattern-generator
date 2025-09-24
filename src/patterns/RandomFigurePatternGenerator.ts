import {CompositePatternGenerator} from "./CompositePatternGenerator.js";
import {DeepPartial, FigureData, FormState, RandomGenerator, SvgFigureData} from "../types.js";
import {Global} from "../Global.js";
import {createFormState} from "../helpers.js";

export class RandomFigurePatternGenerator extends CompositePatternGenerator {
  private _idRandom: RandomGenerator;

  protected getNextValue(state?: FormState): FigureData {
    const _state = createFormState(state as DeepPartial<FormState>);
    const shapeIds = Array.from(_state.figures.keys());
    const {ratio: ratios} = _state;

    const totalWeight = _state.ratio.reduce((sum, i) => sum + i, 0);
    const rnd = Math.floor(totalWeight * this._idRandom());

    let id: string = '';
    let cumulativeWeight = 0;
    for (const i in ratios) {
      cumulativeWeight += ratios[i];
      if(rnd < cumulativeWeight) {
        id = shapeIds[i];
        break;
      }
    }

    return ({
      id,
    }) as SvgFigureData;
  }

  public reset(skipSteps?: number) {
    super.reset(skipSteps);

    const skipRandom = Global.GetRandomGenerator();
    const getSkipSteps = () => Math.floor(skipRandom() * 50);

    this._idRandom = Global.GetRandomGenerator().skip(getSkipSteps());
  }
}