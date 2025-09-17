(function(global){
  function renderClock3(ctx,w,h,color,size,now,options){
    ctx.clearRect(0,0,w,h);
    if (!options || !options.suppressBg) {
      let bg = (options && options.bg) ? options.bg : '#000';
      if (options && options.bgGradient) {
        const [c1,c2,pattern] = options.bgGradient;
        const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,c1); g.addColorStop(1,c2); bg = g;
      }
      ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
    }
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline='middle';
    ctx.font = `600 ${Math.floor(size*0.9)}px 'Segoe UI', sans-serif`;
    const text = now.toLocaleTimeString('en-GB',{hour12:false});
    ctx.fillText(text,w/2,h/2);
  }
  global.renderClock3 = renderClock3;
})(this);