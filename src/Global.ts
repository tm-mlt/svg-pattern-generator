import { FigureData, RandomGenerator } from "./types.js";
import { createRandomSeed, createSeededRandom, emitGlobalEvent } from "./helpers.js";
import { PatternGenerator } from "./patterns/types";
import { RandomPatternGenerator } from "./patterns/RandomPatternGenerator.js";
import { Vector2 } from "./math/vector.js";

export class Global {
  public static SEED_CHANGE_EVENT = "seed-change" as const;
  public static SVG_LOADED_EVENT = "svg-loaded" as const;

  private skipRandom = Global.GetRandomGenerator();
  private static _seededRandom: RandomGenerator;
  private static _seed: number;

  private static _randoms: Set<RandomGenerator> = new Set();

  public static get Seed() {
    return this._seed;
  }

  private static _patternGenerator: PatternGenerator;

  public static get PatternGenerator(): PatternGenerator<FigureData> {
    return this._patternGenerator;
  }

  public static set PatternGenerator(value)
  {
    this._patternGenerator = value;
    this.ResetRandom();
  }

  public static set Seed(value) {
    if (value === this.Seed) {
      return;
    }
    this._seed = value;
    this.ResetRandom();

    emitGlobalEvent(Global.SEED_CHANGE_EVENT, this.Seed);
  }

  public static Init(seed: number) {
    this._seed = seed;
    // this._patternGenerator = new RandomPatternGenerator();
    // this.ResetRandom();
  }


  public static ResetRandom(): void
  {
    this._seededRandom = createSeededRandom(this.Seed);
    this.PatternGenerator.reset();
  }

  public static GetRandomGenerator(skipSteps: number = 0) {
    return createSeededRandom(this.Seed).skip(skipSteps);
  }
}