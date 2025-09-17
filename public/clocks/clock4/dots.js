(function(global){
  // Creative Clock 4: radial seconds ring + centered digital time
  function renderClock4(ctx,w,h,color,size,now,options){
    ctx.clearRect(0,0,w,h);
    if (!options || !options.suppressBg) {
      let bg = (options && options.bg) ? options.bg : '#000';
      if (options && options.bgGradient) {
        const [c1,c2,pattern] = options.bgGradient;
        const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,c1); g.addColorStop(1,c2); bg = g;
      }
      ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
    }

    const cx = w/2, cy = h/2;
    // ring parameters
    const ringRadius = Math.min(w,h) * 0.35;
    const dotCount = 60;
    const dotRadius = Math.max(2, Math.floor(size/30));
    const seconds = now.getSeconds();
    // draw background ring (subtle)
    for(let i=0;i<dotCount;i++){
      const angle = (i / dotCount) * Math.PI * 2 - Math.PI/2;
      const x = cx + Math.cos(angle) * ringRadius;
      const y = cy + Math.sin(angle) * ringRadius;
      ctx.beginPath(); ctx.fillStyle = '#222'; ctx.arc(x,y,dotRadius,0,Math.PI*2); ctx.fill();
    }
    // highlight recent seconds with color gradient
    for(let i=0;i<20;i++){
      const idx = (seconds - i + 120) % 60; // wrap
      const angle = (idx / dotCount) * Math.PI * 2 - Math.PI/2;
      const x = cx + Math.cos(angle) * ringRadius;
      const y = cy + Math.sin(angle) * ringRadius;
      const a = Math.max(0.08, (20 - i) / 20);
      ctx.beginPath(); ctx.fillStyle = hexWithAlpha(color, a); ctx.arc(x,y,dotRadius*1.3,0,Math.PI*2); ctx.fill();
    }

    // center time display
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fontSize = Math.floor(size * 0.9);
    ctx.font = `700 ${fontSize}px 'Segoe UI', sans-serif`;
    const text = now.toLocaleTimeString('en-GB',{hour12:false});
    ctx.fillText(text, cx, cy);

    // helper to blend hex color with alpha
    function hexWithAlpha(hex, alpha){
      // parse #rrggbb
      const c = hex.replace('#','');
      const r = parseInt(c.substring(0,2),16);
      const g = parseInt(c.substring(2,4),16);
      const b = parseInt(c.substring(4,6),16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
  global.renderClock4 = renderClock4;
})(this);