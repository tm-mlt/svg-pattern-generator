import {AbstractPatternGenerator} from "./AbstractPatternGenerator.js";
import {DeepPartial, FigureData, FormState, RandomGenerator} from "../types.js";
import {Global} from "../Global.js";
import {createFormState} from "../helpers.js";

export class RandomColorPatternGenerator extends AbstractPatternGenerator
{
    private _colorRandom: RandomGenerator;

    protected getNextValue(state?: FormState): FigureData {
        const _state = createFormState(state as DeepPartial<FormState>);
        return ({
            color: _state.colorValues[Math.floor(this._colorRandom() * _state.color.size)],
        }) as FigureData;
    }

    public getResult(state: FormState): FigureData[] {
        return [];
    }

    public reset(skipSteps: number): void {
        this._colorRandom = Global.GetRandomGenerator(skipSteps)
    }
}