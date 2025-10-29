(function () {
  // Clock 5 — large rounded "HH:MM" with a single bright overlay and increased overlap (no duplicate pink layer, no knob)
  window.renderClock5 = function (ctx, w, h, paint, size, now, opts) {
    now = now || new Date();
    ctx.clearRect(0, 0, w, h);

    // Prepare time digits
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const chars = [hh[0], hh[1], ':', mm[0], mm[1]];

    // Colors (use provided paint if simple color), keep overlay as the visible color
    let accentOverlay = '#FF80AB';
    if (typeof paint === 'string' && paint.trim().length) {
      // if paint is a color string, use it as the visible color
      accentOverlay = paint;
    }

    // Rounded display font stack (geometric/rounded)
    const weight = '800';
    const family = "Quicksand, Nunito, Poppins, 'Segoe UI', system-ui, sans-serif";

    // Layout
    const margin = Math.max(12, Math.floor(Math.min(w, h) * 0.02));
    const usableW = w - margin * 2;
    const usableH = h - margin * 2;

    // Increased overlap so characters sit a little more on top of each other
    const overlapRatio = 0.30; // increased overlap
    const layerOffset = Math.max(3, Math.round(h * 0.006)); // small pixel shift for subtle layering

    // Choose starting fontSize and shrink until it fits
    let fontSize = Math.floor(usableH * 0.92);
    fontSize = Math.max(20, fontSize);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    let measured = [];
    let overlap = 0;
    let totalWidth = 0;
    let lineHeight = 0;

    function measureFor(fs) {
      ctx.font = `${weight} ${fs}px ${family}`;
      measured = chars.map(ch => {
        if (ch === ':') return Math.max(fs * 0.28, fs * 0.22);
        return ctx.measureText(ch).width;
      });
      const avg = measured.reduce((a,b)=>a+b,0) / measured.length;
      overlap = Math.max(Math.round(avg * overlapRatio), 2);
      totalWidth = measured.reduce((a,b)=>a+b,0) - overlap * (chars.length - 1);
      lineHeight = Math.ceil(fs * 1.05);
      return { totalWidth, lineHeight };
    }

    let m = measureFor(fontSize);
    while ((m.totalWidth > usableW || m.lineHeight > usableH) && fontSize > 8) {
      fontSize--;
      m = measureFor(fontSize);
    }

    // finalize
    ctx.font = `${weight} ${fontSize}px ${family}`;
    totalWidth = m.totalWidth;
    lineHeight = m.lineHeight;

    const startX = Math.round((w - totalWidth) / 2);
    const centerY = Math.round(h / 2);

    // Draw single visible overlay layer (slightly shifted for depth) — no duplicate pink behind
    let x = startX;
    ctx.globalAlpha = 0.98;
    ctx.fillStyle = accentOverlay;
    // subtle soft shadow to keep round appearance
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.03));

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const chW = measured[i];
      if (ch === ':') {
        const dotR = Math.max(Math.round(fontSize * 0.09), 8);
        const cx = x + chW / 2;
        const topY = centerY - Math.round(fontSize * 0.18);
        const bottomY = centerY + Math.round(fontSize * 0.18);
        ctx.beginPath(); ctx.arc(cx, topY, dotR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, bottomY, dotR, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillText(ch, x, centerY);
      }
      x += chW - overlap;
    }

    // cleanup
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };
})();