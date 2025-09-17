(function(global){
  function renderClock1(ctx,w,h,color,size,now,options){
    // simple digital renderer
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = options && options.bg ? options.bg : '#000';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${size}px 'SF Pro Display', 'Segoe UI', sans-serif`;
    const text = now.toLocaleTimeString('en-GB',{hour12:false});
    ctx.fillText(text,w/2,h/2);
  }
  global.renderClock1 = renderClock1;
})(this);