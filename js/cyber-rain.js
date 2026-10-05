const DIGITS = ['0', '1'];
const FRAME_INTERVAL = 1000 / 30;

export function initCyberRain() {
  const canvas = document.getElementById('cyberRainCanvas');
  if (!canvas) return;

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let columns = [];
  let width = 0;
  let height = 0;
  let fontSize = 15;
  let animationFrame = 0;
  let lastFrame = 0;
  let resizeFrame = 0;

  const createColumn = (x, randomizeY = true) => ({
    x,
    y: randomizeY ? Math.random() * height : -Math.random() * height * .35,
    speed: .45 + Math.random() * .75,
    length: 5 + Math.floor(Math.random() * 8),
    alpha: .075 + Math.random() * .085
  });

  const resetColumn = (column) => {
    column.y = -Math.random() * height * .45;
    column.speed = .45 + Math.random() * .75;
    column.length = 5 + Math.floor(Math.random() * 8);
    column.alpha = .075 + Math.random() * .085;
  };

  const drawColumn = (column, staticFrame = false) => {
    for (let index = 0; index < column.length; index += 1) {
      const fade = 1 - index / column.length;
      const isHead = index === 0;
      context.fillStyle = isHead
        ? `rgba(214, 255, 118, ${column.alpha * 1.55})`
        : `rgba(159, 239, 0, ${column.alpha * fade})`;
      context.fillText(
        DIGITS[Math.floor(Math.random() * DIGITS.length)],
        column.x,
        column.y - index * fontSize * 1.18
      );
    }

    if (!staticFrame) {
      column.y += column.speed * fontSize;
      if (column.y - column.length * fontSize > height) resetColumn(column);
    }
  };

  const drawStatic = () => {
    context.clearRect(0, 0, width, height);
    columns.forEach((column) => drawColumn(column, true));
  };

  const draw = (time) => {
    animationFrame = window.requestAnimationFrame(draw);
    if (document.hidden || time - lastFrame < FRAME_INTERVAL) return;
    lastFrame = time;
    context.clearRect(0, 0, width, height);
    columns.forEach((column) => drawColumn(column));
  };

  const start = () => {
    window.cancelAnimationFrame(animationFrame);
    if (reducedMotion.matches) {
      drawStatic();
      return;
    }
    animationFrame = window.requestAnimationFrame(draw);
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    fontSize = width < 480 ? 12 : width < 900 ? 14 : 16;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const spacing = fontSize * (width < 480 ? 3.7 : 3.25);
    columns = Array.from(
      { length: Math.ceil(width / spacing) },
      (_, index) => createColumn(index * spacing + spacing / 2)
    );
    start();
  };

  const queueResize = () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(resize);
  };

  window.addEventListener('resize', queueResize, { passive: true });
  reducedMotion.addEventListener?.('change', start);
  resize();
}
