import { useEffect, useRef, useState } from 'react';
import { products } from '../products';

const mod = (value, length) => ((value % length) + length) % length;

function Arrow({ direction }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  );
}

export default function ProductCarousel() {
  const [active, setActive] = useState(0);
  const dragStart = useRef(null);
  const count = products.length;
  const activeProduct = count ? mod(active, count) : 0;

  useEffect(() => {
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && dragStart.current === null) {
        setActive((current) => current + 1);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [count]);

  const goTo = (index) => {
    if (!count) return;
    const half = Math.floor(count / 2);
    const delta = mod(index - activeProduct + half, count) - half;
    setActive((current) => current + delta);
  };

  const onPointerDown = (event) => {
    dragStart.current = event.clientX;
  };

  const onPointerUp = (event) => {
    if (dragStart.current === null) return;
    const distance = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(distance) > 45) setActive((current) => current + (distance < 0 ? 1 : -1));
  };

  if (!count) {
    return (
      <section className="products" id="section-4" aria-label="Products">
        <p className="products__empty">Add an image and matching text file to show a product.</p>
      </section>
    );
  }

  const visibleCards = [];
  for (let offset = -2; offset <= 2; offset += 1) {
    visibleCards.push({ virtualIndex: active + offset, offset });
  }

  return (
    <section className="products" id="section-4" aria-labelledby="products-title">
      <div className="products__heading">
        <h2 id="products-title">Our Product</h2>
      </div>

      <div
        className="carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="BlueOra products"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') setActive((current) => current - 1);
          if (event.key === 'ArrowRight') setActive((current) => current + 1);
        }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragStart.current = null; }}
      >
        <div className="carousel__track">
          {visibleCards.map(({ virtualIndex, offset }) => {
            const product = products[mod(virtualIndex, count)];
            const distance = Math.abs(offset);
            return (
              <article
                className={`product-card${offset === 0 ? ' is-active' : ''}`}
                key={virtualIndex}
                aria-hidden={offset !== 0}
                style={{
                  '--card-x': `${offset * 78}%`,
                  '--card-scale': offset === 0 ? 1 : distance === 1 ? 0.76 : 0.58,
                  '--card-opacity': offset === 0 ? 1 : distance === 1 ? 0.48 : 0,
                  zIndex: 3 - distance,
                }}
                onClick={() => offset !== 0 && setActive(virtualIndex)}
              >
                <div className="product-card__image">
                  <img src={product.image} alt={offset === 0 ? product.heading : ''} draggable="false" />
                  <span className="product-card__number">{product.id.padStart(2, '0')}</span>
                </div>
                <div className="product-card__copy">
                  <h3>{product.heading}</h3>
                  <p>{product.description}</p>
                </div>
              </article>
            );
          })}
        </div>

        <button className="carousel__arrow carousel__arrow--left" type="button" aria-label="Previous product" onClick={() => setActive((current) => current - 1)}>
          <Arrow direction="left" />
        </button>
        <button className="carousel__arrow carousel__arrow--right" type="button" aria-label="Next product" onClick={() => setActive((current) => current + 1)}>
          <Arrow direction="right" />
        </button>
      </div>

      <div className="carousel__dots" aria-label="Choose a product">
        {products.map((product, index) => (
          <button
            type="button"
            key={product.id}
            className={index === activeProduct ? 'is-active' : ''}
            aria-label={`Show ${product.heading}`}
            aria-current={index === activeProduct ? 'true' : undefined}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{products[activeProduct].heading}</p>
    </section>
  );
}
