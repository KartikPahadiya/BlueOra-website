import { useEffect, useRef } from 'react';
import logoUrl from '../assets/logo.png';

/* ---- settings ---- */
const reduce =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CYCLES = reduce ? 0 : 1; // how many times the logo forms & breaks before flowing to the header
const T = { float: 2800, form: 2600, hold: 2400, scatter: 1600, head: 3000 };
const TARGET_PARTICLES = 30000;
const LOGO_SIZE = 0.5; // size of the particle-formed logo (1 = original, 0.5 = half)

const ease = (k) => (k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k));

function flow(x, y, t, ph) {
  const a =
    Math.sin(x * 0.0035 + t * 0.5 + ph * 0.15) * Math.cos(y * 0.0042 - t * 0.4) +
    Math.sin((x + y) * 0.002 + t * 0.3) * 0.6;
  return a * Math.PI * 1.6;
}

/**
 * Props
 *  slotRef      ref of the header logo slot (particles fly there at the end)
 *  assetsReady  true when the page + frame images are loaded (loader waits for it)
 *  revealed     true once the site should fade in under the veil
 *  onStage(s)   called with 'reveal' | 'logo' | 'done'
 */
export default function Loader({ slotRef, assetsReady, revealed, onStage }) {
  const cvRef = useRef(null);
  const veilRef = useRef(null);
  const readyRef = useRef(assetsReady);
  const stageRef = useRef(onStage);
  readyRef.current = assetsReady;
  stageRef.current = onStage;

  useEffect(() => {
    const cv = cvRef.current;
    const veil = veilRef.current;
    const ctx = cv.getContext('2d');
    const stage = (s) => stageRef.current && stageRef.current(s);

    let alive = true;
    let finished = false;
    let raf = 0;
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    let vw = 0, vh = 0, dpr = 1, buf32 = null, imgData = null;
    let scale = 1, ox = 0, oy = 0, hscale = 1, hox = 0, hoy = 0;
    let ps = 2, psHead = 1, psCur = 2;
    let P = [], lc = null, lw = 0, lh = 0, step = 1;

    const seq = [];
    for (let i = 0; i < CYCLES; i++) seq.push('float', 'form', 'hold');
    seq.push('scatter', 'head');
    let ready = false;
    let si = 0, phase = seq[0], pt = 0, burst = false;
    let last = 0;

    const img = new Image();
    img.onload = init;
    img.src = logoUrl;

    function init() {
      if (!alive) return;
      lw = img.naturalWidth;
      lh = img.naturalHeight;
      lc = document.createElement('canvas');
      lc.width = lw;
      lc.height = lh;
      const lctx = lc.getContext('2d', { willReadFrequently: true });
      lctx.drawImage(img, 0, 0);
      const ld = lctx.getImageData(0, 0, lw, lh).data;

      let n = 0;
      for (let i = 3; i < ld.length; i += 4) if (ld[i] > 128) n++;
      step = Math.max(1, Math.round(Math.sqrt(n / TARGET_PARTICLES)));
      for (let y = 0; y < lh; y += step)
        for (let x = 0; x < lw; x += step) {
          const i = (y * lw + x) * 4;
          if (ld[i + 3] <= 128) continue;
          const R = ld[i], G = ld[i + 1], B = ld[i + 2];
          P.push({
            lx: x, ly: y, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, hx: 0, hy: 0,
            c: (255 << 24) | (B << 16) | (G << 8) | R,
            ph: Math.random() * 6.283,
            delay: Math.random() * 0.45,
          });
        }
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      if (!vw || !vh) { buf32 = null; return; }
      cv.width = Math.max(1, (vw * dpr) | 0);
      cv.height = Math.max(1, (vh * dpr) | 0);
      imgData = ctx.createImageData(cv.width, cv.height);
      buf32 = new Uint32Array(imgData.data.buffer);
      // centred logo
      scale = Math.min((vw * 0.84) / lw, (vh * 0.66) / lh) * LOGO_SIZE;
      ox = (vw - lw * scale) / 2;
      oy = (vh - lh * scale) / 2 - vh * 0.02;
      ps = Math.max(2, Math.ceil(scale * step * dpr));
      // small header logo
      const slot = slotRef.current;
      const r = slot ? slot.getBoundingClientRect() : { height: 48, left: 16, top: 14 };
      hscale = (r.height || 48) / lh;
      hox = r.left;
      hoy = r.top;
      psHead = Math.max(1, Math.ceil(hscale * step * dpr));
      for (const q of P) {
        q.tx = ox + q.lx * scale;
        q.ty = oy + q.ly * scale;
        q.hx = hox + q.lx * hscale;
        q.hy = hoy + q.ly * hscale;
      }
    }
    window.addEventListener('resize', resize);

    function next() {
      const prev = phase;
      si++;
      if (si >= seq.length) { phase = 'done'; finish(); return; }
      phase = seq[si];
      pt = 0;
      if (prev === 'hold' && phase === 'scatter') burst = true;
      if (phase === 'head') stage('reveal'); // site + header fade in as the particles flow there
    }

    function finish() {
      if (finished) return;
      finished = true;
      stage('logo'); // crisp logo takes over in the header
      later(() => { cv.style.opacity = 0; }, 250);
      later(() => { alive = false; cancelAnimationFrame(raf); stage('done'); }, 900);
    }

    /* click / tap / key anywhere during loading -> jump straight to the main page */
    function skip() {
      if (finished) return;
      finished = true;
      phase = 'done';
      veil.style.transition = 'opacity .4s ease';
      stage('reveal');
      stage('logo');
      cv.style.opacity = 0;
      later(() => { alive = false; cancelAnimationFrame(raf); stage('done'); }, 450);
    }
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') skip();
    };
    window.addEventListener('pointerdown', skip);
    window.addEventListener('keydown', onKey);

    function loop(now) {
      if (!alive) return;
      if (!buf32) resize();
      if (!buf32) { last = now; raf = requestAnimationFrame(loop); return; }
      if (!ready) {
        for (const q of P) { q.x = Math.random() * vw; q.y = Math.random() * vh; }
        ready = true;
        last = now;
      }
      const dt = Math.min(now - last, 50);
      last = now;
      pt += dt;
      const f = dt / 16.67, t = now / 1000;

      // wait on the last float until the real page (and frame images) have loaded
      const waiting = phase === 'scatter' && si === seq.length - 2 && !readyRef.current;
      if (phase !== 'done' && pt > T[phase] && !waiting) next();

      const cx = vw / 2, cy = vh / 2;
      const hd = phase === 'head' || phase === 'done';
      for (const q of P) {
        if (burst) {
          const ang = Math.atan2(q.y - cy, q.x - cx) + (Math.random() - 0.5) * 1.2;
          const sp = 3 + Math.random() * 9;
          q.vx = Math.cos(ang) * sp;
          q.vy = Math.sin(ang) * sp;
        }
        const gx = hd ? q.hx : q.tx, gy = hd ? q.hy : q.ty;
        if (phase === 'float' || phase === 'scatter') {
          const a = flow(q.x, q.y, t, q.ph);
          q.vx += Math.cos(a) * 0.18 * f;
          q.vy += Math.sin(a) * 0.18 * f;
          const d = Math.pow(0.965, f);
          q.vx *= d; q.vy *= d;
        } else {
          const k = pt / T[phase === 'done' ? 'head' : phase];
          const on = phase === 'hold' || phase === 'done' ? 1 : ease((k - q.delay) / 0.5);
          if (on <= 0) {
            const a = flow(q.x, q.y, t, q.ph);
            q.vx += Math.cos(a) * 0.18 * f;
            q.vy += Math.sin(a) * 0.18 * f;
            const d = Math.pow(0.965, f);
            q.vx *= d; q.vy *= d;
          } else {
            const s = 0.012 + 0.07 * on;
            q.vx += (gx - q.x) * s * f;
            q.vy += (gy - q.y) * s * f;
            const d = Math.pow(0.84, f);
            q.vx *= d; q.vy *= d;
            if (on < 1) {
              const a = flow(q.x, q.y, t, q.ph) + 1.5;
              q.vx += Math.cos(a) * 0.25 * (1 - on) * f;
              q.vy += Math.sin(a) * 0.25 * (1 - on) * f;
            }
          }
        }
        q.x += q.vx * f;
        q.y += q.vy * f;
        if (phase === 'float' || phase === 'scatter') {
          if (q.x < -20) q.x += vw + 40; else if (q.x > vw + 20) q.x -= vw + 40;
          if (q.y < -20) q.y += vh + 40; else if (q.y > vh + 20) q.y -= vh + 40;
        }
      }
      burst = false;

      // particle size shrinks smoothly when flying to the header
      psCur += ((hd ? psHead : ps) - psCur) * Math.min(1, 0.06 * f);
      const sz = Math.max(1, Math.round(psCur));

      buf32.fill(0);
      const W = cv.width, H = cv.height;
      for (const q of P) {
        const col = q.c; // alpha already 255
        const px = (q.x * dpr) | 0, py = (q.y * dpr) | 0;
        if (px < 0 || py < 0 || px + sz >= W || py + sz >= H) continue;
        for (let j = 0; j < sz; j++) {
          const r = (py + j) * W + px;
          for (let i = 0; i < sz; i++) buf32[r + i] = col;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      if (phase === 'hold') {
        // exact logo fades in over the particles
        const a = Math.min(ease(pt / 700), 1 - ease((pt - (T.hold - 500)) / 450));
        if (a > 0) {
          ctx.globalAlpha = a;
          ctx.drawImage(lc, ox * dpr, oy * dpr, lw * scale * dpr, lh * scale * dpr);
          ctx.globalAlpha = 1;
        }
      }
      raf = requestAnimationFrame(loop);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      img.onload = null;
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', onKey);
    };
  }, [slotRef]);

  return (
    <>
      <div ref={veilRef} className={'loader-veil' + (revealed ? ' is-revealed' : '')} />
      <canvas ref={cvRef} className="loader-canvas" />
    </>
  );
}
