import {SvgExportDebugOptions} from "./types.js";
import {deepMerge} from "./helpers.js";

export const DEBUG_OPTIONS: SvgExportDebugOptions = {
  id: {
    visible: false,
  },
  origin: {
    visible: false,
    size: 5,
    color: '#ff0000',
  },
  boundingBox: {
    visible: false,
    color:'#a3f15e',
  },
}

export const getDebugOptions = (): SvgExportDebugOptions => {
  const r = {
    origin: {
      visible: window.State.data.debug.showPositions,
    },
    boundingBox: {
      visible: window.State.data.debug.showBounding,
    },
  } as Partial<SvgExportDebugOptions>;
  return deepMerge({}, DEBUG_OPTIONS, r)
}