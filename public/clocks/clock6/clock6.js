// clock6.js (vertical renderer)
// Clock 6 — vertical rolling digits clock implementation
// Exposes function: renderClock6(ctx, w, h, color, size, now, options)
(function(global){
  function drawDigitColumn(ctx, x, y, digitWidth, digitHeight, currentValue, nextValue, frac, color, fontSize, opts) {
    // opts: { gapRows: number, continuous: bool, speedRowsPerSec: number, freezeSame: bool }
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${fontSize}px monospace`;

    if (opts && opts.continuous) {
      // continuous scrolling: render many stacked numbers with no gap, moving at constant rows/sec
      // determine rows/sec: prefer opts.speedRowsPerSec, otherwise use sensible default (slower)
  const rowsPerSec = (opts && opts.speedRowsPerSec) || 1;
      const nowMs = Date.now();
      const absoluteOffsetRows = (nowMs / 1000.0) * rowsPerSec;
      const centerRowIndex = Math.floor(absoluteOffsetRows);
      // fractional offset within the current row (0..1)
      const fracRow = absoluteOffsetRows - centerRowIndex;
      const offset = fracRow * digitHeight;
      // show many rows vertically
      const visibleRows = Math.ceil((ctx.canvas.height / digitHeight)) + 24;
      const half = Math.floor(visibleRows / 2);
      const centerDigit = currentValue;
      const drawnYs = new Set();
      for (let r = -half; r <= half; r++) {
        // r<0 -> above center -> value = centerDigit + |r|
        // r==0 -> centerDigit
        // r>0 -> below center -> value = centerDigit - r
  let val = (centerDigit - r) % 10;
        val = (val + 10) % 10;
        const drawY = r * digitHeight + offset;
        // avoid drawing two digits at the same rounded Y position
        const roundedY = Math.round(drawY);
        if (drawnYs.has(roundedY)) continue;
        drawnYs.add(roundedY);
        ctx.globalAlpha = 1;
        ctx.fillText(String(val), 0, drawY);
      }
    } else {
      // normal behavior: there is a visible gap between rows; we animate only nearby neighbors
      const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : (1 - Math.pow(1 - t, 3));

      const p = ease(frac);
      // draw current digit sliding down, and next digit coming from above (top -> bottom)
      // discrete stacked mode: show multiple rows but only animate during change window
      ctx.globalAlpha = 1;
      const gapRows = opts && opts.gapRows ? opts.gapRows : 1;
      const rowSpace = digitHeight + (gapRows - 1) * (digitHeight * 0.15);
      // render a few rows around center; positions use rowSpace
      const visibleRows = Math.ceil((ctx.canvas.height / rowSpace));
      const half = Math.floor(visibleRows / 2);
      const drawnYs = new Set();
      for (let r = -half; r <= half; r++) {
        // value mapping: above = current + |r|, below = current - r
        let val = (currentValue - r) % 10;
        val = (val + 10) % 10;
        // base position using p for animation (p==0 means center at 0)
        const animOffset = p * rowSpace;
        const drawY = r * rowSpace + animOffset;
        const roundedY = Math.round(drawY);
        if (drawnYs.has(roundedY)) continue;
        drawnYs.add(roundedY);
        ctx.fillText(String(val), 0, drawY);
      }
    }

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
    const animWindow = (options.animWindowMs || 600) / 1000; // seconds (default 600ms)

    // layout: six columns for HH:MM:SS
    const columns = [hTens, hOnes, mTens, mOnes, sTens, sOnes];
    const tToNext = new Array(6).fill(Infinity);

    const nowMs = now.getTime();

    // helper to compute seconds until a given future Date
    function secondsUntil(date) {
      return Math.max(0, (date.getTime() - nowMs) / 1000);
    }

    // sOnes: next change in 1 second boundary
    const sOnesDate = new Date(nowMs + (1 - secFrac) * 1000);
    tToNext[5] = secondsUntil(sOnesDate);

    // sTens: next time seconds % 10 == 0
    const nextSecTens = (Math.floor(secs / 10) + 1) * 10 % 60;
    const sTensDate = new Date(now);
    sTensDate.setSeconds(nextSecTens);
    sTensDate.setMilliseconds(0);
    if (sTensDate.getTime() <= nowMs) sTensDate.setTime(sTensDate.getTime() + 60000);
    tToNext[4] = secondsUntil(sTensDate);

    // mOnes: next minute boundary (seconds -> 0)
    const mOnesDate = new Date(nowMs + (60 - (secs + secFrac)) * 1000);
    tToNext[3] = secondsUntil(mOnesDate);

    // mTens: next minute where Math.floor(min/10) changes
    const nextMinTens = (Math.floor(mins / 10) + 1) * 10 % 60;
    const mTensDate = new Date(now);
    mTensDate.setMinutes(nextMinTens);
    mTensDate.setSeconds(0);
    mTensDate.setMilliseconds(0);
    if (mTensDate.getTime() <= nowMs) mTensDate.setTime(mTensDate.getTime() + 60 * 60 * 1000);
    tToNext[2] = secondsUntil(mTensDate);

    // hOnes: next hour boundary
    const hOnesDate = new Date(now);
    hOnesDate.setHours(now.getHours() + 1);
    hOnesDate.setMinutes(0);
    hOnesDate.setSeconds(0);
    hOnesDate.setMilliseconds(0);
    tToNext[1] = secondsUntil(hOnesDate);

    // hTens: next change of floor(hour/10)
    const currentTens = Math.floor(hours / 10);
    let nextTensHour = (currentTens + 1) * 10;
    if (nextTensHour > 23) nextTensHour = ((nextTensHour) % 24);
    const hTensDate = new Date(now);
    // find the next hour equal to nextTensHour
    let targetHour = nextTensHour;
    let daysToAdd = 0;
    if (targetHour <= hours) daysToAdd = 1;
    hTensDate.setDate(hTensDate.getDate() + daysToAdd);
    hTensDate.setHours(targetHour);
    hTensDate.setMinutes(0);
    hTensDate.setSeconds(0);
    hTensDate.setMilliseconds(0);
    tToNext[0] = secondsUntil(hTensDate);

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
        frac = 1 - timeUntil / animWindow; // linear progress 0..1
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

      // Only the last column (seconds ones) should be continuously scrolling.
      if (i === columns.length - 1) {
        const speed = (options && options.clock6Speed) || (options && options.speedRowsPerSec) || 1;
        drawDigitColumn(ctx, x, centerY, digitWidth, digitHeight, columns[i], nextValue, ms / 1000, color, fontSize, { continuous: true, speedRowsPerSec: speed });
      } else {
        // Non-last columns: discrete stacked mode, animate only during their change window using frac
        drawDigitColumn(ctx, x, centerY, digitWidth, digitHeight, columns[i], nextValue, frac, color, fontSize, { continuous: false, gapRows: 1 });
      }
    }

    // draw colon separators between HH:MM:SS (between col 1&2 and 3&4)
    ctx.fillStyle = color;
    ctx.font = `700 ${Math.floor(fontSize * 0.6)}px monospace`;
    const colonOffset = digitWidth / 2 + gap / 2;
    const colonX1 = startX + (1 * (digitWidth + gap)) + digitWidth / 2 + gap / 2;
    const colonX2 = startX + (3 * (digitWidth + gap)) + digitWidth / 2 + gap / 2;
    const dotGap = Math.max(6, Math.floor(digitHeight * 0.18));
    // draw two stacked dots
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(':', colonX1, centerY);
    ctx.fillText(':', colonX2, centerY);
  }

  // expose as renderClock6 for consistent naming
  global.renderClock6 = renderVerticalClock;
})(this);
