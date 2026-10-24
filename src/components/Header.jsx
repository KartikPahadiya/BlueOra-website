import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

export default function Header({ slotRef, shown, logoShown }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = Math.max(0, window.scrollY);
      const dy = y - lastY;
      if (y < 40) setHidden(false);          // always visible at the very top
      else if (dy > 6) setHidden(true);      // scrolling down
      else if (dy < -6) setHidden(false);    // scrolling up
      if (Math.abs(dy) > 6 || y < 40) lastY = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={'site-header' + (shown ? ' is-shown' : '') + (hidden ? ' is-hidden' : '')}
      onFocus={() => setHidden(false)}
    >
      <div className="site-header__slot" ref={slotRef}>
        <img
          src={logo}
          alt="Bamlehri Aqua"
          className={logoShown ? 'is-shown' : ''}
          draggable="false"
        />
      </div>
      <nav className="site-nav">
        <a href="#">Home</a>
        <a href="#">About</a>
        <a href="#">Products</a>
        <a href="#">Quality</a>
        <a className="site-nav__cta" href="#">Contact</a>
      </nav>
    </header>
  );
}