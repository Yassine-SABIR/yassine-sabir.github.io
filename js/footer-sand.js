export function initFooterSand() {
  const canvas = document.getElementById('sandCanvas');
  const footer = canvas?.closest('.site-footer');
  const context = canvas?.getContext('2d');
  if (!canvas || !footer || !context) return;

  const settings = {
    cellSize: 3,
    releaseChance: 0.022,
    gravity: 850,
    airDrag: 0.992,
    pileHoldSeconds: 0.8,
    reformDurationSeconds: 2,
    reformStaggerSeconds: 0.65,
    revealHoldSeconds: 3
  };

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let columns = 0;
  let rows = 0;
  let indigoPaint;
  let violetPaint;
  let fixedCells;
  let pile;
  let textCells = [];
  let looseCells = [];
  let falling = [];
  let reforming = [];
  let phase = 'idle';
  let phaseTime = 0;
  let lastFrame = performance.now();
  let animationFrame = 0;
  let hasTriggered = false;
  let previousScrollY = window.scrollY;

  const index = (column, row) => row * columns + column;
  const columnFromIndex = (value) => value % columns;
  const rowFromIndex = (value) => Math.floor(value / columns);
  const random = (min, max) => min + Math.random() * (max - min);
  const randomInt = (min, max) => Math.floor(random(min, max + 1));
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const ease = (value) => value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  const isSolid = (grid, column, row) => row >= rows || column < 0 || column >= columns || grid[index(column, row)] === 1;
  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = randomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(180, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    columns = Math.ceil(width / settings.cellSize);
    rows = Math.ceil(height / settings.cellSize);

    const indigoRadius = Math.max(width, height) * 0.72;
    const violetRadius = Math.max(width, height) * 0.78;
    indigoPaint = context.createRadialGradient(width * 0.04, height * 0.04, 0, width * 0.04, height * 0.04, indigoRadius);
    indigoPaint.addColorStop(0, 'rgba(159, 239, 0, .16)');
    indigoPaint.addColorStop(1, 'rgba(159, 239, 0, 0)');
    violetPaint = context.createRadialGradient(width * 0.96, height * 0.92, 0, width * 0.96, height * 0.92, violetRadius);
    violetPaint.addColorStop(0, 'rgba(124, 179, 5, .13)');
    violetPaint.addColorStop(1, 'rgba(124, 179, 5, 0)');

    fixedCells = new Uint8Array(columns * rows);
    pile = new Uint8Array(columns * rows);
    textCells = [];
    falling = [];
    reforming = [];

    const mask = document.createElement('canvas');
    mask.width = width;
    mask.height = height;
    const maskContext = mask.getContext('2d');
    const fontSize = Math.min(width * 0.16, height * 0.48, 150);
    maskContext.fillStyle = '#fff';
    maskContext.font = '900 ' + fontSize + 'px "Space Grotesk", system-ui, sans-serif';
    maskContext.textAlign = 'center';
    maskContext.textBaseline = 'middle';
    maskContext.fillText('Yassine SABIR', width / 2, height * 0.48);
    const pixels = maskContext.getImageData(0, 0, width, height).data;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const pixelX = Math.min(width - 1, Math.floor(column * settings.cellSize + settings.cellSize / 2));
        const pixelY = Math.min(height - 1, Math.floor(row * settings.cellSize + settings.cellSize / 2));
        if (pixels[(pixelY * width + pixelX) * 4 + 3] > 35) {
          const cell = index(column, row);
          fixedCells[cell] = 1;
          textCells.push(cell);
        }
      }
    }
    startCycle(false);
  }

  function startCycle(startAnimation = true) {
    fixedCells.fill(0);
    pile.fill(0);
    textCells.forEach((cell) => { fixedCells[cell] = 1; });
    looseCells = textCells.slice();
    shuffle(looseCells);
    falling = [];
    reforming = [];
    phase = startAnimation ? 'release' : 'idle';
    phaseTime = 0;
    if (startAnimation) {
      footer.classList.add('sand-active');
      if (!animationFrame) animationFrame = requestAnimationFrame(tick);
    }
  }

  function releaseCell(cell) {
    const column = columnFromIndex(cell);
    const row = rowFromIndex(cell);
    fixedCells[cell] = 0;
    falling.push({ x: column * settings.cellSize, y: row * settings.cellSize, vx: random(-22, 22), vy: random(40, 150), drift: random(-55, 55), targetDrift: random(-85, 85), driftTime: random(.18, .9) });
  }

  function releaseText() {
    if (!looseCells.length) {
      phase = 'falling';
      phaseTime = 0;
      return;
    }
    const tests = Math.min(1500, looseCells.length);
    for (let attempt = 0; attempt < tests; attempt += 1) {
      const listIndex = randomInt(0, looseCells.length - 1);
      const cell = looseCells[listIndex];
      const column = columnFromIndex(cell);
      const row = rowFromIndex(cell);
      const belowEmpty = row >= rows - 1 || fixedCells[index(column, Math.min(row + 1, rows - 1))] === 0;
      const sideEmpty = column <= 0 || column >= columns - 1 || fixedCells[index(Math.max(0, column - 1), row)] === 0 || fixedCells[index(Math.min(columns - 1, column + 1), row)] === 0;
      if (Math.random() < settings.releaseChance * (belowEmpty || sideEmpty ? 3.3 : 1)) {
        releaseCell(cell);
        looseCells.splice(listIndex, 1);
      }
    }
  }

  function settleParticle(particle) {
    const column = Math.max(0, Math.min(columns - 1, Math.floor(particle.x / settings.cellSize)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor(particle.y / settings.cellSize)));
    if (!isSolid(pile, column, row)) { pile[index(column, row)] = 1; return; }
    if (!isSolid(pile, column - 1, row)) { pile[index(column - 1, row)] = 1; return; }
    if (!isSolid(pile, column + 1, row)) { pile[index(column + 1, row)] = 1; return; }
    for (let currentRow = row - 1; currentRow >= 0; currentRow -= 1) {
      if (!isSolid(pile, column, currentRow)) {
        pile[index(column, currentRow)] = 1;
        return;
      }
    }
  }

  function updateFalling(dt) {
    for (let i = falling.length - 1; i >= 0; i -= 1) {
      const particle = falling[i];
      particle.driftTime -= dt;
      if (particle.driftTime <= 0) {
        particle.targetDrift = random(-85, 85);
        particle.driftTime = random(.25, 1.2);
      }
      particle.drift += (particle.targetDrift - particle.drift) * dt * 2;
      particle.vx += particle.drift * dt;
      particle.vy += settings.gravity * dt;
      particle.vx *= settings.airDrag;
      particle.vy *= settings.airDrag;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      const column = Math.floor(particle.x / settings.cellSize);
      const nextRow = Math.floor((particle.y + settings.cellSize) / settings.cellSize);
      if (particle.x < -60) particle.x = 0;
      if (particle.x > width + 60) particle.x = width - settings.cellSize;
      if (nextRow >= rows || isSolid(pile, column, nextRow)) {
        settleParticle(particle);
        falling.splice(i, 1);
      }
    }
    if (phase === 'falling' && !falling.length) {
      phase = 'pile';
      phaseTime = 0;
    }
  }

  function settlePile() {
    for (let row = rows - 2; row >= 0; row -= 1) {
      for (let column = 1; column < columns - 1; column += 1) {
        const current = index(column, row);
        if (pile[current] !== 1) continue;
        if (!isSolid(pile, column, row + 1)) {
          pile[index(column, row + 1)] = 1;
          pile[current] = 0;
        } else if (!isSolid(pile, column - 1, row + 1)) {
          pile[index(column - 1, row + 1)] = 1;
          pile[current] = 0;
        } else if (!isSolid(pile, column + 1, row + 1)) {
          pile[index(column + 1, row + 1)] = 1;
          pile[current] = 0;
        }
      }
    }
  }

  function startReform() {
    const sources = [];
    for (let row = rows - 1; row >= 0; row -= 1) {
      for (let column = 0; column < columns; column += 1) {
        if (pile[index(column, row)] === 1) sources.push(index(column, row));
      }
    }
    const targets = textCells.slice();
    const count = Math.min(sources.length, targets.length);
    for (let i = 0; i < count; i += 1) {
      const source = sources[i];
      const target = targets[i];
      reforming.push({ sx: columnFromIndex(source) * settings.cellSize, sy: rowFromIndex(source) * settings.cellSize, tx: columnFromIndex(target) * settings.cellSize, ty: rowFromIndex(target) * settings.cellSize, delay: random(0, settings.reformStaggerSeconds), duration: random(1.5, 2.3), wave: random(-18, 18), phaseOffset: random(0, Math.PI * 2) });
    }
    pile.fill(0);
    phase = 'reform';
    phaseTime = 0;
  }

  function updateReform() {
    let arrived = true;
    for (const particle of reforming) {
      const localTime = phaseTime - particle.delay;
      if (localTime <= 0) { arrived = false; continue; }
      const progress = clamp(localTime / particle.duration);
      const eased = ease(progress);
      const arc = Math.sin(eased * Math.PI);
      const wobble = Math.sin(eased * Math.PI * 2 + particle.phaseOffset) * particle.wave * arc;
      particle.x = particle.sx + (particle.tx - particle.sx) * eased + wobble;
      particle.y = particle.sy + (particle.ty - particle.sy) * eased - arc * height * .08;
      if (progress < 1) arrived = false;
    }
    if (arrived) {
      phase = 'hold';
      phaseTime = 0;
      fixedCells.fill(0);
      textCells.forEach((cell) => { fixedCells[cell] = 1; });
      reforming = [];
    }
  }

  function update(dt) {
    phaseTime += dt;
    if (phase === 'release') releaseText();
    if (phase === 'falling') updateFalling(dt);
    if (phase === 'pile') {
      settlePile();
      if (phaseTime >= settings.pileHoldSeconds) startReform();
    }
    if (phase === 'reform') updateReform();
    if (phase === 'hold' && phaseTime >= settings.revealHoldSeconds) startCycle(true);
  }

  function drawCells(cells) {
    cells.forEach((cell) => context.fillRect(columnFromIndex(cell) * settings.cellSize, rowFromIndex(cell) * settings.cellSize, settings.cellSize, settings.cellSize));
  }

  function drawGradientCells(cells) {
    context.fillStyle = indigoPaint;
    drawCells(cells);
    context.fillStyle = violetPaint;
    drawCells(cells);
  }

  function drawGradientParticle(particle) {
    context.fillStyle = indigoPaint;
    context.fillRect(particle.x, particle.y, settings.cellSize, settings.cellSize);
    context.fillStyle = violetPaint;
    context.fillRect(particle.x, particle.y, settings.cellSize, settings.cellSize);
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const fixed = [];
    for (let cell = 0; cell < fixedCells.length; cell += 1) if (fixedCells[cell]) fixed.push(cell);
    drawGradientCells(fixed);
    const piled = [];
    for (let cell = 0; cell < pile.length; cell += 1) if (pile[cell]) piled.push(cell);
    drawGradientCells(piled);
    falling.forEach(drawGradientParticle);
    reforming.forEach(drawGradientParticle);
  }

  function tick(now) {
    animationFrame = requestAnimationFrame(tick);
    const dt = Math.min((now - lastFrame) / 1000, .033);
    lastFrame = now;
    update(dt);
    draw();
  }

  function trigger() {
    if (hasTriggered || !textCells.length) return;
    hasTriggered = true;
    startCycle(true);
  }

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > previousScrollY;
    previousScrollY = currentScrollY;
    if (scrollingDown && footer.getBoundingClientRect().top < window.innerHeight * .9) trigger();
  }, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  resize();
}
