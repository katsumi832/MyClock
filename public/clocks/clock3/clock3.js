(function () {
  // state for flip animation
  const state = {
    shown: null,
    anims: [null, null, null, null],
    dur: 200,
    // pair-level state (HH, MM)
    pShown: null,
    pAnims: [null, null]
  };

  // easing + hinge overlap helpers
  function easeInOutSine(t) { return 0.5 * (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, t)))); }
  function hingeOverlap() {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    return Math.max(1, Math.round(dpr));
  }

  // plate + text helpers
  function roundRectFill(c, x, y, rw, rh, r, fill) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + rw, y, x + rw, y + rh, r);
    c.arcTo(x + rw, y + rh, x, y + rh, r);
    c.arcTo(x, y + rh, x, y, r);
    c.arcTo(x, y, x + rw, y, r);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }
  function drawPlate(c, x, y, rw, rh) {
    const plate = 'rgba(63, 61, 61, 0.4)';
    const radius = Math.floor(rw * 0.08);
    roundRectFill(c, x, y, rw, rh, radius, plate);
  }

  // (keep, but no longer used for seam-on-top)
  function drawSplitPlate(c, x, y, rw, rh) {
    // base plate (keeps rounded corners)
    drawPlate(c, x, y, rw, rh);
    // seam at hinge
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    const hingeY = Math.round(y + rh / 2);
    const seamH = Math.max(1, Math.round(1 * dpr));
    c.save();
    // dark center seam
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(x, hingeY - Math.floor(seamH / 2), rw, seamH);
    // light bevel above and below
    c.fillStyle = 'rgba(255,255,255,0.10)';
    c.fillRect(x, hingeY - seamH - 1, rw, 1);
    c.fillStyle = 'rgba(0,0,0,0.20)';
    c.fillRect(x, hingeY + seamH, rw, 1);
    c.restore();
  }

  function getFont(rh) {
    const weight = 700;
    const family = '"Roboto Condensed", "Segoe UI", system-ui, sans-serif';
    const fontSize = Math.floor(rh * 0.92);
    return { font: `${weight} ${fontSize}px ${family}`, fontSize };
  }
  function getBaselineOffset(c, font, digit, fontSize) {
    c.save(); c.font = font;
    const m = c.measureText(digit);
    c.restore();
    const asc = (m.actualBoundingBoxAscent != null) ? m.actualBoundingBoxAscent : fontSize * 0.8;
    const dsc = (m.actualBoundingBoxDescent != null) ? m.actualBoundingBoxDescent : fontSize * 0.2;
    return (asc - dsc) / 2;
  }
  function renderDigitBitmap(rw, rh, digit, color, font, hingeY, baseOff) {
    const g = document.createElement('canvas');
    g.width = rw; g.height = rh;
    const gc = g.getContext('2d');
    gc.textAlign = 'center';
    gc.textBaseline = 'alphabetic';
    gc.fillStyle = color;
    gc.font = font;
    gc.fillText(digit, rw / 2, hingeY + baseOff);
    return g;
  }

  // helper to render a pair (two digits) into one bitmap
  function renderPairBitmap(rw, rh, pairText, color, font, hingeY, baseOffL, baseOffR, innerGap) {
    const g = document.createElement('canvas');
    g.width = rw; g.height = rh;
    const gc = g.getContext('2d');
    gc.textAlign = 'center';
    gc.textBaseline = 'alphabetic';
    gc.fillStyle = color;
    gc.font = font;
    // split width into two halves separated by innerGap
    const halfW = (rw - innerGap) / 2;
    const leftCx = halfW / 2;
    const rightCx = halfW + innerGap + halfW / 2;
    const chL = pairText[0], chR = pairText[1];
    gc.fillText(chL, leftCx, hingeY + baseOffL);
    gc.fillText(chR, rightCx, hingeY + baseOffR);
    return g;
  }

  // static tile (split draw to avoid hinge seam)
  function drawTileStatic(c, x, y, rw, rh, digit, color) {
    drawPlate(c, x, y, rw, rh);
    const { font, fontSize } = getFont(rh);
    const hingeY = y + rh / 2;
    const baseOff = getBaselineOffset(c, font, digit, fontSize);
    const bmp = renderDigitBitmap(rw, rh, digit, color, font, hingeY - y, baseOff);
    const hingeI = Math.round(hingeY);
    const ov = hingeOverlap();

    // top
    c.save(); c.beginPath(); c.rect(x, y, rw, (hingeI + ov) - y); c.clip();
    c.drawImage(bmp, x, y); c.restore();
    // bottom
    c.save(); c.beginPath(); c.rect(x, hingeI - ov, rw, y + rh - (hingeI - ov)); c.clip();
    c.drawImage(bmp, x, y); c.restore();
  }

  // animated flip
  function drawTileAnimated(c, x, y, rw, rh, fromDigit, toDigit, color, progress) {
    drawPlate(c, x, y, rw, rh);
    const { font, fontSize } = getFont(rh);
    const hingeY = y + rh / 2;
    const hingeLocal = hingeY - y;
    const t = Math.max(0, Math.min(1, progress));
    const tTopRaw = Math.min(1, t * 2);
    const tBotRaw = Math.max(0, (t - 0.5) * 2);
    const t1 = easeInOutSine(tTopRaw);
    const t2 = easeInOutSine(tBotRaw);

    const baseOffFrom = getBaselineOffset(c, font, fromDigit, fontSize);
    const baseOffTo   = getBaselineOffset(c, font, toDigit,   fontSize);
    const fromBmp = renderDigitBitmap(rw, rh, fromDigit, color, font, hingeLocal, baseOffFrom);
    const toBmp   = renderDigitBitmap(rw, rh, toDigit,   color, font, hingeLocal, baseOffTo);

    const hingeI = Math.round(hingeY);
    const ov = hingeOverlap();

    // underlay: show static halves beneath the flap
    if (t < 0.5) {
      // bottom stays FROM
      c.save(); c.beginPath(); c.rect(x, hingeI - ov, rw, y + rh - (hingeI - ov)); c.clip();
      c.drawImage(fromBmp, x, y); c.restore();
    } else {
      // top becomes TO
      c.save(); c.beginPath(); c.rect(x, y, rw, (hingeI + ov) - y); c.clip();
      c.drawImage(toBmp, x, y); c.restore();
    }

    // animated flap with subtle shading and reduced skew
    const skewMax = 0.12;
    if (t < 0.5) {
      // top flap (FROM) flips down
      const sy = Math.max(0.0001, 1 - t1);
      const skew = (1 - sy) * skewMax;
      c.save();
      c.beginPath(); c.rect(x, y, rw, (hingeI + ov) - y); c.clip();
      c.translate(0, hingeY);
      c.transform(1, 0, skew, 1, 0, 0);
      c.scale(1, sy);
      c.drawImage(fromBmp, x, -hingeY + y);
      // shading
      const g = c.createLinearGradient(0, -rh, 0, 0);
      g.addColorStop(0, `rgba(0,0,0,${0.18 * (1 - sy)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = g;
      c.fillRect(x - 2, -rh, rw + 4, rh);
      c.restore();
    } else {
      // bottom flap (TO) flips down
      const sy = Math.max(0.0001, t2);
      const skew = (1 - sy) * skewMax;
      c.save();
      c.beginPath(); c.rect(x, hingeI - ov, rw, y + rh - (hingeI - ov)); c.clip();
      c.translate(0, hingeY);
      c.transform(1, 0, skew, 1, 0, 0);
      c.scale(1, sy);
      c.drawImage(toBmp, x, -hingeY + y);
      // shading
      const g = c.createLinearGradient(0, 0, 0, rh);
      g.addColorStop(0, `rgba(0,0,0,${0.12 * (1 - sy)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = g;
      c.fillRect(x - 2, 0, rw + 4, rh);
      c.restore();
    }
  }

  // static pair card (split draw to avoid hinge seam)
  function drawPairTileStatic(c, x, y, rw, rh, pairText, color, innerGap, seamColor) {
    // draw base plate; hinge seam is drawn on top later
    drawPlate(c, x, y, rw, rh);
    const { font, fontSize } = getFont(rh);
    const hingeY = y + rh / 2;
    const baseOffL = getBaselineOffset(c, font, pairText[0], fontSize);
    const baseOffR = getBaselineOffset(c, font, pairText[1], fontSize);
    const bmp = renderPairBitmap(rw, rh, pairText, color, font, hingeY - y, baseOffL, baseOffR, innerGap);
    const hingeI = Math.round(hingeY);
    const ov = hingeOverlap();

    c.save(); c.beginPath(); c.rect(x, y, rw, (hingeI + ov) - y); c.clip();
    c.drawImage(bmp, x, y); c.restore();

    c.save(); c.beginPath(); c.rect(x, hingeI - ov, rw, y + rh - (hingeI - ov)); c.clip();
    c.drawImage(bmp, x, y); c.restore();

    // draw the middle gap on top of numbers, using background-like color
    drawHingeOverlay(c, x, y, rw, rh, seamColor);
  }

  // animated pair card
  function drawPairTileAnimated(c, x, y, rw, rh, fromPair, toPair, color, progress, innerGap, seamColor) {
    // draw base plate; hinge seam is drawn on top later
    drawPlate(c, x, y, rw, rh);
    const { font, fontSize } = getFont(rh);
    const hingeY = y + rh / 2;
    const hingeLocal = hingeY - y;
    const t = Math.max(0, Math.min(1, progress));
    const tTopRaw = Math.min(1, t * 2);
    const tBotRaw = Math.max(0, (t - 0.5) * 2);
    const t1 = easeInOutSine(tTopRaw);
    const t2 = easeInOutSine(tBotRaw);

    const baseOffFL = getBaselineOffset(c, font, fromPair[0], fontSize);
    const baseOffFR = getBaselineOffset(c, font, fromPair[1], fontSize);
    const baseOffTL = getBaselineOffset(c, font, toPair[0], fontSize);
    const baseOffTR = getBaselineOffset(c, font, toPair[1], fontSize);

    const fromBmp = renderPairBitmap(rw, rh, fromPair, color, font, hingeLocal, baseOffFL, baseOffFR, innerGap);
    const toBmp   = renderPairBitmap(rw, rh, toPair,   color, font, hingeLocal, baseOffTL, baseOffTR, innerGap);

    const hingeI = Math.round(hingeY);
    const ov = hingeOverlap();

    if (t < 0.5) {
      c.save(); c.beginPath(); c.rect(x, hingeI - ov, rw, y + rh - (hingeI - ov)); c.clip();
      c.drawImage(fromBmp, x, y); c.restore();
    } else {
      c.save(); c.beginPath(); c.rect(x, y, rw, (hingeI + ov) - y); c.clip();
      c.drawImage(toBmp, x, y); c.restore();
    }

    const skewMax = 0.12;
    if (t < 0.5) {
      const sy = Math.max(0.0001, 1 - t1);
      const skew = (1 - sy) * skewMax;
      c.save();
      c.beginPath(); c.rect(x, y, rw, (hingeI + ov) - y); c.clip();
      c.translate(0, hingeY);
      c.transform(1, 0, skew, 1, 0, 0);
      c.scale(1, sy);
      c.drawImage(fromBmp, x, -hingeY + y);
      const g = c.createLinearGradient(0, -rh, 0, 0);
      g.addColorStop(0, `rgba(0,0,0,${0.18 * (1 - sy)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = g; c.fillRect(x - 2, -rh, rw + 4, rh);
      c.restore();
    } else {
      const sy = Math.max(0.0001, t2);
      const skew = (1 - sy) * skewMax;
      c.save();
      c.beginPath(); c.rect(x, hingeI - ov, rw, y + rh - (hingeI - ov)); c.clip();
      c.translate(0, hingeY);
      c.transform(1, 0, skew, 1, 0, 0);
      c.scale(1, sy);
      c.drawImage(toBmp, x, -hingeY + y);
      const g = c.createLinearGradient(0, 0, 0, rh);
      g.addColorStop(0, `rgba(0,0,0,${0.12 * (1 - sy)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = g; c.fillRect(x - 2, 0, rw + 4, rh);
      c.restore();
    }

    // draw the middle gap on top of the number during animation
    drawHingeOverlay(c, x, y, rw, rh, seamColor);
  }

  // seam helpers: resolve background-like color and draw hinge overlay on top
  function resolveSeamColor(opts) {
    if (opts && typeof opts.bg === 'string' && opts.bg) return opts.bg;
    try {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)') return bodyBg;
    } catch(_) {}
    return '#000'; // Electron window background
  }
  function drawHingeOverlay(c, x, y, rw, rh, color) {
    const hingeY = Math.round(y + rh / 2);
    const seamH = Math.max(2, Math.round(rh * 0.01)); // thin but visible
    c.save();
    c.fillStyle = color;
    c.fillRect(x, hingeY - Math.floor(seamH / 2), rw, seamH);
    c.restore();
  }

  // main render (keeps existing API: renderClock3(ctx, w, h, paint, size, now, opts))
  window.renderClock3 = function (ctx, w, h, paint, size, now, opts) {
    now = now || new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const digits = [hh[0], hh[1], mm[0], mm[1]];
    const ts = now.getTime();
    if (!state.shown) state.shown = digits.slice();

    // layout: two pair cards (HH and MM)
    let tileH = Math.floor(h * 0.95);
    let tileW = Math.floor(tileH * 0.56);
    let innerGap = Math.max(1, Math.floor(tileW * 0.06)); // gap between two digits inside a pair
    let pairW = tileW * 2 + innerGap;
    let groupGap = innerGap * 2; // gap between HH and MM cards
    let totalW = pairW * 2 + groupGap;
    const maxW = Math.floor(w * 0.96);
    if (totalW > maxW) {
      const scale = maxW / totalW;
      tileW = Math.floor(tileW * scale);
      tileH = Math.floor(tileH * scale);
      innerGap = Math.max(1, Math.floor(innerGap * scale));
      pairW = tileW * 2 + innerGap;
      groupGap = Math.max(1, Math.floor(groupGap * scale));
      totalW = pairW * 2 + groupGap;
    }
    const cx = Math.floor((w - totalW) / 2);
    const cy = Math.floor((h - tileH) / 2);

    // color
    let baseColor = '#ffffff';
    if (typeof paint === 'string' && paint.trim()) baseColor = paint;
    else if (typeof window !== 'undefined' && window.appliedSettings && window.appliedSettings.color) baseColor = window.appliedSettings.color;
    const uniformColor = (paint && typeof paint !== 'string') ? paint : baseColor;

    // resolve seam color to match background
    const seamColor = resolveSeamColor(opts);

    // pair strings
    const pairs = [hh, mm];
    if (!state.pShown) state.pShown = pairs.slice();

    // start pair animations (HH card, MM card)
    const hourChanged = state.pShown[0] !== pairs[0];
    const minChanged  = state.pShown[1] !== pairs[1];
    if (hourChanged && !state.pAnims[0]) {
      state.pAnims[0] = { from: state.pShown[0], to: pairs[0], start: ts, dur: state.dur };
    }
    if (minChanged && !state.pAnims[1]) {
      state.pAnims[1] = { from: state.pShown[1], to: pairs[1], start: ts, dur: state.dur };
    }

    // positions for two pair cards
    const xH = cx;
    const xM = xH + pairW + groupGap;

    // draw HH pair card
    const aH = state.pAnims[0];
    if (aH) {
      const p = Math.min(1, (ts - aH.start) / aH.dur);
      drawPairTileAnimated(ctx, xH, cy, pairW, tileH, aH.from, aH.to, uniformColor, p, innerGap, seamColor);
      if (p >= 1) { state.pShown[0] = aH.to; state.pAnims[0] = null; }
    } else {
      drawPairTileStatic(ctx, xH, cy, pairW, tileH, state.pShown[0], uniformColor, innerGap, seamColor);
    }

    // draw MM pair card
    const aM = state.pAnims[1];
    if (aM) {
      const p = Math.min(1, (ts - aM.start) / aM.dur);
      drawPairTileAnimated(ctx, xM, cy, pairW, tileH, aM.from, aM.to, uniformColor, p, innerGap, seamColor);
      if (p >= 1) { state.pShown[1] = aM.to; state.pAnims[1] = null; }
    } else {
      drawPairTileStatic(ctx, xM, cy, pairW, tileH, state.pShown[1], uniformColor, innerGap, seamColor);
    }
  };
})();
