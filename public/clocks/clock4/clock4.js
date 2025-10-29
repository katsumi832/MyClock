(function () {
  window.renderClock4 = function (ctx, w, h, fontPaint, size, now, opts) {
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    const radius = Math.min(w, h) * 0.38;
    const ringWidth = Math.max(1, Math.floor(size * 0.02));
    ctx.lineWidth = ringWidth;
    try { ctx.strokeStyle = fontPaint; } catch (e) { ctx.strokeStyle = '#ffffff'; }
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    now = now || new Date();
    const sec = now.getSeconds() + (now.getMilliseconds() / 1000);
    const angle = (sec / 60) * Math.PI * 2 - Math.PI / 2;
    const dotRadius = Math.max(4, Math.floor(size * 0.055));
    const sx = cx + Math.cos(angle) * radius;
    const sy = cy + Math.sin(angle) * radius;

    try { ctx.fillStyle = fontPaint; } catch (e) { ctx.fillStyle = '#ffffff'; }
    ctx.beginPath();
    ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeText = `${hh}:${mm}`;

    const fontWeight = '300';
    const family = "'Segoe UI', sans-serif";
    let fontSize = Math.max(18, Math.floor(size * 1.25));
    ctx.font = `${fontWeight} ${fontSize}px ${family}`;
    let metrics = ctx.measureText(timeText);
    const maxWidth = radius * 1.6;
    while ((metrics.width > maxWidth || fontSize > radius * 0.8) && fontSize > 8) {
      fontSize--;
      ctx.font = `${fontWeight} ${fontSize}px ${family}`;
      metrics = ctx.measureText(timeText);
    }
    ctx.fillText(timeText, cx, cy);
  };
})();
