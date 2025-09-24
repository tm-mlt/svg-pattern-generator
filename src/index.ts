import {
  AppState,
  DebugFigureData,
  DeepPartial,
  DistributionType,
  FigureData,
  FigureType,
  FormElements,
  FormState,
  FormStateValidations,
  FormUpdate,
  SvgFigureData
} from "./types.js";
import {
  createElement,
  createFormState,
  createRandomSeed,
  debounce, deepMerge,
  emitGlobalEvent,
  getElementById,
  onGlobalEvent,
  parseDecimal, parseFloat, radsToDeg,
  toBoolean,
  toDecimalString
} from "./helpers.js";
import {Global} from "./Global.js";
import {parseSvg, saveToClipboard, saveToFile, svgToSymbols} from "./svg.js";
import {validateInputNumber, validatePass, validateRatio, validateSvgFigures} from "./view/validators.js";
import {createOffscreenCanvas} from "./offscreenCanvas.js";
import {updateSliders} from "./view/sliders.js";
import {Vector2} from "./math/vector.js";
import {GridPatternGenerator} from "./patterns/GridPatternGenerator.js";
import {RandomPatternGenerator} from "./patterns/RandomPatternGenerator.js";
import {BlueNoisePatternGenerator} from "./patterns/BlueNoisePatternGenerator.js";
import {CanvasHelper} from "./CanvasHelper.js";
import {DEBUG_OPTIONS} from "./debug.js";

const FORM_IDS = {
  FORM: "setting-form",
  VARIANTS: "setting-figures",
  AMOUNT: "setting-amount",
  BASE_HEIGHT: "setting-base-height",
  BASE_ROTATION: "setting-base-rotation",
  ROTATION_RANDOM: "setting-rotation-random",
  RATIO: "setting-ratio",
  SEED: "setting-seed",
  GENERATE_BUTTON: "generate",
  RANDOM_SEED_BUTTON: "create-seed",
  COPY_SVG_CLIPBOARD_BUTTON: "copy-svg-to-clipboard",
  COPY_SVG_FILE_BUTTON: "copy-svg-to-file",
}

const State: AppState = {
  _platform: {
    pixelRatio: 1,
  },
  _canvas: new CanvasHelper(createElement("canvas")),
  _shapes: [],
  _shapeImages: new Map(),
  _coloredShapes: new Map(),
  _generated: [],
  data: createFormState({
    figures: new Map(),
    amount: 250,
    baseHeight: 30,
    // scaleRandom
    baseRotation: 0,
    rotationRandom: 0,
    color: new Map(),
    ratio: [20, 20, 20, 20, 20],
    positions: DistributionType.Grid,
    grid: {
      size: new Vector2(100),
    },
    seed: 3010397292,
    debug: {
    }
  }),
}

let remove: () => void;
const updatePixelRatio = (e?: Event) => {
  console.log(e);
  if (remove != null) {
    remove();
  }

  State._platform.pixelRatio = window.devicePixelRatio ?? 1;
  onSubmit();

  const mqString = `(resolution: ${window.devicePixelRatio}dppx)`;
  const media = matchMedia(mqString);
  media.addEventListener("change", updatePixelRatio);
  remove = () => {
    media.removeEventListener("change", updatePixelRatio);
  };
};

Global.Init(State.data.seed);
Global.PatternGenerator = new RandomPatternGenerator(State._canvas);
(window as any).GLOBAL = Global;
(window as any).State = State;

const canvas: HTMLCanvasElement = State._canvas.element;
State._canvas.size = new Vector2(800, 500);
const context: CanvasRenderingContext2D = State._canvas.context;

function scaleCanvasToPixelRatio() {
  canvas.width = State._canvas.size.x * State._platform.pixelRatio;
  canvas.height = State._canvas.size.y * State._platform.pixelRatio;
  context.scale(State._platform.pixelRatio, State._platform.pixelRatio);
}

const offscreenCanvas = createOffscreenCanvas(State._canvas.size);

// (window as any).offscreenCanvas = offscreenCanvas;

function drawPattern(figures: FigureData[]) {
  State._coloredShapes.clear();
  context.fillStyle = "white";
  for (let index in figures) {
    const figure = figures[index];
    switch (figure.type) {
      case FigureType.Dot:
        drawDot(figure);
        break
      case FigureType.Svg:
        drawSvg(figure as SvgFigureData);
        break;
      default:
        drawDot(figure);
    }

    if(State.data.debug.showIds) {
      drawText(index, figure);
    }
    if(State.data.debug.showPositions) {
      drawDot({
        index: 0,
        type: FigureType.Dot,
        size: Vector2.One().multiply(5),
        scale: figure.scale,
        color: DEBUG_OPTIONS.origin.color,
        position: figure.position,
      });
    }
    if(State.data.debug.showBounding) {
      drawRect({
        index: 0,
        type: FigureType.Dot,
        size: figure.size,
        scale: figure.scale,
        color: DEBUG_OPTIONS.boundingBox.color,
        position: figure.position,
        rotation: figure.rotation,
      });
    }
  }

  State._coloredShapes.forEach(i => i.close());
}

function drawSvg(figure: SvgFigureData) {
  if (!State._shapeImages.has(figure.id)) {
    console.warn(`Shape with id = ${figure.id} not found`);
    return;
  }
  const {pixelRatio} = State._platform;
  const {x, y} = figure.position;
  const image = State._shapeImages.get(figure.id) as HTMLImageElement;
  const initHeight = image.naturalHeight;
  const initWidth = image.naturalWidth;
  const ratio = State.data.baseHeight / initHeight;

  const unscaledSize = new Vector2(initWidth * ratio, State.data.baseHeight);

  const maxScale = State.data.scaleRandom.max;
  const upscaledSize = new Vector2(unscaledSize.x, unscaledSize.y).multiply(maxScale);

  const width = unscaledSize.x * figure.scale;
  const height = unscaledSize.y * figure.scale;

  context.save();

  context.translate(x, y);
  context.rotate(figure.rotation ?? 0);
  if (figure.color) {
    const coloredShapeId = figure.id + figure.color;
    if (!State._coloredShapes.has(coloredShapeId)) {
      // render upscaled to possible max
      offscreenCanvas.color(image, figure.color, upscaledSize);
      State._coloredShapes.set(coloredShapeId, offscreenCanvas.getImage());
    }
    const coloredImage = State._coloredShapes.get(coloredShapeId)!;
    drawImage(
      coloredImage,
      0,
      0,
      upscaledSize.x * pixelRatio,
      upscaledSize.y * pixelRatio,
      -width / 2,
      -height / 2,
      width,
      height,
    );
  } else {
    drawImage(image, -width / 2, -height / 2, width, height);
  }
  context.restore();
  // context.resetTransform();
}

function drawRect(figure: FigureData): void
{
  const {x, y} = figure.position;
  // const {x: width, y: height} = figure.size!;
  const width = figure.size!.x * figure.scale;
  const height = figure.size!.y * figure.scale;
  if (figure.color) {
    context.strokeStyle = figure.color;
  }
  context.translate(x, y);
  context.rotate(figure.rotation!);
  context.beginPath();
  context.rect(- width * 0.5, - height * 0.5, width, height);
  // context.translate( width * 0.5, height * 0.5);
  context.closePath();
  context.stroke();
  context.resetTransform();
}

function drawText(text: string, figure: FigureData): void
{
  const {x, y} = figure.position;
  const {scale} = figure;
  const {x: width, y: height} = figure.size!;
  context.translate(x + width * scale, y);
  context.font = 'normal 18px sans-serif';
  context.fillStyle = '#fff';
  context.fillText(text, 0 , 0);
  context.resetTransform();
}

function drawDot(figure: FigureData) {
  const {x, y} = figure.position;
  const {x: width, y: height} = figure.size!;
  if (figure.color) {
    context.fillStyle = figure.color;
  }
  context.beginPath();
  context.arc(x, y, width * 0.5, 0, 2 * Math.PI);
  context.closePath();
  context.fill();
}

function drawImage(
  image: CanvasImageSource,
  dx: number,
  dy: number,
): void;
function drawImage(
  image: CanvasImageSource,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
): void;
function drawImage(
  image: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void;
function drawImage(
  image: CanvasImageSource,
  sx: number = 0,
  sy: number = 0,
  sw?: number,
  sh?: number,
  dx?: number,
  dy?: number,
  dw?: number,
  dh?: number,
  /*dx: number = 0,
  dy: number = 0,
  dWidth?: number,
  dHeight?: number,*/
): void {
  try {
    if (sw && sh && dx && dy) {
      context.drawImage(image, sx, sy, sw, sh, dx, dy, dw as number, dh as number);
    } else {
      context.drawImage(image, sx, sy, sw as number, sh as number);
    }
  } catch (e) {
    console.error(e);
  }
}

let backgroundCheckers: ImageBitmap;

function clearCanvas() {
  const {pixelRatio} = State._platform;
  const checkersSize = 100;
  const checkersCellSize = 8;
  if (!backgroundCheckers) {
    backgroundCheckers = getCheckersImage(new Vector2(checkersSize), checkersCellSize);
  }
  context.save();
  context.fillRect(0, 0, State._canvas.size.x, State._canvas.size.y);

  context.translate(-checkersCellSize / 2, -checkersCellSize / 2);

  for (let x = 0; x <= Math.ceil(State._canvas.size.x / checkersSize); x++) {
    for (let y = 0; y <= Math.ceil(State._canvas.size.y / checkersSize); y++) {
      context.drawImage(
        backgroundCheckers,
        0,
        0,
        checkersSize,
        checkersSize,
        x * checkersSize,
        y * checkersSize,
        checkersSize,
        checkersSize,
      );
    }
  }

  context.restore();
}

function getCheckersImage(
  size: Vector2,
  scale: number = 8,
  colorA: string = "#9b9b9b",
  colorB: string = "#646464",
): ImageBitmap {
  const ctx = offscreenCanvas.context;
  const {x, y} = size;
  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, size.x, size.y);
  ctx.fillStyle = colorB;

  const numberOfRows = scale;
  const numberOfColumns = scale;
  const w = x / numberOfColumns;
  const h = y / numberOfRows;
  for (let x = 0; x < numberOfRows; x++) {
    for (let y = 0, col = numberOfColumns / 2; y < col; y++) {
      ctx.rect(2 * y * w + (x % 2 ? 0 : w), x * h, w, h);
    }
  }
  ctx.fill();

  const image: ImageBitmap = offscreenCanvas.getImage();
  offscreenCanvas.clear();
  return image;
}

const validations: { [key in FormStateValidations]: (i: any) => any } = {
  canvasWidth: validateInputNumber,
  canvasHeight: validateInputNumber,
  gridSize: validateInputNumber,
  blueNoiseMinimalDistance: validateInputNumber,
  figures: validateSvgFigures,
  amount: validateInputNumber,
  baseHeight: validateInputNumber,
  scaleRandomMin: validatePass,
  scaleRandomMax: validatePass,
  ratio: validateRatio,
  baseRotation: validateInputNumber,
  rotationRandom: validateInputNumber,
  seed: validateInputNumber,
  'color[]': validatePass,
  positions: validatePass,
  debugShowPositions: validatePass,
  debugShowBounding: validatePass,
  debugShowIds: validatePass,
}

function updateUrlParams(form: FormData) {
  console.log('updateUrlParams');
  const onlyStrings = (i: [string, File | string]): i is [string, string] => typeof i[1] === "string";
  const searchParams = new URLSearchParams(Array.from(form).filter(onlyStrings).reverse());
  const url = new URL(location.pathname, location.origin);
  for (const [name, value] of searchParams) {
    url.searchParams.append(name, value);
  }
  history.replaceState(null, "", url);
}


document.addEventListener("DOMContentLoaded", () => {
  const defsRoot = getElementById("svg-defs") as HTMLElement;
  const canvasContainer = document.getElementById("canvas-container");
  if (!canvasContainer) {
    throw new Error(`Failed to find element with id "canvas-container"`);
  }
  // canvasContainer.innerHTML = "";
  canvasContainer.appendChild(canvas);

  updatePixelRatio();
  State._canvas.scaleCanvasToPixelRatio(State._platform.pixelRatio);
  // scaleCanvasToPixelRatio();

  const form = getElementById(FORM_IDS.FORM) as HTMLFormElement;
  const elements = form.elements as FormElements;

  updateSliders(Array.from(elements.ratio) as HTMLInputElement[]);
  const getFormUpdate = (data?: FormData, e?: Event): FormUpdate => ({
    event: e,
    data: data ?? new FormData(form),
    form,
  });
  form.addEventListener("change", (e) => {
    // console.log(e);
    const formUpdate = getFormUpdate(undefined, e);
    onFormUpdate(formUpdate);
    updateUrlParams(formUpdate.data);

    if ((e.target as HTMLInputElement).name === "color[]") {
      updateColorList((e.target as HTMLInputElement).value);
    }
  });

  const debouncedOnFormUpdate = debounce(onFormUpdate, 5);
  form.addEventListener("input", (e) => {
    // console.log(e);
    const formData = new FormData();
    const input = (e.target as HTMLInputElement);
    formData.set(input.name, input.value);
    debouncedOnFormUpdate(getFormUpdate(formData, e));
  });

  const colorList = form.querySelector('#color-list') as HTMLDataListElement;
  const updateColorList = (color: string) => {
    if (colorList.querySelectorAll(`[value="${color}"]`).length > 0) {
      return;
    }
    const option = createElement('option');
    option.setAttribute('value', color);
    colorList.appendChild(option);
  }

  function onFormUpdate(formUpdate: FormUpdate): void {
    const formData = formUpdate.data;
    const {form, event} = formUpdate;
    const data: DeepPartial<FormState> = {};
    // add to process only once for multiple fields with the same name
    let skipNextTime: Set<string> = new Set();

    for (const [name, value] of formData) {
      if (skipNextTime.has(name)) {
        continue;
      }
      /*// @ts-ignore
      if (!validations[name]) {
        continue;
      }*/
      switch (name as FormStateValidations) {
        case 'debugShowPositions':
        case 'debugShowBounding':
        case 'debugShowIds':
          if(!data.debug) {
            data.debug = {};
          }
          data.debug.showIds = elements.debugShowIds.checked;
          data.debug.showBounding = elements.debugShowBounding.checked;
          data.debug.showPositions = elements.debugShowPositions.checked;
          skipNextTime.add(name);
          break;
        case 'canvasWidth':
        case 'canvasHeight':
          if(event && event.type !== 'change') {
            continue;
          }
          if (!data.canvas) {
            data.canvas = {};
          }
          data.canvas.width = parseDecimal(elements.canvasWidth.value);
          data.canvas.height = parseDecimal(elements.canvasHeight.value);
          State._canvas.size = new Vector2(data.canvas.width, data.canvas.height);
          break;
        case 'positions':
          switch (value as DistributionType) {
            case DistributionType.Grid:
              Global.PatternGenerator = new GridPatternGenerator(State._canvas);
              break;
            case DistributionType.BlueNoise:
              Global.PatternGenerator = new BlueNoisePatternGenerator(State._canvas);
              break;
            case DistributionType.Random:
            case DistributionType.None:
            default:
              Global.PatternGenerator = new RandomPatternGenerator(State._canvas);
          }
          break;
        case 'blueNoiseMinimalDistance':
          if (!data.blueNoise) {
            data.blueNoise = {};
          }
          data.blueNoise.minimalDistance = parseDecimal(value as string);
          break;
        case 'gridSize':
          if (!data.grid) {
            data.grid = {};
          }
          data.grid.size = new Vector2(parseDecimal(value as string) ?? 0);
          break;
        case 'ratio':
          data.ratio = (Array.from(elements.ratio) as HTMLInputElement[])
            .map(i => parseDecimal(i.value));
          skipNextTime.add(name);
          break;
        case 'scaleRandomMin':
          if(!data.scaleRandom) {
            data.scaleRandom = {};
          }
          data.scaleRandom.min = parseFloat(value as string);
          break;
        case 'scaleRandomMax':
          if(!data.scaleRandom) {
            data.scaleRandom = {};
          }
          data.scaleRandom.max = parseFloat(value as string);
          break;
        /*case 'figures':
          /!*console.log({
            inner: defsRoot.innerHTML,
            value,
          })*!/
          if (defsRoot.innerHTML === value) {
            // console.log("SAME");
            continue;
          }
          console.log("NOT THE SAME");
          break;*/
        case 'color[]':
          data.color = new Map(/*State.data.color*/);
          skipNextTime.add(name);
          const colorInputs = Array.from(elements['color[]']) as HTMLInputElement[];
          for (const colorInput of colorInputs) {
            (data.color as Map<string, string>).set(colorInput.id, validations['color[]'](colorInput.value));
          }

          // const colorValues = Array.from(formData.getAll('color')) as string[];
          // const keys = Array.from(data.color.keys());
          // for (const i in keys) {
          //   data.color.set(keys[i], validations.color(colorValues[i]));
          // }
          break;
        default: {
          // @ts-ignore
          if (!validations[name]) {
            // @ts-ignore
            validations[name] = validatePass;
          }
          // @ts-ignore
          data[name] = validations[name](value);
        }
      }
    }

    deepMerge(State.data, data);
    onSubmit();
  }

  const figuresInput = getElementById(FORM_IDS.VARIANTS) as HTMLTextAreaElement;
  figuresInput.addEventListener("change", populateSvg);

  function populateSvg() {
    console.log(State.data.figures);
    if (defsRoot.children.length > 0) {
      defsRoot.innerHTML = "";
    }
    try {
      const svgs = parseSvg(figuresInput.value);
      svgs.forEach(svg => svg.setAttribute("fill", "rgb(233, 70, 144)"));
      defsRoot.append(...svgToSymbols(svgs));

      State._shapes = svgs;
      (() => {
        for (const image of State._shapeImages) {
          // image.remove();
        }
        State._shapeImages.clear();

        let leftToLoad = State._shapes.length;
        let id = 0;
        for (const shape of State._shapes) {
          const image = new Image();
          const svg = new Blob([shape.outerHTML], {type: 'image/svg+xml;charset=utf-8'});
          const url = URL.createObjectURL(svg);
          image.onload = () => {
            leftToLoad--;
            if (leftToLoad <= 0) {
              emitGlobalEvent(Global.SVG_LOADED_EVENT);
            }
          }
          image.src = url;
          const imageId = shape.hasAttribute("id") ?
            shape.getAttribute("id") as string :
            (id++).toString(10);
          State._shapeImages.set(imageId, image);
        }
      })()
    } catch (e) {
      console.error(e);
    }
  }

  const seedInput = getElementById(FORM_IDS.SEED) as HTMLInputElement;
  seedInput.dispatchEvent(new Event("input", {bubbles: true}));

  const randomSeedButton = getElementById(FORM_IDS.RANDOM_SEED_BUTTON) as HTMLButtonElement;
  randomSeedButton.addEventListener("click", e => {
    Global.Seed = createRandomSeed();
    State.data.seed = Global.Seed;
    seedInput.value = toDecimalString(State.data.seed);
    // const formData = getFormData();
    const formData = new FormData();
    formData.set('seed', toDecimalString(State.data.seed));
    updateUrlParams(formData);
    onFormUpdate(getFormUpdate(formData, e));
  });

  /*const generateButton = getElementById(FORM_IDS.GENERATE_BUTTON) as HTMLButtonElement;
  generateButton.addEventListener("click", onSubmit);*/

  populateSvg();
  onGlobalEvent(Global.SVG_LOADED_EVENT, onSubmit);
  form.dispatchEvent(new Event('change'));
  // onSubmit();

  const exportSvgClipboardButton = getElementById(FORM_IDS.COPY_SVG_CLIPBOARD_BUTTON) as HTMLButtonElement;
  exportSvgClipboardButton.addEventListener("click", saveToClipboard);
  const exportSvgFileButton = getElementById(FORM_IDS.COPY_SVG_FILE_BUTTON) as HTMLButtonElement;
  exportSvgFileButton.addEventListener("click", saveToFile);
});

function onSubmit() {
  clearCanvas();

  Global.PatternGenerator.reset();
  // State._generated = createPattern(State.data.amount);
  State._generated = Global.PatternGenerator.getResult(State.data);

  requestAnimationFrame(() => drawPattern(State._generated));
}

