(function(global){
  function renderClock2(ctx,w,h,color,size,now,options){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = options && options.bg ? options.bg : '#fff';
    ctx.fillRect(0,0,w,h);
    const radius = size;
    const cx = w/2, cy = h/2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx,cy,radius,0,2*Math.PI); ctx.stroke();
    // hands
    const sec = now.getSeconds(), min = now.getMinutes(), hr = now.getHours()%12;
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx + Math.cos(((hr + min/60)*Math.PI)/6 - Math.PI/2)*radius*0.5, cy + Math.sin(((hr + min/60)*Math.PI)/6 - Math.PI/2)*radius*0.5);
    ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx + Math.cos(((min + sec/60)*Math.PI)/30 - Math.PI/2)*radius*0.75, cy + Math.sin(((min + sec/60)*Math.PI)/30 - Math.PI/2)*radius*0.75);
    ctx.stroke();
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx + Math.cos((sec*Math.PI)/30 - Math.PI/2)*radius*0.9, cy + Math.sin((sec*Math.PI)/30 - Math.PI/2)*radius*0.9);
    ctx.stroke();
  }
  global.renderClock2 = renderClock2;
})(this);