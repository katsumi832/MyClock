(function(global){
  function renderClock5(ctx,w,h,color,size,now,options){
    ctx.clearRect(0,0,w,h);
    if (!options || !options.suppressBg) {
      let bg = (options && options.bg) ? options.bg : '#000';
      if (options && options.bgGradient) {
        const [c1,c2,pattern] = options.bgGradient;
        const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,c1); g.addColorStop(1,c2); bg = g;
      }
      ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
    }
    const parts = [now.getHours(), now.getMinutes(), now.getSeconds()];
    ctx.fillStyle = color;
    const fontSize = Math.max(14, Math.floor(size*0.16));
    ctx.font = `${fontSize}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const rowHeight = Math.max(12, Math.floor(size*0.15));
    const totalHeight = parts.length * rowHeight + (parts.length-1) * 6;
    const startY = (h - totalHeight) / 2 + rowHeight/2;
    const centerX = w/2;
    parts.forEach((p,idx)=>{
      const bin = p.toString(2).padStart(6,'0');
      ctx.fillText(bin, centerX, startY + idx*(rowHeight + 6));
    });
  }
  global.renderClock5 = renderClock5;
})(this);