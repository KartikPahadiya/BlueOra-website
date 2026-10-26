import { useEffect, useRef } from 'react';
import instagramIcon from '../assets/social/instagram.svg';
import facebookIcon from '../assets/social/facebook.svg';
import whatsappIcon from '../assets/social/whatsapp.svg';

const socialLinks = [
  { name: 'Instagram', href: 'https://www.instagram.com/', icon: instagramIcon },
  { name: 'Facebook', href: 'https://www.facebook.com/', icon: facebookIcon },
  { name: 'WhatsApp', href: 'https://www.whatsapp.com/', icon: whatsappIcon },
];

const scrollToSection = (event, selector) => {
  event.preventDefault();
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function Footer() {
  const trackRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    const footer = footerRef.current;
    let frame = 0;

    const update = () => {
      frame = 0;
      const footerHeight = footer.offsetHeight;
      const progress = Math.min(1, Math.max(0,
        (window.innerHeight - track.getBoundingClientRect().top) / footerHeight
      ));
      footer.style.transform = `translate3d(0, ${(1 - progress) * 100}%, 0)`;
      footer.style.visibility = progress === 0 ? 'hidden' : 'visible';
      footer.style.pointerEvents = progress > 0.8 ? 'auto' : 'none';
      footer.setAttribute('aria-hidden', progress < 0.05 ? 'true' : 'false');
    };
    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const sizeTrack = () => {
      track.style.height = `${footer.offsetHeight}px`;
      requestUpdate();
    };

    sizeTrack();
    const observer = new ResizeObserver(sizeTrack);
    observer.observe(footer);
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', sizeTrack);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', sizeTrack);
    };
  }, []);

  return (
    <div className="footer-scroll" id="contact" ref={trackRef}>
      <footer className="site-footer" ref={footerRef} aria-label="Bamlehri footer">
        <div className="site-footer__inner">
          <div className="site-footer__main">
            <div className="site-footer__brand">
              <span>Bamlehri Aqua</span>
              <h2>Pure hydration.<br />Healthier days.</h2>
              <p>Stay hydrated. Stay healthy.</p>
            </div>
            <nav className="site-footer__nav" aria-label="Footer navigation">
              <span>Explore</span>
              <a href="#home" onClick={(event) => scrollToSection(event, '#home')}>Home</a>
              <a href="#section-3" onClick={(event) => scrollToSection(event, '#section-3')}>About</a>
              <a href="#section-4" onClick={(event) => scrollToSection(event, '#section-4')}>Products</a>
              <a href="tel:+9999999999">Contact</a>
              <a href="https://www.google.com/maps" target="_blank" rel="noreferrer">Location</a>
              <div className="site-footer__socials">
                {socialLinks.map((social) => (
                  <a key={social.name} href={social.href} target="_blank" rel="noreferrer" aria-label={social.name}>
                    <img src={social.icon} alt="" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
