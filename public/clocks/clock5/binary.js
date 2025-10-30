(function () {
  // Clock 5 — per-digit color + averaged overlap and colon on top
  window.renderClock5 = function (ctx, w, h, paint, size, now, opts) {
    now = now || new Date();
    ctx.clearRect(0, 0, w, h);

    // digits
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const chars = [hh[0], hh[1], ':', mm[0], mm[1]];

    // color helpers
    function isHex(c) { return typeof c === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c.trim()); }
    function toRgb(hex) { hex = hex.replace('#',''); if (hex.length===3) hex = hex.split('').map(ch=>ch+ch).join(''); return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16) }; }
    function lightenHex(hex, amt) { try { const {r,g,b}=toRgb(hex); const nr=Math.min(255,Math.round(r+(255-r)*amt)); const ng=Math.min(255,Math.round(g+(255-g)*amt)); const nb=Math.min(255,Math.round(b+(255-b)*amt)); return `rgb(${nr},${ng},${nb})`; } catch(e){ return hex; } }
    function isWhiteColor(c) {
      if (typeof c !== 'string') return false;
      const s = c.trim().toLowerCase();
      return s === '#fff' || s === '#ffffff' || s === '#ffffffff' ||
             s === 'white' || /^rgba?\(\s*255\s*,\s*255\s*,\s*255(\s*,\s*1(\.0+)?)?\s*\)$/.test(s);
    }

    // determine user color (Clock 5 special default: #ff4081 only when incoming is app default white)
    let selectedColor = '#ff4081';
    if (typeof paint === 'string' && paint.trim().length) {
      selectedColor = isWhiteColor(paint) ? '#ff4081' : paint;
    } else if (window && window.editingSettings && window.editingSettings.color) {
      const c = window.editingSettings.color;
      selectedColor = isWhiteColor(c) ? '#ff4081' : c;
    }
    // compute lighter variant for second digits
    let lighterColor = selectedColor;
    if (isHex(selectedColor)) {
      lighterColor = lightenHex(selectedColor, 0.36);
    } else if (/^rgb/i.test(selectedColor)) {
      const nums = selectedColor.match(/[\d.]+/g) || [];
      if (nums.length >= 3) {
        const r = Number(nums[0]), g = Number(nums[1]), b = Number(nums[2]);
        const nr = Math.min(255, Math.round(r + (255 - r) * 0.36));
        const ng = Math.min(255, Math.round(g + (255 - g) * 0.36));
        const nb = Math.min(255, Math.round(b + (255 - b) * 0.36));
        lighterColor = `rgb(${nr},${ng},${nb})`;
      }
    }

    // font + layout
    const weight = '800';
    // Prefer fully rounded corners (M PLUS Rounded 1c). Fall back to other rounded families.
    const family = "'Nunito', 'Quicksand', 'Cabin Rounded', 'Segoe UI', system-ui, sans-serif";
    const margin = Math.max(12, Math.floor(Math.min(w,h) * 0.02));
    const usableW = w - margin*2;
    const usableH = h - margin*2;
    const overlapRatio = 0.32;
    let fontSize = Math.max(18, Math.floor(usableH * 0.92));

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // measure widths and group gap
    let measured = [], overlap = 0, totalWidth = 0, lineHeight = 0, groupGap = 0;
    function measureFor(fs) {
      ctx.font = `${weight} ${fs}px ${family}`;
      measured = chars.map(ch => ch === ':' ? Math.max(fs*0.28, fs*0.22) : ctx.measureText(ch).width);
      const avg = measured.reduce((a,b)=>a+b,0)/measured.length;
      overlap = Math.max(Math.round(avg * overlapRatio), 2);
      // smaller gap between hour and minute so groups sit closer
      groupGap = Math.round(fs * 0.02);
      totalWidth = measured.reduce((a,b)=>a+b,0) - overlap * (chars.length - 1) + groupGap;
      lineHeight = Math.ceil(fs * 1.05);
      return { totalWidth, lineHeight };
    }
    let m = measureFor(fontSize);
    while ((m.totalWidth > usableW || m.lineHeight > usableH) && fontSize > 8) { fontSize--; m = measureFor(fontSize); }
    ctx.font = `${weight} ${fontSize}px ${family}`;
    totalWidth = m.totalWidth;

    const startX = Math.round((w - totalWidth)/2);
    const centerY = Math.round(h/2);

    // create glyph canvases
    const glyphs = [];
    for (let i=0;i<chars.length;i++){
      const ch = chars[i];
      if (ch === ':') { glyphs[i] = null; continue; }
      const chW = Math.ceil(measured[i]);
      const chH = Math.ceil(lineHeight*1.2);
      const g = document.createElement('canvas');
      g.width = chW + 6; g.height = chH;
      const gctx = g.getContext('2d');
      gctx.textBaseline = 'middle'; gctx.textAlign='left';
      gctx.font = `${weight} ${fontSize}px ${family}`;
      const fill = (i===0||i===3) ? selectedColor : lighterColor;
      gctx.fillStyle = fill;
      gctx.fillText(ch, 3, g.height/2);
      glyphs[i] = { canvas: g, w: g.width, h: g.height };
    }

    // composite: comp canvas same size as target
    const comp = document.createElement('canvas'); comp.width = w; comp.height = h;
    const cctx = comp.getContext('2d');
    // initialize comp transparent
    cctx.clearRect(0,0,w,h);

    // draw and merge: we'll draw first non-colon glyph into comp, then for each next glyph we'll merge by averaging pixels
    // helper to draw a glyph at global position on a tmp full-size canvas
    function drawGlyphToFull(glyph, posX, posY){
      const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
      const t = tmp.getContext('2d');
      t.clearRect(0,0,w,h);
      t.drawImage(glyph.canvas, posX, posY);
      return tmp;
    }

    function mergeAverageToComp(tmpCanvas){
      const compData = cctx.getImageData(0,0,w,h);
      const tmpCtx = tmpCanvas.getContext('2d');
      const tmpData = tmpCtx.getImageData(0,0,w,h);
      const cd = compData.data, td = tmpData.data;
      for (let p=0;p<cd.length;p+=4){
        const sa = td[p+3]/255, da = cd[p+3]/255;
        if (sa===0 && da===0) { /* nothing */ }
        else if (da === 0) {
          // copy src pixel
          cd[p]   = td[p];
          cd[p+1] = td[p+1];
          cd[p+2] = td[p+2];
          cd[p+3] = td[p+3];
        } else if (sa === 0) {
          // keep dest
        } else {
          // both present: weighted average by alpha
          const sumA = sa + da;
          const r = Math.round((td[p]*sa + cd[p]*da) / sumA);
          const g = Math.round((td[p+1]*sa + cd[p+1]*da) / sumA);
          const b = Math.round((td[p+2]*sa + cd[p+2]*da) / sumA);
          const a = Math.min(255, Math.round((sa + da) * 255));
          cd[p] = r; cd[p+1] = g; cd[p+2] = b; cd[p+3] = a;
        }
      }
      cctx.putImageData(compData,0,0);
    }

    // iterate glyphs, placing them at absolute positions
    let x = startX;
    // compute absolute positions for each glyph to reuse
    const positions = [];
    for (let i=0;i<chars.length;i++){
      const ch = chars[i];
      const chW = measured[i];
      positions[i] = { x: Math.round(x), y: Math.round(centerY - (lineHeight*1.2)/2) };
      // advance; include groupGap after colon
      if (ch === ':') x += chW - overlap + groupGap;
      else x += chW - overlap;
    }

    // draw first numeric glyph into comp (source-over)
    let firstIndex = -1;
    for (let i=0;i<chars.length;i++){
      if (chars[i] !== ':') { firstIndex = i; break; }
    }
    if (firstIndex >= 0) {
      const ginfo = glyphs[firstIndex];
      cctx.globalCompositeOperation = 'source-over';
      cctx.drawImage(ginfo.canvas, positions[firstIndex].x, positions[firstIndex].y);
    }

    // draw remaining glyphs merging by averaging
    for (let i=firstIndex+1;i<chars.length;i++){
      if (chars[i] === ':') continue;
      const ginfo = glyphs[i];
      const full = drawGlyphToFull(ginfo, positions[i].x, positions[i].y);
      // merge average tmp into comp
      mergeAverageToComp(full);
    }

    // finally draw comp onto main canvas
    ctx.drawImage(comp, 0, 0);

    // draw colon on top in semi-transparent white
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i=0;i<chars.length;i++){
      const ch = chars[i];
      const chW = measured[i];
      if (ch === ':') {
        const pos = positions[i];
        const dotR = Math.max(Math.round(fontSize * 0.09), 6);
        const cx = pos.x + chW/2;
        const topY = centerY - Math.round(fontSize * 0.18);
        const bottomY = centerY + Math.round(fontSize * 0.18);
        ctx.beginPath(); ctx.arc(cx, topY, dotR, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, bottomY, dotR, 0, Math.PI*2); ctx.fill();
      }
    }

  };
})();