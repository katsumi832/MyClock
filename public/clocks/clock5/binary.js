(function () {
  // Clock 5 — large rounded "HH:MM" with slight overlap between characters
  window.renderClock5 = function (ctx, w, h, paint, size, now, opts) {
    ctx.clearRect(0, 0, w, h);
    now = now || new Date();

    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const chars = [hh[0], hh[1], ':', mm[0], mm[1]];

    // paint (gradient/pattern or color)
    try { ctx.fillStyle = paint; } catch (e) { ctx.fillStyle = '#ffffff'; }

    // Rounded-looking font stack (Poppins or system fallbacks)
    const weight = '700';
    const family = "Poppins, 'Segoe UI', 'Helvetica Neue', Arial, system-ui, sans-serif";

    // Usable area (leave tiny margins)
    const margin = Math.max(8, Math.floor(Math.min(w, h) * 0.02));
    const usableW = w - margin * 2;
    const usableH = h - margin * 2;

    // Overlap factor: fraction of average char width to overlap between characters (smaller = slight overlap)
    const overlapRatio = 0.12; // ~12% overlap

    // Start with a large candidate font size and shrink until the whole string fits horizontally and vertically
    let fontSize = Math.floor(Math.min(usableH * 0.9, usableW / 2)); // initial guess
    fontSize = Math.max(24, fontSize); // minimum sensible size

    let measuredWidths = [];
    let totalWidth = 0;

    function measureForSize(fs) {
      ctx.font = `${weight} ${fs}px ${family}`;
      measuredWidths = chars.map(ch => ctx.measureText(ch).width);
      const avg = measuredWidths.reduce((a,b)=>a+b,0)/measuredWidths.length;
      const overlap = avg * overlapRatio;
      totalWidth = measuredWidths.reduce((a,b)=>a+b,0) - overlap * (chars.length - 1);
      const lineHeight = Math.ceil(fs * 1.05);
      return { totalWidth, lineHeight, overlap, avg };
    }

    // Reduce fontSize until fits within usableW and font height fits usableH
    let m = measureForSize(fontSize);
    while ((m.totalWidth > usableW || m.lineHeight > usableH) && fontSize > 8) {
      fontSize--;
      m = measureForSize(fontSize);
    }

    // Finalize metrics
    ctx.font = `${weight} ${fontSize}px ${family}`;
    const overlap = m.overlap;
    const lineHeight = m.lineHeight;

    // Compute starting x so the whole composed string is centered
    const startX = (w - m.totalWidth) / 2;
    const centerY = h / 2;

    // Draw characters with slight negative spacing (overlap)
    let x = startX;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const chW = measuredWidths[i];
      // center each glyph vertically (textBaseline middle)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, x, centerY);
      // advance x by width minus overlap
      x += chW - overlap;
    }
  };
})();