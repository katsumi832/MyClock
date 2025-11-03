(function () {
  // state for flip animation
  const state = {
    shown: null,
    anims: [null, null, null, null],
    dur: 400
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
  function getFont(rh) {
    const weight = 700;
    const family = '"Bebas Neue", "Roboto Condensed", "Segoe UI", system-ui, sans-serif';
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

  // main render (keeps existing API: renderClock3(ctx, w, h, paint, size, now, opts))
  window.renderClock3 = function (ctx, w, h, paint, size, now, opts) {
    now = now || new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const digits = [hh[0], hh[1], mm[0], mm[1]];
    const ts = now.getTime();

    if (!state.shown) state.shown = digits.slice();

    // layout
    let tileH = Math.floor(h * 0.95);
    let tileW = Math.floor(tileH * 0.56);
    let innerGap = Math.max(1, Math.floor(tileW * 0.06));
    let groupGap = innerGap * 2;
    let totalW = tileW * 4 + innerGap * 2 + groupGap;
    const maxW = Math.floor(w * 0.96);
    if (totalW > maxW) {
      const scale = maxW / totalW;
      tileW = Math.floor(tileW * scale);
      tileH = Math.floor(tileH * scale);
      innerGap = Math.max(1, Math.floor(innerGap * scale));
      groupGap = innerGap * 2;
      totalW = tileW * 4 + innerGap * 2 + groupGap;
    }
    const cx = Math.floor((w - totalW) / 2);
    const cy = Math.floor((h - tileH) / 2);

    // color
    let baseColor = '#ffffff';
    if (typeof paint === 'string' && paint.trim()) baseColor = paint;
    else if (typeof window !== 'undefined' && window.appliedSettings && window.appliedSettings.color) baseColor = window.appliedSettings.color;
    const uniformColor = (paint && typeof paint !== 'string') ? paint : baseColor;

    // start animations together per group (HH together, MM together)
    const hourChanged = (state.shown[0] !== digits[0]) || (state.shown[1] !== digits[1]);
    const minChanged  = (state.shown[2] !== digits[2]) || (state.shown[3] !== digits[3]);

    if (hourChanged) {
      const start = ts;
      // flip both hour tiles together (even if one digit doesn't change)
      for (const i of [0, 1]) {
        if (!state.anims[i]) {
          state.anims[i] = { from: state.shown[i], to: digits[i], start, dur: state.dur };
        }
      }
    }
    if (minChanged) {
      const start = ts;
      // flip both minute tiles together (even if one digit doesn't change)
      for (const i of [2, 3]) {
        if (!state.anims[i]) {
          state.anims[i] = { from: state.shown[i], to: digits[i], start, dur: state.dur };
        }
      }
    }

    // positions: [H1][inner][H2][group][M1][inner][M2]
    const x0 = cx;
    const x1 = x0 + tileW + innerGap;
    const x2 = x1 + tileW + groupGap;
    const x3 = x2 + tileW + innerGap;
    const positions = [
      { x: x0, i: 0 }, { x: x1, i: 1 }, { x: x2, i: 2 }, { x: x3, i: 3 }
    ];

    // draw tiles (animated if active)
    positions.forEach(({ x, i }) => {
      const anim = state.anims[i];
      if (anim) {
        const p = Math.min(1, (ts - anim.start) / anim.dur);
        drawTileAnimated(ctx, x, cy, tileW, tileH, anim.from, anim.to, uniformColor, p);
        if (p >= 1) { state.shown[i] = anim.to; state.anims[i] = null; }
      } else {
        drawTileStatic(ctx, x, cy, tileW, tileH, state.shown[i], uniformColor);
      }
    });
  };
})();
