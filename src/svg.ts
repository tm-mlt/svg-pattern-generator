import {SvgExportDebugOptions, SvgFigureData} from "./types.js";
import {copyToClipboard, createElement, getElementById, parseDecimal, radsToDeg, toDecimalString} from "./helpers.js";
import {getDebugOptions} from "./debug.js";
import {Vector2} from "./math/vector.js";

const svgNsName = '';

/**
 * @throws {TypeError}
 */
export const parseSvg = (input: string): SVGSVGElement[] => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(input, "image/svg+xml");
  if (dom.getElementsByTagNameNS("http://www.w3.org/1999/xhtml", 'parsererror').length > 0) {
    throw new Error("SVG parsing error");
  }
  return [...dom.children[0].children] as SVGSVGElement[]
  // .filter(element => element.tagName === "svg") as SVGSVGElement[];
}

export function createSvgElement<K extends keyof SVGElementTagNameMap>(qualifiedName: K): SVGElementTagNameMap[K] {
  return document.createElementNS('http://www.w3.org/2000/svg', qualifiedName);
}

export const svgToSymbols = (svgs: SVGSVGElement[]) => {
  const symbols: SVGSymbolElement[] = svgs.map(originalSvg => {
    const symbol = createSvgElement('symbol');
    symbol.innerHTML = originalSvg.innerHTML;
    if (originalSvg.hasAttributes()) {
      for (const attr of originalSvg.attributes) {
        symbol.setAttributeNode(attr.cloneNode() as Attr);
      }
    }
    return symbol;
  })
  return symbols;
}

export const updateSvgDefs = () => {

}

export const placeSvg = (data: SvgFigureData) => {
  const size = 70;
  const {position, id} = data;
  const useElement = createSvgElement('use');

  useElement.setAttribute('href', `#${id}`);
  useElement.setAttribute('x', position.x.toString(10));
  useElement.setAttribute('y', position.y.toString(10));
  useElement.setAttribute('width', toDecimalString(size));
  useElement.setAttribute('height', toDecimalString(size));
}

export function exportSvg(debug?: SvgExportDebugOptions): SVGSVGElement {
  console.log(JSON.stringify(debug));
  const {State} = window;
  console.log(State.data.positions);
  console.log(State._generated);
  const root = createSvgElement('svg');
  root.setAttribute("viewBox", `0 0 ${State._canvas.size.x} ${State._canvas.size.y}`)
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  root.setAttribute('width', toDecimalString(State._canvas.size.x));
  root.setAttribute('height', toDecimalString(State._canvas.size.y));

  const defs = createSvgElement('defs');
  const originalDefs = getElementById('svg-defs') as HTMLElement;
  const shapeMap = new Map(Array
    .from(originalDefs.children)
    .map(el => [el.id, el]));
  defs.innerHTML = originalDefs.innerHTML;
  for (const c of Array.from(defs.children) as SVGSymbolElement[]) {
    c.removeAttribute('fill');
  }
  // svg.appendChild(defs);

  /*(State._generated as SvgFigureData[]).forEach(figure => {
    const use = createSvgElement('use');
    use.setAttribute('href', '#' + figure.id);
    use.setAttribute('x', toDecimalString(figure.position.x));
    use.setAttribute('y', toDecimalString(figure.position.y));
    use.setAttribute('height', State.data.baseHeight + "");
    if(figure.color) {
      use.setAttribute('fill', figure.color);
    }
    if(figure.rotation) {
      use.setAttribute('rotation', toDecimalString(figure.rotation));
    }
    svg.appendChild(use);
  });*/

  (State._generated as SvgFigureData[]).forEach((figure) => {
    if (!shapeMap.has(figure.id)) {
      return;
    }
    const origin = shapeMap.get(figure.id)!;
    const originWidth = parseDecimal(origin.getAttribute('width')!);
    const originHeight = parseDecimal(origin.getAttribute('height')!);
    // const svg = shapeMap.get(figure.id)?.cloneNode(true) as SVGSVGElement;
    const svg = createSvgElement('svg');
    const g = createSvgElement('g') as SVGGElement;
    // g.setAttribute('transform-origin', '50% 50%');
    g.innerHTML = origin.innerHTML;
    // svg.appendChild(g);
    for (const {name, value} of Array.from(origin.attributes)) {
      if ([
        'width',
        'height',
        'viewBox',
        'fill',
      ].includes(name)) {
        continue;
      }
      g.setAttribute(name, value);
    }
    // g.setAttribute('x', toDecimalString(figure.position.x - figure.scale.x * 0.5));
    // g.setAttribute('y', toDecimalString(figure.position.y - figure.scale.y * 0.5));
    // svg.setAttribute('height', figure.scale.y + "");
    // svg.setAttribute('width', figure.scale.x + "");
    if (figure.color) {
      for (const child of g.children) {
        child.setAttribute('fill', figure.color);
      }
    }
    // if(figure.rotation) {
    // svg.setAttribute('rotation', toDecimalString(figure.rotation));
    const deg = radsToDeg(figure.rotation);

    const scalingFactor = new Vector2(figure.size.x / originWidth, figure.size.y / originHeight)
      .multiply(figure.scale);

    const pos = figure.position//.subtract(hS);
    const t = `translate(${pos.x} ${pos.y})`;
    const r = `rotate(${deg})`;
    const s = `scale(${scalingFactor.x} ${scalingFactor.y})`;
    const originPos = new Vector2(figure.size.x / scalingFactor.x, figure.size.y / scalingFactor.y)
      .multiply(figure.scale);
    const tO = `translate(${-originPos.x * 0.5} ${-originPos.y * 0.5})`;

    const transform = `${t} ${r} ${s} ${tO}`;
    g.setAttribute('transform', transform);

    if(debug) {
      if(debug.origin.visible) {
        const origin = createSvgElement('circle');
        origin.setAttribute('cx', toDecimalString(figure.position.x + figure.size.x * 0.5 / scalingFactor.x));
        origin.setAttribute('cy', toDecimalString(figure.position.y + figure.size.y * 0.5 / scalingFactor.y));
        origin.setAttribute('r', toDecimalString(debug.origin.size * scalingFactor.x));
        origin.setAttribute('fill', debug.origin.color);
        root.appendChild(origin);
      }
      if(debug.boundingBox.visible) {
        const boundingBox = createSvgElement('rect');
        boundingBox.setAttribute('x', toDecimalString(0));
        boundingBox.setAttribute('y', toDecimalString(0));
        boundingBox.setAttribute('width', toDecimalString(figure.size.x / scalingFactor.x));
        boundingBox.setAttribute('height', toDecimalString(figure.size.y / scalingFactor.y));
        boundingBox.setAttribute('stroke', debug.boundingBox.color);
        boundingBox.setAttribute('stroke-width', '2px');
        boundingBox.setAttribute('fill', 'none');
        const hS = figure.size.multiply(0.5);
        const origin = new Vector2(figure.size.x / scalingFactor.x, figure.size.y / scalingFactor.y);
        const tO = `translate(${-origin.x * 0.5} ${-origin.y * 0.5})`;
        const pos = figure.position//.subtract(hS);
        const t = `translate(${pos.x} ${pos.y})`;
        const r = `rotate(${deg})`;
        const s = `scale(${scalingFactor.x} ${scalingFactor.y})`;
        // const boundingBoxTransform = ` ${t} ${r} ${s} translate(${-origin.x} ${-origin.y})`;
        const boundingBoxTransform = `${t} ${r} ${s} ${tO}`;
        boundingBox.setAttribute('transform', boundingBoxTransform);
        root.appendChild(boundingBox);
      }
    }

    root.appendChild(g);
  });

  const desc = createSvgElement('desc');
  desc.textContent = "test";
  root.appendChild(desc);

  return root;
}

export function saveToClipboard(): void {
  const svg = exportSvg(getDebugOptions());
  const serializer = new XMLSerializer();
  copyToClipboard(serializer.serializeToString(svg));
}

export function saveToFile(): void {
  const svg = exportSvg(getDebugOptions());
  const serializer = new XMLSerializer();
  const blob = new Blob([serializer.serializeToString(svg)], {type: 'image/svg+xml'});
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${window.State.data.seed}.svg`;
  document.body.appendChild(link);
  link.click();

  // Очистка
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}