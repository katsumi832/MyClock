(function () {
  // window.renderClock8(ctx, w, h, paint, size, now, opts)
  window.renderClock8 = function (ctx, w, h, paint, size, now, opts) {
    now = now || new Date();
    // clear only; keep transparent background unless explicitly requested
    ctx.clearRect(0, 0, w, h);
    if (opts && !opts.suppressBg) {
      if (opts.bgGradient && Array.isArray(opts.bgGradient) && opts.bgGradient.length >= 2) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, opts.bgGradient[0]);
        g.addColorStop(1, opts.bgGradient[1]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      } else if (opts.bg) {
        ctx.fillStyle = opts.bg;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // digits HHMM (no colon)
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const digits = [hh[0], hh[1], mm[0], mm[1]];

    // 4 vertical panels
    const panelW = w / 4;
    const panelH = h;

    // font setup: huge size so digits overflow and get cropped by panel
    const weight = 800;
    const family = `"M PLUS Rounded 1c", "Nunito", "Poppins", "Segoe UI", system-ui, sans-serif`;
    // Oversize relative to height to ensure overflow at the sides
    const fontSize = Math.max(16, Math.floor(panelH * 1.25));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${weight} ${fontSize}px ${family}`;

    // fill color/paint
    try { ctx.fillStyle = paint; } catch { ctx.fillStyle = '#ffffff'; }

    // Draw each digit clipped to its panel with vertical offsets (hours lower, minutes higher)
    for (let i = 0; i < 4; i++) {
      const x0 = Math.floor(i * panelW);
      const xCenter = Math.floor(x0 + panelW / 2);
      let yCenter = Math.floor(panelH / 2);
      // shift hours (i: 0,1) lower, minutes (i: 2,3) higher
      const vShift = Math.round(panelH * 0.08);
      yCenter += (i < 2) ? vShift : -vShift;

      ctx.save();
      // clip to panel rect so overflow is cropped
      ctx.beginPath();
      ctx.rect(x0, 0, Math.ceil(panelW), panelH);
      ctx.clip();

      // render digit
      ctx.fillText(digits[i], xCenter, yCenter);

      ctx.restore();
    }

    // divider lines between panels (on top of numbers)
    const lineW = Math.max(2, Math.round(Math.min(w, h) * 0.004));
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = lineW;
    for (let k = 1; k < 4; k++) {
      const xLine = Math.round(k * panelW);
      ctx.beginPath();
      ctx.moveTo(xLine, 0);
      ctx.lineTo(xLine, h);
      ctx.stroke();
    }
    ctx.restore();
  };
})();
