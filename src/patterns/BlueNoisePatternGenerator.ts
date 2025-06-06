import {AbstractPatternGenerator} from "./AbstractPatternGenerator.js";
import {CompositeGenerators, DeepPartial, FigureData, FigureType, FormState, RandomGenerator} from "../types.js";
import {createFormState, degToRads, isSvgData, parseDecimal, toDecimalString, wrapIndex} from "../helpers.js";
import {Vector2} from "../math/vector.js";
import {Global} from "../Global.js";
import {poissonDiskSampling} from "../math/poisson.js";
import {CompositePatternGenerator} from "./CompositePatternGenerator.js";
import {RandomColorPatternGenerator} from "./RandomColorPatternGenerator.js";
import {RandomScaleGenerator} from "./scale/RandomScaleGenerator.js";

export class BlueNoisePatternGenerator extends CompositePatternGenerator {
  private _poissonRandom: RandomGenerator;
  private _idRandom: RandomGenerator;
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

  public reset(skipSteps?: number) {
    super.reset(skipSteps);

    this._idRandom = Global.GetRandomGenerator(this.skipRandom());
    this._rotationRandom = Global.GetRandomGenerator(this.skipRandom());
    this._poissonRandom = Global.GetRandomGenerator(this.skipRandom());
  }

  public getResult(state: FormState): FigureData[] {
    const positions = poissonDiskSampling(
      state.blueNoise.minimalDistance, 50, this.canvas.size, this._poissonRandom,
    );
    const arr = positions.map(position => ({position})) as FigureData[];
    const shapeIds = Array.from(state.figures.keys());

    const {ratio: ratios} = state;
    const shapesUsed: number[] = new Array(shapeIds.length).fill(0);

    for (let i = 0; i < arr.length; i++) {
      const {color, index, scale} = this.next(state).value;
      const figure: FigureData = arr[i];
      figure.type = FigureType.Svg;
      figure.color = color;
      figure.index = index;
      figure.scale = scale;
      if (isSvgData(figure)) {
        let id = wrapIndex(shapeIds.length, Math.floor(this._idRandom() * shapeIds.length * 2.5));
        // let id = Math.floor(this._idRandom() * shapeIds.length);
        const startedFrom = id;
        while (shapesUsed[id] >= ratios[id] * 0.01 * positions.length) {
        // while (shapesUsed[id] >= ratios[id] * 0.01 * arr.length) {
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

        if(state.baseHeight) {
          const shape = state.figures.get(figure.id)!;
          const width = parseDecimal(shape.getAttribute('width')! ?? 100);
          const height = parseDecimal(shape.getAttribute('height')! ?? 100);
          const ratio = state.baseHeight / height;
          figure.size = new Vector2(width * ratio, height * ratio);
        }
      }
    }
    return arr;
  }
}