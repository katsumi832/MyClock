(function () {
  // Clock 5 — single-layer rounded "HH:MM" with per-digit coloring and slight overlap
  window.renderClock5 = function (ctx, w, h, paint, size, now, opts) {
    now = now || new Date();
    ctx.clearRect(0, 0, w, h);

    // Prepare time digits
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const chars = [hh[0], hh[1], ':', mm[0], mm[1]];

    // Helpers: color parsing & lightening
    function isHex(c) { return typeof c === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.trim()); }
    function toRgb(hex) {
      hex = hex.replace('#','');
      if (hex.length === 3) hex = hex.split('').map(ch=>ch+ch).join('');
      const r = parseInt(hex.substring(0,2),16);
      const g = parseInt(hex.substring(2,4),16);
      const b = parseInt(hex.substring(4,6),16);
      return {r,g,b};
    }
    function lightenHex(hex, amt) {
      try {
        const {r,g,b} = toRgb(hex);
        const nr = Math.min(255, Math.round(r + (255 - r) * amt));
        const ng = Math.min(255, Math.round(g + (255 - g) * amt));
        const nb = Math.min(255, Math.round(b + (255 - b) * amt));
        return `rgb(${nr},${ng},${nb})`;
      } catch (e) {
        return hex;
      }
    }

    // Determine selected color: prefer paint if it's a simple string (hex or rgb), otherwise fallback to editingSettings.color or default
    let selectedColor = '#FF80AB';
    if (typeof paint === 'string' && paint.trim().length) {
      selectedColor = paint;
    } else if (window && window.editingSettings && window.editingSettings.color) {
      selectedColor = window.editingSettings.color;
    }
    // If selectedColor is hex, compute lighter variant; if rgb/rgba string, derive a lighter approximation
    let lighterColor = selectedColor;
    if (isHex(selectedColor)) {
      lighterColor = lightenHex(selectedColor, 0.36);
    } else if (/^rgb/i.test(selectedColor)) {
      // simple approach: convert rgb(...) to rgba and blend with white
      const nums = selectedColor.match(/[\d.]+/g) || [];
      if (nums.length >= 3) {
        const r = Number(nums[0]), g = Number(nums[1]), b = Number(nums[2]);
        const nr = Math.min(255, Math.round(r + (255 - r) * 0.36));
        const ng = Math.min(255, Math.round(g + (255 - g) * 0.36));
        const nb = Math.min(255, Math.round(b + (255 - b) * 0.36));
        lighterColor = `rgb(${nr},${ng},${nb})`;
      } else {
        lighterColor = selectedColor;
      }
    } else {
      lighterColor = selectedColor;
    }

    // Prefer rounded/display font (Poppins first)
    const weight = '800';
    const family = "Poppins, Quicksand, Nunito, 'Segoe UI', system-ui, sans-serif";

    // Layout margins and usable area
    const margin = Math.max(12, Math.floor(Math.min(w, h) * 0.02));
    const usableW = w - margin * 2;
    const usableH = h - margin * 2;

    // Overlap and optional subtle offset
    const overlapRatio = 0.32;
    const layerOffset = Math.max(2, Math.round(h * 0.005));

    // Pick font size that fits
    let fontSize = Math.floor(usableH * 0.92);
    fontSize = Math.max(18, fontSize);

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
      measured = chars.map(ch => (ch === ':' ? Math.max(fs * 0.28, fs * 0.22) : ctx.measureText(ch).width));
      const avg = measured.reduce((a, b) => a + b, 0) / measured.length;
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

    // finalize font and metrics
    ctx.font = `${weight} ${fontSize}px ${family}`;
    totalWidth = m.totalWidth;
    lineHeight = m.lineHeight;

    const startX = Math.round((w - totalWidth) / 2);
    const centerY = Math.round(h / 2);

    // Draw digits: index 0 & 3 -> selectedColor; index 1 & 4 -> lighterColor. Draw colon last (white) so it's top.
    // Draw subtle shadow for rounded look
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.03));

    // First draw all digits (except colon) with their respective colors
    let x = startX;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const chW = measured[i];
      if (ch === ':') {
        // skip colon now, draw later on top
        x += chW - overlap;
        continue;
      }
      // decide color
      let fill = selectedColor;
      if (i === 1 || i === 4) fill = lighterColor; // second hour digit and second minute digit
      // ensure fill is usable (if paint was gradient/pattern, selectedColor may be that; fallback to paint if string)
      ctx.fillStyle = fill;
      ctx.fillText(ch, x, centerY);
      x += chW - overlap;
    }

    // Draw colon on top in white
    ctx.shadowBlur = 0; // no shadow for colon
    ctx.fillStyle = '#ffffff';
    x = startX;
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
      }
      x += chW - overlap;
    }

    // cleanup
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  };
})();