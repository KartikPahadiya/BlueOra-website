// ---- settings ----
const DESKTOP = { dir: 'frames', count: 241 };
const MOBILE = { dir: 'frames/mobile', count: 241 }; // put your mobile frame count here (0 = phones use desktop frames)

// portrait screens (phones, tablets held upright) get the mobile set
// phones only: narrow AND upright. Tablets/iPads (744px wide and up) keep the original frames
const phone =
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 600px) and (max-aspect-ratio: 1/1)').matches;
const set = phone && MOBILE.count > 0 ? MOBILE : DESKTOP;

export const FRAME_COUNT = set.count;
export const frames = new Array(FRAME_COUNT).fill(null);

const listeners = new Set();
let promise = null;

const url = (i) =>
  `${import.meta.env.BASE_URL}${set.dir}/ezgif-frame-${String(i + 1).padStart(3, '0')}.jpg`;

export function onFrameLoaded(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function preloadFrames() {
  if (!promise) {
    promise = new Promise((resolve) => {
      let settled = 0;
      const done = () => {
        if (++settled === FRAME_COUNT) resolve();
      };
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          frames[i] = img;
          listeners.forEach((fn) => fn(i));
          done();
        };
        img.onerror = done;
        img.src = url(i);
      }
    });
  }
  return promise;
}