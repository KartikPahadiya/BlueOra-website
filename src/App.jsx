import { useCallback, useEffect, useRef, useState } from 'react';
import Loader from './components/Loader.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import { preloadFrames } from './frames.js';

// intro stages, in order
const ORDER = ['loading', 'reveal', 'logo', 'done'];
const MAX_WAIT = 20000; // never keep the loader up longer than this (ms)

export default function App() {
  const slotRef = useRef(null);
  const [stage, setStage] = useState('loading');
  const [assetsReady, setAssetsReady] = useState(false);

  const advance = useCallback(
    (s) => setStage((cur) => (ORDER.indexOf(s) > ORDER.indexOf(cur) ? s : cur)),
    []
  );
  const at = (s) => ORDER.indexOf(stage) >= ORDER.indexOf(s);
  const intro = stage !== 'done';

  // always start from the top, so the intro leads into section 1
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);

  // no scrolling while the intro plays
  useEffect(() => {
    if (!intro) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [intro]);

  // the loader waits here for: page load + fonts + all frame images
  useEffect(() => {
    let alive = true;
    const winLoaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((r) => window.addEventListener('load', r, { once: true }));
    const fonts = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    const timeout = new Promise((r) => setTimeout(r, MAX_WAIT));
    Promise.race([Promise.all([winLoaded, fonts, preloadFrames()]), timeout]).then(
      () => alive && setAssetsReady(true)
    );
    return () => { alive = false; };
  }, []);

  return (
    <>
      <Header slotRef={slotRef} shown={at('reveal')} logoShown={at('logo')} />

      <main>
        {/* sections 1 + 2: frame sequence */}
        <Hero />
        {/* section 3 */}
        <section className="panel panel--blue" id="section-3" aria-label="Section 3" />
        {/* section 4 */}
        <section className="panel panel--red" id="section-4" aria-label="Section 4" />
      </main>

      {intro && (
        <Loader
          slotRef={slotRef}
          assetsReady={assetsReady}
          revealed={at('reveal')}
          onStage={advance}
        />
      )}
    </>
  );
}
