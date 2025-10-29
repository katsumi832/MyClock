(function () {
  // Clock 5 — large rounded "HH:MM" with slight overlap and round-looking glyphs
  window.renderClock5 = function (ctx, w, h, paint, size, now, opts) {
    now = now || new Date();
    ctx.clearRect(0, 0, w, h);

    // Prepare time digits
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const chars = [hh[0], hh[1], ':', mm[0], mm[1]];

    // Determine colors (paint may be gradient/pattern or simple color)
    let accentDark = '#E91E63';
    let accentLight = '#FF80AB';
    if (typeof paint === 'string' && paint.trim().length) {
      accentDark = paint;
      accentLight = '#FF80AB';
    }

    // Rounded display font stack (prefer rounded / geometric fonts)
    const weight = '800';
    const family = "Quicksand, Nunito, Poppins, 'Segoe UI', system-ui, sans-serif";

    // Layout margins
    const margin = Math.max(12, Math.floor(Math.min(w, h) * 0.02));
    const usableW = w - margin * 2;
    const usableH = h - margin * 2;

    // Overlap and layer offsets
    const overlapRatio = 0.18; // increased overlap for slight stacking
    const layerOffset = Math.max(4, Math.round(h * 0.0075)); // pixel shift between layers

    // Start fontSize large and shrink until it fits
    let fontSize = Math.floor(usableH * 0.9);
    fontSize = Math.max(20, fontSize);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    let measured = [];
    let avg = 0;
    let overlap = 0;
    let totalWidth = 0;
    let lineHeight = 0;

    function measureFor(fs) {
      ctx.font = `${weight} ${fs}px ${family}`;
      measured = chars.map(ch => ctx.measureText(ch).width);
      avg = measured.reduce((a, b) => a + b, 0) / measured.length;
      overlap = Math.max(Math.round(avg * overlapRatio), 2);
      totalWidth = measured.reduce((a, b) => a + b, 0) - overlap * (chars.length - 1);
      lineHeight = Math.ceil(fs * 1.05);
      return { totalWidth, lineHeight };
    }

    let m = measureFor(fontSize);
    while ((m.totalWidth > usableW || m.lineHeight > usableH) && fontSize > 8) {
      fontSize--;
      m = measureFor(fontSize);
    }

    // Finalize font and metrics
    ctx.font = `${weight} ${fontSize}px ${family}`;
    totalWidth = m.totalWidth;
    lineHeight = m.lineHeight;

    // center start x
    const startX = Math.round((w - totalWidth) / 2);
    const centerY = Math.round(h / 2);

    // subtle soft shadow to reduce perceived sharp edges
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = Math.max(6, Math.round(fontSize * 0.04));

    // Draw base (dark) layer slightly down-right
    let x = startX;
    ctx.globalAlpha = 1;
    ctx.fillStyle = accentDark;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const chW = measured[i];
      if (ch === ':') {
        // colon as two rounded dots (dark layer)
        const dotR = Math.max(Math.round(fontSize * 0.09), 8);
        const cx = x + chW / 2 + layerOffset;
        const topY = centerY - Math.round(fontSize * 0.18) + layerOffset;
        const bottomY = centerY + Math.round(fontSize * 0.18) + layerOffset;
        ctx.beginPath(); ctx.arc(cx, topY, dotR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, bottomY, dotR, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillText(ch, x + layerOffset, centerY + layerOffset);
      }
      x += chW - overlap;
    }

    // Draw overlay (light) layer slightly up-left for stacked look
    x = startX;
    ctx.fillStyle = accentLight;
    ctx.globalAlpha = 0.92;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const chW = measured[i];
      if (ch === ':') {
        const dotR = Math.max(Math.round(fontSize * 0.09), 8);
        const cx = x + chW / 2 - layerOffset;
        const topY = centerY - Math.round(fontSize * 0.18) - layerOffset;
        const bottomY = centerY + Math.round(fontSize * 0.18) - layerOffset;
        ctx.beginPath(); ctx.arc(cx, topY, dotR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, bottomY, dotR, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillText(ch, x - layerOffset, centerY - layerOffset);
      }
      x += chW - overlap;
    }
    ctx.globalAlpha = 1;

    // Remove shadow for other drawings
    ctx.shadowBlur = 0;

    // small device knob (rounded) — aesthetic
    const knobSize = Math.max(36, Math.round(Math.min(w, h) * 0.06));
    const knobX = w - margin - knobSize;
    const knobY = margin;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRectFill(ctx, knobX, knobY, knobSize, knobSize, Math.max(8, knobSize / 4), ctx.fillStyle);
    // inner dot gradient
    const kd = knobSize * 0.45;
    const kg = ctx.createLinearGradient(knobX, knobY, knobX + knobSize, knobY + knobSize);
    kg.addColorStop(0, accentDark);
    kg.addColorStop(1, accentLight);
    ctx.fillStyle = kg;
    ctx.beginPath(); ctx.arc(knobX + knobSize / 2, knobY + knobSize / 2, kd / 2, 0, Math.PI * 2); ctx.fill();

    // helpers
    function roundRectFill(ctx, x, y, w, h, r, fillStyle) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
  };
})();