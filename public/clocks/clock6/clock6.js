// clock6.js (vertical renderer)
// Clock 6 — vertical rolling digits clock implementation
// Exposes function: renderClock6(ctx, w, h, color, size, now, options)
(function(global){
  function drawDigitColumn(ctx, x, y, digitWidth, digitHeight, currentValue, nextValue, timeUntil, color, fontSize, opts) {
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
    const nowMs = (opts && opts.nowMs) || Date.now();
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
  const roundedY = Math.round(drawY * 100) / 100;
  if (drawnYs.has(roundedY)) continue;
  drawnYs.add(roundedY);
  // Use normal opacity for all rows
  ctx.globalAlpha = 1;
        ctx.fillText(String(val), 0, drawY);
      }
    } else {
      // normal behavior: there is a visible gap between rows; we animate only nearby neighbors
      const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : (1 - Math.pow(1 - t, 3));

      const animWindow = (opts && opts.animWindowSec) || 3.0;
      const progress = Math.max(0, Math.min(1, 1 - timeUntil / animWindow));
      const p = ease(progress);
      // discrete stacked mode: show multiple rows but only animate during change window
      ctx.globalAlpha = 1;
      const gapRows = opts && opts.gapRows ? opts.gapRows : 1;
      const rowSpace = digitHeight + (gapRows - 1) * (digitHeight * 0.15);
      // render a few rows around center; positions use rowSpace
      const visibleRows = Math.ceil((ctx.canvas.height / rowSpace));
      const half = Math.floor(visibleRows / 2);
      const drawnYs = new Set();

      // Domain-aware digit list (for tens places). If opts.domain provided, use it.
      const domain = (opts && Array.isArray(opts.domain) && opts.domain.length) ? opts.domain.slice() : [0,1,2,3,4,5,6,7,8,9];
      const domainLen = domain.length;
      // find index of currentValue in domain; fallback to numeric mapping
      let centerIndex = domain.indexOf(currentValue);
      if (centerIndex === -1) centerIndex = ((currentValue % domainLen) + domainLen) % domainLen;

      // Render extra rows above center so upcoming digits are already drawn off-screen
      const extraAbove = opts && opts.extraAbove ? opts.extraAbove : 6;
      const extraBelow = opts && opts.extraBelow ? opts.extraBelow : 2;
      const startR = -half - extraAbove;
      const endR = half + extraBelow;
      const animOffset = p * rowSpace;
  for (let r = startR; r <= endR; r++) {
        // value mapping within domain: take domain index offset from centerIndex
        const idx = ((centerIndex - r) % domainLen + domainLen) % domainLen;
        const val = domain[idx];
        const drawY = r * rowSpace + animOffset;
  const roundedY = Math.round(drawY * 100) / 100;
  if (drawnYs.has(roundedY)) continue;
  drawnYs.add(roundedY);
  // Use normal opacity for all rows
  ctx.globalAlpha = 1;
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

  // compute digit sizes (slightly larger)
  const totalGap = gap * (columns.length - 1) + padding * 2;
  const digitWidth = Math.min(120, Math.floor((w - totalGap) / columns.length));
  const digitHeight = Math.floor(digitWidth * 1.8);
  const fontSize = Math.floor(digitWidth * 1.15);

    // helper to create gradients/patterns locally (supports split)
    function makeLocalPaint(ctx, w, h, c1, c2, pattern) {
      if (pattern === 'split') {
        const tmp = document.createElement('canvas'); tmp.width = Math.max(1, Math.floor(w)); tmp.height = Math.max(1, Math.floor(h));
        const tctx = tmp.getContext('2d');
        tctx.fillStyle = c1; tctx.fillRect(0,0,Math.floor(tmp.width/2),tmp.height);
        tctx.fillStyle = c2; tctx.fillRect(Math.floor(tmp.width/2),0,tmp.width-Math.floor(tmp.width/2),tmp.height);
        return ctx.createPattern(tmp, 'no-repeat');
      }
      if (!pattern || pattern === 'vertical') {
        const g = ctx.createLinearGradient(0,0,0,h);
        g.addColorStop(0,c1); g.addColorStop(1,c2); return g;
      }
      if (pattern === 'horizontal') {
        const g = ctx.createLinearGradient(0,0,w,0);
        g.addColorStop(0,c1); g.addColorStop(1,c2); return g;
      }
      if (pattern === 'diag-tlbr') {
        const g = ctx.createLinearGradient(0,0,w,h);
        g.addColorStop(0,c1); g.addColorStop(1,c2); return g;
      }
      if (pattern === 'diag-bltr') {
        const g = ctx.createLinearGradient(0,h,w,0);
        g.addColorStop(0,c1); g.addColorStop(1,c2); return g;
      }
      const rg = ctx.createRadialGradient(w/2,h/2,1,w/2,h/2,Math.max(w,h));
      rg.addColorStop(0,c1); rg.addColorStop(1,c2); return rg;
    }

    // background: only draw if clock is allowed to paint its own background
    ctx.clearRect(0, 0, w, h);
    if (!options || !options.suppressBg) {
      let bgPaint = (options && options.bg) ? options.bg : '#000';
      if (options && options.bgGradient && Array.isArray(options.bgGradient)) {
        const [c1,c2,pattern] = options.bgGradient;
        bgPaint = makeLocalPaint(ctx,w,h,c1,c2,pattern);
      }
      ctx.fillStyle = bgPaint;
      ctx.fillRect(0, 0, w, h);
    }

  // compute start x with tighter spacing within pairs (HH, MM, SS)
  const pairInnerGap = Math.max(2, Math.floor(gap / 3)); // small gap between tens/ones
  const pairOuterGap = gap; // gap between pairs
  // total width = 6 digits + inner gaps for each pair (3) + outer gaps between pairs (2)
  const totalWidth = digitWidth * 6 + pairInnerGap * 3 + pairOuterGap * 2;
  const startX = (w - totalWidth) / 2 + digitWidth / 2;
    const centerY = h / 2;

    // prepare font paint (may be descriptor object with .grad)
    let fontPaint = color;
    if (color && typeof color === 'object' && color.grad) {
      const [c1,c2,pattern] = color.grad;
      fontPaint = makeLocalPaint(ctx,w,h,c1,c2,pattern);
    }

    for (let i = 0; i < columns.length; i++) {
      // map index to x with tighter pair spacing: indices 0-1 (H),2-3(M),4-5(S)
      const pairIndex = Math.floor(i / 2);
      const inPairIndex = i % 2; // 0 -> tens, 1 -> ones
      const x = startX + pairIndex * (digitWidth * 2 + pairInnerGap + pairOuterGap) + inPairIndex * (digitWidth + pairInnerGap);
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

    if (i === columns.length - 1) {
        // Last column (seconds ones) remains continuous (smooth ms-based scroll)
        const speed = (options && options.clock6Speed) || (options && options.speedRowsPerSec) || 1;
  drawDigitColumn(ctx, x, centerY, digitWidth, digitHeight, columns[i], nextValue, timeUntil, fontPaint, fontSize, { continuous: true, speedRowsPerSec: speed, animWindowSec: animWindow, nowMs: nowMs });
      } else {
        // Non-last columns: discrete stacked mode, animate only during their change window using timeUntil
        // Provide a domain for tens places so they only cycle through valid digits
        let domain = null;
        if (i === 0) domain = [0,1,2]; // hour tens
        else if (i === 2 || i === 4) domain = [0,1,2,3,4,5]; // minute tens, seconds tens
        else domain = [0,1,2,3,4,5,6,7,8,9];
        drawDigitColumn(ctx, x, centerY, digitWidth, digitHeight, columns[i], nextValue, timeUntil, fontPaint, fontSize, { continuous: false, gapRows: 1, domain: domain, animWindowSec: animWindow, extraAbove: 6, extraBelow: 2 });
      }
    }

  // draw colon separators between HH:MM:SS as exact midpoints between pairs
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.floor(fontSize * 0.6)}px monospace`;
  // helper to compute the x position used earlier for a given digit index
  const xForIndex = (i) => startX + Math.floor(i / 2) * (digitWidth * 2 + pairInnerGap + pairOuterGap) + (i % 2) * (digitWidth + pairInnerGap);
  const colonX1 = (xForIndex(1) + xForIndex(2)) / 2;
  const colonX2 = (xForIndex(3) + xForIndex(4)) / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(':', colonX1, centerY);
  ctx.fillText(':', colonX2, centerY);
  }

  // expose as renderClock6 for consistent naming
  global.renderClock6 = renderVerticalClock;
})(this);
