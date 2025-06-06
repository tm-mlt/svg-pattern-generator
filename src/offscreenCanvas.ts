import { Vector2 } from "./math/vector.js";

export const createOffscreenCanvas = (canvasSize: Vector2) => {
  const canvas = new OffscreenCanvas(100, 100);
  const context = canvas.getContext("2d");
  if(!context) {
    throw new Error("Can't get context for offscreen canvas");
  }

  const clear = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  const color = (image: CanvasImageSource, color: string, size: Vector2) => {
    const {pixelRatio} = window.State._platform
    canvas.width = canvasSize.x * pixelRatio;
    canvas.height = canvasSize.y * pixelRatio;
    context.scale(pixelRatio, pixelRatio);

    clear();

    context.fillStyle = color;
    context.fillRect(0, 0, size.x, size.y);
    context.globalCompositeOperation = "destination-in";

    context.drawImage(image, 0, 0, size.x, size.y);

    context.globalCompositeOperation = "source-over";
  }

  const getImage = () => canvas.transferToImageBitmap();

  return {
    canvas,
    context,
    clear,
    color,
    getImage,

  }
}
