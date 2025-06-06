import { FieldError } from "../errors.js";
import { getElementById } from "../helpers.js";
import { parseSvg, svgToSymbols } from "../svg.js";

export const validatePass = (v: string) => v;
export const validateInputNumber = (v: string) => Number.parseFloat(v);

export function validateRatio(input: string): number[] {
  const probabilities = input
    .trim()
    .split(":")
    .map(i => Number.parseFloat(i));

  const nanIndex = probabilities.findIndex(v => Number.isNaN(v));
  if (nanIndex > -1) {
    throw new FieldError(`Is not a number at ${nanIndex} position`, probabilities);
  }

  return probabilities;
}

export const validateSvgFigures = (v: string): Map<string, SVGSVGElement> => {
  try {
    const svgs = parseSvg(v);
    // svgs.forEach(svg => svg.setAttribute("fill", "rgb(233, 70, 144)"));
    return new Map(svgs.map(v => [v.id, v]));
  } catch (e) {
    console.error(e);
    return new Map();
  }
}
