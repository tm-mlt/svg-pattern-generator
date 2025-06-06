import { Vector2 } from "./math/vector.js";
import {validateInputNumber, validatePass, validateRatio, validateSvgFigures} from "./view/validators.js";
import {AbstractPatternGenerator} from "./patterns/AbstractPatternGenerator.js";

type IsAny<T> = unknown extends T & string ? true : false;
export type DeepPartial<T> = T extends any[] ? T : {
  [P in keyof T]?: T[P] extends Array<infer I>
    ? Array<DeepPartial<I>>
    : DeepPartial<T[P]>;
};

export enum FigureType {
  Dot,
  Svg,
}

export type FigureData = {
  index: number,
  type: FigureType,
  position: Vector2,
  size?: Vector2,
  scale: number,
  color?: string,
  // in radians
  rotation?: number,
};

export type DebugFigureData = FigureData & {
  type: FigureType.Dot,
}

export type SvgFigureData = Required<FigureData> & {
  type: FigureType.Svg,
  id: string,
  // in radians
  rotation: number,
}

export type TypedFigureData = { type: FigureType } & FigureData

export type Pattern = {
  distribution: DistributionType,
  figures: FigureData[],
}
// export type RandomGenerator = () => number;
export interface RandomGenerator {
  (): number;
  skip(steps: number): this;
  // TODO
  // last(): number;
}

export const enum DistributionType {
  None,
  Random = "random",
  Grid = "grid",
  BlueNoise = "blueNoise",
}

declare global {
  interface Window { State: AppState; }
}

export type AppState = {
  _platform: {
    pixelRatio: number,
  },
  _canvas: CanvasInfo,
  _shapes: SVGSVGElement[],
  _shapeImages: Map<string, HTMLImageElement>,
  _coloredShapes: Map<string, ImageBitmap>,
  _generated: FigureData[],
  data: FormState,
}

export interface CanvasInfo {
  size: Vector2;
  readonly element: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  scaleCanvasToPixelRatio(pixelRatio: number): void
}

export type FormStateInputs = {
  canvasWidth: HTMLInputElement,
  canvasHeight: HTMLInputElement,
  figures: HTMLTextAreaElement,
  amount: HTMLInputElement,
  baseHeight: HTMLInputElement,
  scaleRandomMin: HTMLInputElement,
  scaleRandomMax: HTMLInputElement,
  baseRotation: HTMLInputElement,
  rotationRandom: HTMLInputElement,
  ratio: RadioNodeList,
  positions: HTMLInputElement,
  // grid settings
  gridSize: HTMLInputElement,
  // blue noise settings
  blueNoiseMinimalDistance: HTMLInputElement,
  // end blue noise
  seed: HTMLInputElement,
  'color[]': RadioNodeList,
  debugShowIds: HTMLInputElement,
  debugShowPositions: HTMLInputElement,
  debugShowBounding: HTMLInputElement,
}

export type FormElements = HTMLFormControlsCollection & FormStateInputs
export type FormStateValidations = Exclude<keyof FormStateInputs, number | '[Symbol.iterator]' | 'length' | 'namedItem' | 'item'>

export type FormState = {
  canvas: {
    width: number,
    height: number,
  },
  figures: Map<string, SVGSVGElement>,
  amount: number,
  baseHeight: number,
  scaleRandom: { min: number, max: number },
  baseRotation: number,
  rotationRandom: number,
  ratio: number[],
  positions: DistributionType,
  grid: GridSettings,
  blueNoise: BlueNoiseSettings,
  seed: number,
  color: Map<string, string>,
  /** @readonly */
  readonly colorValues: string[],
  debug: {
    showIds: boolean,
    showPositions: boolean,
    showBounding: boolean,
  }
}

export type GridSettings = {
  size: Vector2,
}

export type BlueNoiseSettings = {
  minimalDistance: number;
}


export type FormUpdate = {
  event?: Event,
  data: FormData,
  form: HTMLFormElement,
}

export interface SvgExportDebugOptions {
  id: {
    visible: boolean,
  },
  origin: {
    visible: boolean,
    size: number,
    color: string,
  },
  boundingBox: {
    visible: boolean,
    color: string,
  },
}

export type CompositeGenerators = Partial<Record<keyof FigureData, AbstractPatternGenerator>>;
