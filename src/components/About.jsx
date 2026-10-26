const imageFiles = import.meta.glob('/about/images/*.{png,jpg,jpeg,webp,avif,gif}', {
  eager: true,
  import: 'default',
});

const textFiles = import.meta.glob('/about/text/*.text', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const fileNumber = (path) => path.split('/').pop().split('.')[0];
const imageEntry = Object.entries(imageFiles).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))[0];
const aboutNumber = imageEntry ? fileNumber(imageEntry[0]) : '1';
const textEntry = Object.entries(textFiles).find(([path]) => fileNumber(path) === aboutNumber);
const rawText = textEntry?.[1] || '';
const lines = rawText.trim().split(/\r?\n/);
const headingLine = lines.find((line) => /^heading\s*:/i.test(line));
const descriptionLine = lines.find((line) => /^description\s*:/i.test(line));

const content = {
  image: imageEntry?.[1],
  heading: headingLine
    ? headingLine.replace(/^heading\s*:\s*/i, '')
    : lines[0] || 'About Bamlehri Aqua',
  description: descriptionLine
    ? descriptionLine.replace(/^description\s*:\s*/i, '')
    : lines.slice(1).join(' ').trim(),
};

export default function About() {
  return (
    <section className="about" id="section-3" aria-labelledby="about-title">
      <div className="about__inner">
        <div className="about__visual">
          {content.image && <img src={content.image} alt="Bamlehri Aqua" />}
          <a className="about__office" href="https://www.google.com/maps" target="_blank" rel="noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 11.5A2.5 2.5 0 0 1 9.5 9A2.5 2.5 0 0 1 12 6.5A2.5 2.5 0 0 1 14.5 9a2.5 2.5 0 0 1-2.5 2.5M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7" />
            </svg>
            Visit Our Office
          </a>
        </div>
        <div className="about__content">
          <span className="about__eyebrow">Our story</span>
          <h2 id="about-title">{content.heading}</h2>
          <p>{content.description}</p>
          <div className="about__rule" aria-hidden="true" />
          <span className="about__tagline">Stay hydrated. Stay healthy.</span>
        </div>
      </div>
    </section>
  );
}
