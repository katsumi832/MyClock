(function(global){
  function renderClock5(ctx,w,h,color,size,now,options){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = options && options.bg ? options.bg : '#000';
    ctx.fillRect(0,0,w,h);
    const parts = [now.getHours(), now.getMinutes(), now.getSeconds()];
    ctx.fillStyle = color; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.font = `${Math.floor(size*0.12)}px monospace`;
    parts.forEach((p,idx)=>{ const bin = p.toString(2).padStart(6,'0'); ctx.fillText(bin,10,10 + idx*(size*0.15+2)); });
  }
  global.renderClock5 = renderClock5;
})(this);