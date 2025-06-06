import { toDecimalString } from "../helpers.js";

export const updateSliders = (sliders: HTMLInputElement[]) => {
  const _sliders = sliders.filter(({ type }) => type === "range");
  const length = _sliders.length;
  const max = _sliders.reduce((acc, i) => acc += parseFloat(i.max), 0) / length;

  _sliders[0].form!.addEventListener('input', (e) => {
    if(!_sliders.includes(e.target as HTMLInputElement)) {
      return;
    }

    let total: number = 0;
    for(const slider of _sliders) {
      total += Number.parseInt(slider.value, 10);
    }

    const delta = max - total;
    for(const i in _sliders) {
      const slider = _sliders[i];
      if(slider === e.target) {
        continue;
      }

      const value = Number.parseInt(slider.value, 10);
      const step = delta / (length - 1);
      if(delta < 0) {
        slider.value = toDecimalString(value + step);
      }

      slider.dispatchEvent(new Event('input', { bubbles: false }));
    }
  })
  /*_sliders.forEach(i => i.addEventListener('input', (e) => {
    let total: number = 0;
    for(const slider of _sliders) {
      total += Number.parseInt(slider.value, 10);
    }

    const delta = max - total;
    for(const slider of _sliders) {
      if(slider === e.currentTarget) {
        continue;
      }
      const value = Number.parseInt(slider.value, 10);
      slider.value = toDecimalString(value + delta / (length - 1));
    }
  }));*/
}