(function(global){
  function renderClock5(ctx,w,h,color,size,now,options){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = options && options.bg ? options.bg : '#000';
    ctx.fillRect(0,0,w,h);
    const parts = [now.getHours(), now.getMinutes(), now.getSeconds()];
    ctx.fillStyle = color;
    const fontSize = Math.max(10, Math.floor(size*0.12));
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