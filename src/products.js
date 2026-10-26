const imageFiles = import.meta.glob('/product/images/*.{png,jpg,jpeg,webp,avif,gif}', {
  eager: true,
  import: 'default',
});

const textFiles = import.meta.glob('/product/text/*.text', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const productNumber = (path) => path.split('/').pop().split('.')[0];

const parseProductText = (raw = '') => {
  const lines = raw.trim().split(/\r?\n/);
  const headingLine = lines.find((line) => /^heading\s*:/i.test(line));
  const descriptionLine = lines.find((line) => /^description\s*:/i.test(line));

  if (headingLine || descriptionLine) {
    return {
      heading: headingLine?.replace(/^heading\s*:\s*/i, '') || 'BlueOra',
      description: descriptionLine?.replace(/^description\s*:\s*/i, '') || '',
    };
  }

  return {
    heading: lines[0] || 'BlueOra',
    description: lines.slice(1).join(' ').trim(),
  };
};

export const products = Object.entries(imageFiles)
  .map(([path, image]) => {
    const number = productNumber(path);
    const textPath = Object.keys(textFiles).find((key) => productNumber(key) === number);
    const text = parseProductText(textPath ? textFiles[textPath] : '');
    return { id: number, image, ...text };
  })
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
