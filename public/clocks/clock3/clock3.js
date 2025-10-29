(function () {
  const state = {
    shown: null,
    anims: [null, null, null, null],
    dur: 900
  };

  function easeInOutSine(t) {
    return 0.5 * (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, t))));
  }

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
    // single fill — no top/bottom overlays, no stroke at hinge
    const plate = 'rgba(0,0,0,0.40)';
    const radius = Math.floor(rw * 0.08);
    roundRectFill(c, x, y, rw, rh, radius, plate);
  }

  function getFont(rh) {
    const weight = 700;
    const family = '"Roboto Condensed", "Segoe UI", system-ui, sans-serif';
    const fontSize = Math.floor(rh * 0.92);
    return { font: `${weight} ${fontSize}px ${family}`, weight, family, fontSize };
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

  // helper: overlap for hinge to avoid any seam
  function hingeOverlap() {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    return Math.max(1, Math.round(dpr)); // 1–2 px typically
  }

  function drawTileStatic(c, x, y, rw, rh, digit, color) {
    drawPlate(c, x, y, rw, rh);
    const { font, fontSize } = getFont(rh);
    const hingeY = y + rh / 2;
    const baseOff = getBaselineOffset(c, font, digit, fontSize);
    const bmp = renderDigitBitmap(rw, rh, digit, color, font, hingeY - y, baseOff);

    // Use integer hinge and overlap to remove the seam
    const hingeI = Math.round(hingeY);
    const ov = hingeOverlap();

    // top half (extend down by overlap)
    c.save();
    c.beginPath();
    c.rect(x, y, rw, (hingeI + ov) - y);
    c.clip();
    c.drawImage(bmp, x, y);
    c.restore();

    // bottom half (start a bit above by overlap)
    c.save();
    c.beginPath();
    c.rect(x, hingeI - ov, rw, y + rh - (hingeI - ov));
    c.clip();
    c.drawImage(bmp, x, y);
    c.restore();
  }

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
    const baseOffTo = getBaselineOffset(c, font, toDigit, fontSize);

    const fromBmp = renderDigitBitmap(rw, rh, fromDigit, color, font, hingeLocal, baseOffFrom);
    const toBmp   = renderDigitBitmap(rw, rh, toDigit,   color, font, hingeLocal, baseOffTo);

    // Integer hinge + overlap to avoid seam
    const hingeI = Math.round(hingeY);
    const ov = hingeOverlap();

    // Static layers under the moving flap
    if (t < 0.5) {
      // bottom remains FROM
      c.save();
      c.beginPath(); c.rect(x, hingeI - ov, rw, y + rh - (hingeI - ov)); c.clip();
      c.drawImage(fromBmp, x, y);
      c.restore();
    } else {
      // top switches to TO
      c.save();
      c.beginPath(); c.rect(x, y, rw, (hingeI + ov) - y); c.clip();
      c.drawImage(toBmp, x, y);
      c.restore();
    }

    // Animated flap
    const skewMax = 0.12; // slightly reduced for smoother feel
    if (t < 0.5) {
      // Phase 1: top of FROM flips down
      const sy = Math.max(0.0001, 1 - t1);
      const skew = (1 - sy) * skewMax;
      c.save();
      c.beginPath(); c.rect(x, y, rw, (hingeI + ov) - y); c.clip();
      c.translate(0, hingeY);
      c.transform(1, 0, skew, 1, 0, 0);
      c.scale(1, sy);
      c.drawImage(fromBmp, x, -hingeY + y);
      // softer shading as it flips away
      const g = c.createLinearGradient(0, -rh, 0, 0);
      g.addColorStop(0, `rgba(0,0,0,${0.18 * (1 - sy)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = g;
      c.fillRect(x - 2, -rh, rw + 4, rh);
      c.restore();
    } else {
      // Phase 2: bottom of TO flips down
      const sy = Math.max(0.0001, t2);
      const skew = (1 - sy) * skewMax;
      c.save();
      c.beginPath(); c.rect(x, hingeI - ov, rw, y + rh - (hingeI - ov)); c.clip();
      c.translate(0, hingeY);
      c.transform(1, 0, skew, 1, 0, 0);
      c.scale(1, sy);
      c.drawImage(toBmp, x, -hingeY + y);
      // softer shading as it flips in
      const g = c.createLinearGradient(0, 0, 0, rh);
      g.addColorStop(0, `rgba(0,0,0,${0.12 * (1 - sy)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = g;
      c.fillRect(x - 2, 0, rw + 4, rh);
      c.restore();
    }
  }

  window.renderClock3 = function (ctx, w, h, paint, size, now, opts) {
    now = now || new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const digits = [hh[0], hh[1], mm[0], mm[1]];

    if (!state.shown) state.shown = digits.slice();
    const ts = now.getTime();

    let tileH = Math.floor(h * 0.95);
    let tileW = Math.floor(tileH * 0.56);
    const gap = Math.max(2, Math.floor(tileH * 0.03));
    let totalW = tileW * 4 + gap * 3;
    const maxW = Math.floor(w * 0.96);
    if (totalW > maxW) {
      const scale = maxW / totalW;
      tileW = Math.floor(tileW * scale);
      tileH = Math.floor(tileH * scale);
      totalW = tileW * 4 + gap * 3;
    }
    const cx = Math.floor((w - totalW) / 2);
    const cy = Math.floor((h - tileH) / 2);

    let baseColor = '#ffffff';
    if (typeof paint === 'string' && paint.trim()) baseColor = paint;
    else if (typeof window !== 'undefined' && window.appliedSettings && window.appliedSettings.color) baseColor = window.appliedSettings.color;
    const uniformColor = (paint && typeof paint !== 'string') ? paint : baseColor;

    for (let i = 0; i < 4; i++) {
      if (state.shown[i] !== digits[i] && !state.anims[i]) {
        state.anims[i] = { from: state.shown[i], to: digits[i], start: ts, dur: state.dur };
      }
    }

    const positions = [
      { x: cx, color: uniformColor, i: 0 },
      { x: cx + tileW + gap, color: uniformColor, i: 1 },
      { x: cx + (tileW + gap) * 2, color: uniformColor, i: 2 },
      { x: cx + (tileW + gap) * 3, color: uniformColor, i: 3 },
    ];

    positions.forEach(({ x, color, i }) => {
      const anim = state.anims[i];
      if (anim) {
        const p = Math.min(1, (ts - anim.start) / anim.dur);
        drawTileAnimated(ctx, x, cy, tileW, tileH, anim.from, anim.to, color, p);
        if (p >= 1) { state.shown[i] = anim.to; state.anims[i] = null; }
      } else {
        drawTileStatic(ctx, x, cy, tileW, tileH, state.shown[i], color);
      }
    });
  };
})();
