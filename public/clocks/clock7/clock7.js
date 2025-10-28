(function () {
  // Simple Clock 7: Top = HH (two digits), Bottom = MM (two digits)
  window.renderClock7 = function (ctx, w, h, paint, size, now, opts) {
    ctx.clearRect(0, 0, w, h);

    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    // paint can be string or gradient/pattern
    ctx.fillStyle = paint || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top: hour (larger)
    const topSize = Math.floor(size * 0.9);
    ctx.font = `700 ${topSize}px 'Segoe UI', sans-serif`;
    ctx.fillText(hh, w / 2, h / 2 - Math.floor(size * 0.28));

    // Bottom: minute (smaller)
    const bottomSize = Math.floor(size * 0.6);
    ctx.font = `600 ${bottomSize}px 'Segoe UI', sans-serif`;
    ctx.fillText(mm, w / 2, h / 2 + Math.floor(size * 0.28));
  };
})();
