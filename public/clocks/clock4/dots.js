(function(global){
  function renderClock4(ctx,w,h,color,size,now,options){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = options && options.bg ? options.bg : '#000';
    ctx.fillRect(0,0,w,h);
    const hours = now.getHours(); const mins = now.getMinutes(); const secs = now.getSeconds();
    const gap = Math.max(6, Math.floor(size/6)); const radius = Math.max(3, Math.floor(size/12));
    const startX = w/2 - 3*(gap+radius); const baseY = h/2; ctx.fillStyle = color;
    const drawSeries = (value, offsetY) => { const str = value.toString().padStart(2,'0'); for(let i=0;i<str.length;i++){ const x = startX + i*(gap+radius*2); const y = baseY + offsetY; ctx.beginPath(); ctx.arc(x,y,radius,0,Math.PI*2); ctx.fill(); }};
    drawSeries(hours, -gap-radius); drawSeries(mins,0); drawSeries(secs,gap+radius);
  }
  global.renderClock4 = renderClock4;
})(this);