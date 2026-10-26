import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

export default function Header({ slotRef, shown, logoShown }) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = Math.max(0, window.scrollY);
      const dy = y - lastY;
      if (y < 40 || menuOpen) setHidden(false);
      else if (dy > 6) setHidden(true);
      else if (dy < -6) setHidden(false);
      if (Math.abs(dy) > 6 || y < 40) lastY = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const scrollToSection = (event, selector) => {
    event.preventDefault();
    closeMenu();
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      <button
        className={'site-header__menu-toggle' + (menuOpen ? ' is-open' : '')}
        type="button"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        onClick={() => { setHidden(false); setMenuOpen((open) => !open); }}
      >
        <span />
        <span />
      </button>
      <nav id="site-navigation" className={'site-nav' + (menuOpen ? ' is-open' : '')} aria-label="Main navigation">
        <a href="#home" onClick={(event) => scrollToSection(event, '#home')}>Home</a>
        <a href="#section-3" onClick={(event) => scrollToSection(event, '#section-3')}>About</a>
        <a href="#section-4" onClick={(event) => scrollToSection(event, '#section-4')}>Products</a>
        <a className="site-nav__cta" href="tel:+9999999999" onClick={closeMenu}>Contact</a>
      </nav>
    </header>
  );
}