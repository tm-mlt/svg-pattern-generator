import {
  DeepPartial,
  DistributionType,
  FigureData,
  FigureType,
  FormState,
  RandomGenerator,
  SvgFigureData,
  TypedFigureData
} from "./types.js";
import {Vector2} from "./math/vector.js";

export const createElement: typeof document.createElement =
  document.createElement.bind(document);

export const getElementById: typeof document.getElementById =
  document.getElementById.bind(document);

export const emitGlobalEvent = (type: string, detail?: any) =>
  document.dispatchEvent(new CustomEvent(type, {detail}))
export const onGlobalEvent = (type: string, handler: (e: CustomEvent) => void) => {
  document.addEventListener(type, handler as (e: Event) => void);
}

/*export const debounce = <T>(callback: (...args: any[]) => void, wait: number) => {
  let timeoutId: number | null = null;
  return (...args: any[]): void => {
    window.clearTimeout(timeoutId as number);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
}*/

export const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

/**
 * Creates seeded random generator
 */
function splitmix32(a: number): RandomGenerator & ThisType<RandomGenerator> {
  function seededRandom() {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    let t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }

  (seededRandom as RandomGenerator).skip = (steps) => {
    let stepsLeft = steps;
    while (steps-- > 0) {
      seededRandom();
    }
    return seededRandom as RandomGenerator;
  }

  return seededRandom as RandomGenerator;
}

export const createRandomSeed = () => (Math.random() * 2 ** 32) >>> 0;
export const createSeededRandom = (seed: number): RandomGenerator => {
  return splitmix32(seed);
}

export const toDecimalString = (n: number) => n.toString.call(n, 10);
export const parseFloat = (n: string) => Number.parseFloat(n);
export const parseDecimal = (n: string) => Number.parseInt(n, 10);

export const isBoolean = (val: unknown): val is boolean => val === true || val === false;
export const toBoolean = (val: string) => isBoolean(val) ? val : val?.toLowerCase() === 'true';

export const isSvgData = (data: TypedFigureData): data is SvgFigureData => data.type === FigureType.Svg;

export const degToRads = (degrees: number) => degrees * Math.PI / 180;
export const radsToDeg = (radians: number) => radians / Math.PI * 180;
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const createFormState = (origin: DeepPartial<FormState> = {}): FormState => {
  const defaults: FormState = {
    canvas: {
      width: 100,
      height: 100,
    },
    figures: new Map(),
    amount: 0,
    baseHeight: 10,
    scaleRandom: { min: 0.25, max: 2 },
    baseRotation: 0,
    rotationRandom: 0,
    color: new Map(),
    get colorValues(): string[] {
      return Array.from(this.color.values());
    },
    ratio: [],
    positions: DistributionType.None,
    grid: {
      size: Vector2.Zero(),
    },
    blueNoise: {
      minimalDistance: 1,
    },
    seed: 0,

    debug: {
      showIds: false,
      showPositions: false,
      showBounding: false,
    }
  };
  return deepMerge({}, defaults, origin);
}

/**
 * Returns wrapped index
 * for length = 5
 *
 * @example
 * wrapIndex(5, 0) // 0
 * wrapIndex(5, 1) // 1
 * wrapIndex(5, -1) // 4
 * wrapIndex(5, -11) // 4
 * wrapIndex(5, 5) // 0
 * wrapIndex(5, 11) // 1
 * wrapIndex(0, 1) // 0
 * wrapIndex(-5, 1) // 0 but don't
 */
export const wrapIndex = (length: number, index: number): number => {
  const l = Math.max(1, length);
  return (index % l + l) % l;
}

export const toTypeString = (value: unknown): string =>
  Object.prototype.toString.call(value);
export const isObject = (val: unknown): val is Object =>
  val !== null && typeof val === 'object'
export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === '[object Object]'
export const isArray = <T>(val: unknown): val is Array<T> =>
  isObject(val) && Array.isArray(val);

export const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(clipText => console.log(clipText));
}

export const deepMerge = (
  ...sources: any[]
): any => {
  if(!sources.length) {
    return {};
  }

  const result = sources.shift();

  for (const source of sources) {
    if(!isObject(source)) {
      continue;
    }

    for (const key in source) {
      if (isArray(result[key]) && isArray(source[key])) {
        // result[key] = [...result[key], ...source[key]];
        //@ts-ignore
        Object.defineProperty(result, key, Object.getOwnPropertyDescriptor(source, key));
      } else if (isPlainObject(result[key]) && isPlainObject(source[key])) {
        deepMerge(result[key], source[key]);
      } else {
        //@ts-ignore
        Object.defineProperty(result, key, Object.getOwnPropertyDescriptor(source, key));
        // result[key] = source[key];
      }
    }
  }

  return result;
}