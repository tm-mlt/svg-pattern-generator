import {AbstractPatternGenerator} from "./AbstractPatternGenerator.js";
import {
  CompositeGenerators,
  DeepPartial,
  FigureData,
  FigureType,
  FormState,
  RandomGenerator,
  TypedFigureData
} from "../types.js";
import {Global} from "../Global.js";
import {createFormState, degToRads, isSvgData, toDecimalString, wrapIndex} from "../helpers.js";
import {Vector2} from "../math/vector.js";
import {CompositePatternGenerator} from "./CompositePatternGenerator.js";
import {RandomColorPatternGenerator} from "./RandomColorPatternGenerator.js";
import {RandomScaleGenerator} from "./scale/RandomScaleGenerator.js";

export class RandomPatternGenerator extends CompositePatternGenerator {
  private _typeRandom: RandomGenerator;
  private _idRandom: RandomGenerator;
  private _positionRandom: RandomGenerator;
  private _rotationRandom: RandomGenerator;

  protected override onRegisterChildGenerators(): CompositeGenerators {
    return Object.fromEntries([
      ['color', new RandomColorPatternGenerator(this.canvas)],
      ['scale', new RandomScaleGenerator(this.canvas, {
        min: () => window.State.data.scaleRandom.min,
        max: () => window.State.data.scaleRandom.max,
      })],
    ]) as CompositeGenerators;
  }

  protected getNextValue(state?: FormState, done: boolean = false): FigureData {
    const _state = createFormState(state as DeepPartial<FormState>);
    const figure = super.getNextValue(_state);
    figure.position = new Vector2(this._positionRandom(), this._positionRandom());

    if (isSvgData(figure)) {
      // const id = Math.floor(this._idRandom() * State._shapes.length);
      // figure.id = /*shapeIds[id] ||*/ toDecimalString(id);
      const randRotation = this._rotationRandom() * _state.rotationRandom;
      figure.rotation = degToRads(_state.baseRotation + randRotation);
    }
    return figure;
  }

  public getResult(state: FormState): FigureData[] {
    const arr: FigureData[] = [];
    const shapeIds = Array.from(state.figures.keys());

    const {ratio: ratios} = state;
    const shapesUsed: number[] = new Array(shapeIds.length).fill(0);

    for (let i = 0; i < state.amount; i++) {
      const nextFigure = this.next(state).value;
      // const type = Math.floor(randomType() * Object.keys(FigureType).length / 2);
      const figure: FigureData = Object.assign(nextFigure, {
        // type,
        position: {
          x: nextFigure.position.x * this.canvas.size.x,
          y: nextFigure.position.y * this.canvas.size.y,
        },
        // color,
      });
      if (isSvgData(figure)) {
        let id = Math.floor(this._idRandom() * shapeIds.length);
        const startedFrom = id;
        while (shapesUsed[id] >= ratios[id] * 0.01 * state.amount) {
          id = wrapIndex(shapeIds.length, id + 1);
          // if(ratios[id] === 0) {
          //   continue;
          // }
          if (id === startedFrom) {
            break;
          }
        }
        figure.id = shapeIds[id] || toDecimalString(id);
        shapesUsed[id]++;

        const randRotation = this._rotationRandom() * state.rotationRandom * 2 - state.rotationRandom;
        figure.rotation = degToRads(state.baseRotation + randRotation);
      }
      arr.push(figure);
    }

    return arr;
  }

  public override reset(skipSteps?: number) {
    super.reset(skipSteps);

    const skipRandom = Global.GetRandomGenerator();
    const getSkipSteps = () => Math.floor(skipRandom() * 50);

    this._idRandom = Global.GetRandomGenerator().skip(getSkipSteps());
    this._positionRandom = Global.GetRandomGenerator();
    this._rotationRandom = Global.GetRandomGenerator().skip(getSkipSteps());
    this._typeRandom = Global.GetRandomGenerator().skip(getSkipSteps());
  }
}