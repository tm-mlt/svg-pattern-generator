import { FormState } from "../types";

export type PatternGenerator<T = any, TReturn = T, State = any> = {
  next(state?: State): IteratorResult<T, TReturn>;
  return(state?: State): IteratorResult<T, TReturn>;
  throw(e?: any): IteratorResult<T, TReturn>;
  reset(skipSteps?: number): void;
  getResult(state: State): T[];
}