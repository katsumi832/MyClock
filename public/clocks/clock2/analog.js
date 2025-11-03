(function(){
  // window.renderClock2(ctx, w, h, paint, size, now, opts)
  window.renderClock2 = function(ctx, w, h, paint, size, now, opts){
    now = now || new Date();
    const cx = w/2, cy = h/2;
    const r = size;

    // clear and (optionally) background
    ctx.clearRect(0,0,w,h);
    if (opts && !opts.suppressBg) {
      if (opts.bgGradient && Array.isArray(opts.bgGradient) && opts.bgGradient.length >= 2) {
        const g = ctx.createLinearGradient(0,0,0,h);
        g.addColorStop(0, opts.bgGradient[0]);
        g.addColorStop(1, opts.bgGradient[1]);
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
      } else if (opts.bg) {
        ctx.fillStyle = opts.bg; ctx.fillRect(0,0,w,h);
      }
    }

    // 12 square hour markers
    ctx.save();
    try { ctx.fillStyle = paint; } catch { ctx.fillStyle = '#ffffff'; }
    const ringR = r * 0.85;
    const side = Math.max(3, Math.round(size * 0.05));
    for (let i=0;i<12;i++){
      const ang = (i * Math.PI) / 6 - Math.PI/2;
      const x = cx + Math.cos(ang) * ringR;
      const y = cy + Math.sin(ang) * ringR;
      ctx.fillRect(Math.round(x - side/2), Math.round(y - side/2), side, side);
    }
    ctx.restore();

    // hands
    const sec = now.getSeconds() + now.getMilliseconds()/1000;
    const min = now.getMinutes() + sec/60;
    const hr  = (now.getHours()%12) + min/60;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // hour
    try { ctx.strokeStyle = paint; } catch { ctx.strokeStyle = '#ffffff'; }
    ctx.lineWidth = Math.max(4, Math.round(r * 0.08));
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos((hr * Math.PI)/6 - Math.PI/2) * (r * 0.5),
      cy + Math.sin((hr * Math.PI)/6 - Math.PI/2) * (r * 0.5)
    );
    ctx.stroke();

    // minute
    ctx.lineWidth = Math.max(3, Math.round(r * 0.06));
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos((min * Math.PI)/30 - Math.PI/2) * (r * 0.78),
      cy + Math.sin((min * Math.PI)/30 - Math.PI/2) * (r * 0.78)
    );
    ctx.stroke();

    // second (red)
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = Math.max(2, Math.round(r * 0.035));
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos((sec * Math.PI)/30 - Math.PI/2) * (r * 0.92),
      cy + Math.sin((sec * Math.PI)/30 - Math.PI/2) * (r * 0.92)
    );
    ctx.stroke();

    // white center circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(4, Math.round(r * 0.08)), 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
  };
})();