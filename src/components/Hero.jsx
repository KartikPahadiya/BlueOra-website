import { useLayoutEffect, useRef } from 'react';
import { FRAME_COUNT, frames, onFrameLoaded } from '../frames';

/* ------------------------------------------------------------------
   Sections 1 + 2 (200vh). A sticky 100vh stage stays on screen while you
   scroll through them and plays the frame sequence:

     scroll = top of section 1  ->  frame 1
     scroll = end of section 2 reaches the bottom of the screen -> frame 151

   "BlueOra" and the tagline are driven by the same progress value, so
   scrolling down plays forward and scrolling up plays in reverse.
------------------------------------------------------------------- */
const CFG = {
  brandWidth: 0.6,      // "BlueOra" is 60% of the screen width at the start
  brandEndScale: 0.5,   // ...and shrinks to 50% of that at the end
  padX: 0.045,          // left / right margin of the final positions (share of screen width)
  headerH: 76,          // height of the fixed header (keeps the text clear of it)
  tagStartScale: 0.25,  // tagline starts small and grows to 1
  tagFadeEnd: 0.35,     // tagline is fully opaque by this progress
};
// swap for e.g. (t) => t * t * (3 - 2 * t) if you want eased motion instead of 1:1 with the scroll
const ease = (t) => t;

export default function Hero() {
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const brandRef = useRef(null);
  const tagRef = useRef(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const cv = canvasRef.current;
    const brand = brandRef.current;
    const tag = tagRef.current;
    const ctx = cv.getContext('2d');

    let W = 0, H = 0, dpr = 1;
    let bw = 0, bh = 0, tw = 0, th = 0;
    let target = 0, cur = 0;
    let raf = 0, lastT = 0;
    let lastIdx = -1, dirty = true, exact = true;

    const readTarget = () => {
      const top = track.getBoundingClientRect().top;
      const range = Math.max(1, track.offsetHeight - stage.offsetHeight);
      target = Math.min(1, Math.max(0, -top / range));
    };

    const pick = (idx) => {
      if (frames[idx]) { exact = true; return frames[idx]; }
      exact = false;
      for (let d = 1; d < FRAME_COUNT; d++) {
        const a = frames[idx - d];
        if (a) return a;
        const b = frames[idx + d];
        if (b) return b;
      }
      return null;
    };

    const draw = (idx) => {
      const cw = cv.width, ch = cv.height;
      const img = pick(idx);
      if (!img) {
        // frames not there (yet): soft aqua backdrop so the text motion is still visible
        const g = ctx.createLinearGradient(0, 0, 0, ch);
        g.addColorStop(0, '#eaf7ff');
        g.addColorStop(1, '#c4e4f8');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
        return;
      }
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight); // cover
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    const apply = (p) => {
      const e = ease(p);
      const padX = Math.max(20, W * CFG.padX);

      // "BlueOra": middle band, centred  ->  top band, left, half size
      const s = 1 + (CFG.brandEndScale - 1) * e;
      const x0 = (W - bw) / 2;
      const y0 = (H - bh) / 2;
      const x1 = padX;
      const y1 = Math.max(H / 6 - (bh * CFG.brandEndScale) / 2, CFG.headerH + 8);
      brand.style.transform =
        `translate3d(${x0 + (x1 - x0) * e}px, ${y0 + (y1 - y0) * e}px, 0) scale(${s})`;

      // Stop all tagline motion when the background's right edge touches the screen edge.
      const tagProgress = Math.min(1, e / 0.78);
      const ts = CFG.tagStartScale + (1 - CFG.tagStartScale) * tagProgress;
      const off = (1 - tagProgress) * (padX + tw * 0.5);
      const tx = W - tw * ts + off;
      const ty = (H * 5) / 6 - th / 2;
      tag.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${ts})`;
      tag.style.opacity = Math.min(1, e / CFG.tagFadeEnd);
    };

    const tick = (now) => {
      raf = 0;
      const dt = lastT ? Math.min(64, now - lastT) : 16;
      lastT = now;
      cur += (target - cur) * (1 - Math.exp(-dt / 110)); // smooth catch-up
      if (Math.abs(target - cur) < 0.0004) cur = target;

      apply(cur);
      const idx = Math.round(cur * (FRAME_COUNT - 1));
      if (idx !== lastIdx || dirty) {
        draw(idx);
        lastIdx = idx;
        dirty = false;
      }
      if (cur !== target) schedule();
      else lastT = 0;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const layout = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(W * dpr));
      cv.height = Math.max(1, Math.round(H * dpr));
      // fit "BlueOra" to 60% of the screen width, whatever font is in use
      brand.style.fontSize = '100px';
      const w100 = brand.offsetWidth || 1;
      brand.style.fontSize = `${(100 * W * CFG.brandWidth) / w100}px`;
      bw = brand.offsetWidth;
      bh = brand.offsetHeight;
      tw = tag.offsetWidth;
      th = tag.offsetHeight;
      dirty = true;
      readTarget();
      schedule();
    };

    const onScroll = () => { readTarget(); schedule(); };

    readTarget();
    cur = target;               // never animate from 0 on load / refresh
    layout();

    const ro = new ResizeObserver(layout);
    ro.observe(stage);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    // a frame we are currently showing a stand-in for just arrived -> redraw
    const off = onFrameLoaded((i) => {
      if (!exact || i === lastIdx) { dirty = true; schedule(); }
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      off();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="hero" ref={trackRef} id="home">
      <div className="hero__stage" ref={stageRef}>
        <canvas className="hero__canvas" ref={canvasRef} />
        <h1 className="hero__brand" ref={brandRef} data-text="BlueOra">BlueOra</h1>
        <p className="hero__tagline" ref={tagRef}>
          stay hydrated
          <br />
          stay healthy
        </p>
      </div>
      <section className="panel panel--first" id="section-1" aria-label="Section 1" />
      <section className="panel" id="section-2" aria-label="Section 2" />
    </div>
  );
}
