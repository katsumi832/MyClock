// vertical.js
// Vertical rolling digits clock implementation
// Exposes function: renderVerticalClock(ctx, w, h, color, size, now, options)
(function(global){
  function drawDigitColumn(ctx, x, y, digitWidth, digitHeight, currentValue, nextValue, frac, color, fontSize) {
    // currentValue: current digit shown, nextValue: digit after change, frac: 0..1 animation progress
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${fontSize}px monospace`;

    // easing
    const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : (1 - Math.pow(1 - t, 3));
    const p = ease(frac);

  // draw current digit sliding down, and next digit coming from above (so numbers flow top->bottom)
  ctx.globalAlpha = 1;
  ctx.fillText(String(currentValue), 0, p * digitHeight);
  ctx.fillText(String(nextValue), 0, (p - 1) * digitHeight);

  // slight faded neighbors for context (below and above)
  ctx.globalAlpha = 0.25;
  ctx.fillText(String((currentValue + 1) % 10), 0, (1 + p) * digitHeight);
  ctx.fillText(String((currentValue + 9) % 10), 0, -(1 - p) * digitHeight);

    ctx.restore();
  }

  function renderVerticalClock(ctx, w, h, color, size, now, options) {
    options = options || {};
    const padding = options.padding || 16;
    const gap = options.gap || 8;

    // compute digits
    const hours = now.getHours();
    const mins = now.getMinutes();
    const secs = now.getSeconds();
    const ms = now.getMilliseconds();

    const hTens = Math.floor(hours / 10);
    const hOnes = hours % 10;
    const mTens = Math.floor(mins / 10);
    const mOnes = mins % 10;
    const sTens = Math.floor(secs / 10);
    const sOnes = secs % 10;

  // We'll animate each digit only during a short window before it changes
  const secFrac = ms / 1000; // 0-1 within current second
  const animWindow = (options.animWindowMs || 500) / 1000; // seconds

  // layout: six columns for HH:MM:SS
  const columns = [hTens, hOnes, mTens, mOnes, sTens, sOnes];
  const tToNext = new Array(6).fill(Infinity);
  // compute seconds until next change for each digit
  // index 5: sOnes (changes every 1s)
  tToNext[5] = (1 - secFrac);
  // index 4: sTens (changes when secs%10 rolls)
  tToNext[4] = (10 - (secs % 10) - secFrac);
  // index 3: mOnes (changes when seconds roll to 0 -> minute increment)
  tToNext[3] = (60 - (secs + secFrac));
  // index 2: mTens (changes when minute ones rolls over 9->0 every 10 minutes)
  tToNext[2] = (10 - (mins % 10) - (secs + secFrac) / 60) * 60;
  // index 1: hOnes (changes when minutes+seconds roll over -> hour increment)
  tToNext[1] = (3600 - (mins * 60 + secs + secFrac));
  // index 0: hTens (changes when hour tens boundary crossed)
  // find next hour H > hours where Math.floor(H/10) != Math.floor(hours/10)
  const currentTens = Math.floor(hours / 10);
  let nextTensHour = (currentTens + 1) * 10;
  if (nextTensHour > 23) nextTensHour = 0; // wrap to next day
  let hoursDelta = nextTensHour - hours;
  if (hoursDelta <= 0) hoursDelta += 24;
  tToNext[0] = hoursDelta * 3600 - (mins * 60 + secs + secFrac);

    // compute digit sizes
    const totalGap = gap * (columns.length - 1) + padding * 2;
    const digitWidth = Math.min(80, Math.floor((w - totalGap) / columns.length));
    const digitHeight = Math.floor(digitWidth * 1.6);
    const fontSize = Math.floor(digitWidth * 0.9);

    // background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = options.bg || '#000';
    ctx.fillRect(0, 0, w, h);

    // compute start x
    const startX = (w - (digitWidth * columns.length + gap * (columns.length - 1))) / 2 + digitWidth/2;
    const centerY = h / 2;

    for (let i = 0; i < columns.length; i++) {
      const x = startX + i * (digitWidth + gap);
      const timeUntil = tToNext[i];
      let frac = 0;
      if (timeUntil <= animWindow) {
        frac = 1 - timeUntil / animWindow; // 0 -> 1 as time approaches change
      }
      // compute next value by sampling a tiny bit into the future at change time
      let nextValue = columns[i];
      if (timeUntil !== Infinity) {
        const future = new Date(now.getTime() + Math.ceil(timeUntil * 1000));
        const fh = future.getHours();
        const fm = future.getMinutes();
        const fs = future.getSeconds();
        const futureDigits = [Math.floor(fh / 10), fh % 10, Math.floor(fm / 10), fm % 10, Math.floor(fs / 10), fs % 10];
        nextValue = futureDigits[i];
      }

      drawDigitColumn(ctx, x, centerY, digitWidth, digitHeight, columns[i], nextValue, frac, color, fontSize);
    }
  }

  // expose
  global.renderVerticalClock = renderVerticalClock;
})(this);
