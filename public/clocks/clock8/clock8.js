(function () {
  // window.renderClock8(ctx, w, h, paint, size, now, opts)
  window.renderClock8 = function (ctx, w, h, paint, size, now, opts) {
    now = now || new Date();
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

    // font setup (square/straight font)
    const weight = 700; // Oswald
    const family = `"Segoe UI", system-ui, sans-serif`;

    // vertical shift: hours lower, minutes higher
    const vShiftMag = Math.round(panelH * 0.04); // reduce shift a bit more to allow bigger font
    // global downward offset for all digits (can be overridden via opts.offsetY)
    const globalDown = (opts && typeof opts.offsetY === 'number')
      ? Math.round(opts.offsetY)
      : Math.round(panelH * 0.10); // moved further down by default

    // Fit font so top/bottom don't clip even after the shifts
    let fontSize = Math.max(16, Math.floor(panelH * 1.75)); // larger base size target
    const margin = Math.floor(panelH * 0.003); // even smaller margin to free more height
    // include downward offset in fit (worst-case is vShiftMag + globalDown)
    const allowedH = Math.max(8, panelH - 2 * margin - 2 * (vShiftMag + Math.max(0, globalDown)));
    function measureDigitHeight(fs) {
      ctx.font = `${weight} ${fs}px ${family}`;
      const m = ctx.measureText('8'); // tallest digit
      const asc = (m.actualBoundingBoxAscent != null) ? m.actualBoundingBoxAscent : fs * 0.8;
      const desc = (m.actualBoundingBoxDescent != null) ? m.actualBoundingBoxDescent : fs * 0.2;
      return asc + desc;
    }
    let measured = measureDigitHeight(fontSize);
    if (measured > allowedH) {
      fontSize = Math.floor(fontSize * (allowedH / measured));
      measured = measureDigitHeight(fontSize);
      while (measured > allowedH && fontSize > 8) {
        fontSize--;
        measured = measureDigitHeight(fontSize);
      }
    }

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
      // apply precomputed shift
      yCenter += (i < 2) ? vShiftMag : -vShiftMag;
      // move the whole numbers slightly below
      yCenter += globalDown;

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
