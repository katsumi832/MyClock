// renderer.js
// ================================
// Apple風デザイン Clock アプリ
// ================================

// ------------------
// 初期設定
// ------------------
const canvas = document.getElementById("clockCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// 設定ボタン & パネル
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");

// パネル内UI
const stylePrevBtn = document.getElementById("clock-style-prev");
const styleNextBtn = document.getElementById("clock-style-next");
const styleLabel = document.getElementById("clock-style-label");

const colorOptionsDiv = document.getElementById("color-options");
const bgColorOptionsDiv = document.getElementById("bg-color-options");
// gradient controls
const fontGradC1 = document.getElementById('font-grad-c1');
const fontGradC2 = document.getElementById('font-grad-c2');
const fontGradPattern = document.getElementById('font-grad-pattern');
const bgGradC1 = document.getElementById('bg-grad-c1');
const bgGradC2 = document.getElementById('bg-grad-c2');
const bgGradPattern = document.getElementById('bg-grad-pattern');

const sizeMinusBtn = document.getElementById("size-minus");
const sizePlusBtn = document.getElementById("size-plus");
const sizeLabel = document.getElementById("size-label");

const applyBtn = document.getElementById("apply-btn");

// (Preview removed from DOM) preview will render on the main canvas while settings are open

// ------------------
// 時計スタイル
// ------------------
const clockStyles = ["Clock 1", "Clock 2", "Clock 3", "Clock 4", "Clock 5", "Clock 6"];
let currentStyleIndex = 0;

// 選択状態（未保存の編集）
let editingSettings = {
  styleIndex: currentStyleIndex,
  color: "#14d9e8ff",
  size: 180,
  // font/bg modes: 'solid' | 'gradient' | 'split'
  fontMode: 'solid',
  fontGrad: ['#C800FF', '#00EBE7', 'vertical'],
  bgMode: 'solid',
  bgGrad: ['#C800FF', '#00EBE7', 'vertical'],
  clock6Speed: 1,
};

// 適用済み状態
let appliedSettings = { ...editingSettings };

// カラーパレット (expanded)
const palette = [
  "#00ff88","#2196f3","#ff4081","#ff9800","#ffffff",
  "#ffd600","#8e24aa","#00bcd4","#4caf50","#e91e63",
  "#9e9d24","#795548","#607d8b","#f06292","#ff7043",
  "#c2185b","#7c4dff","#03a9f4","#388e3c","#ffeb3b",
  "#ad1457","#00c853","#b388ff","#ff8a65","#d500f9",
  "#263238","#ff5252","#ffab00","#304ffe","#69f0ae","#000000"
];
function renderColorOptions() {
  colorOptionsDiv.innerHTML = "";
  palette.forEach((c) => {
    const div = document.createElement("div");
    div.classList.add("color-circle");
    div.style.background = c;
    if (c === editingSettings.color) div.classList.add("selected");
    div.addEventListener("click", () => {
      // switch to solid font color when user picks a palette swatch
      editingSettings.fontMode = 'solid';
      editingSettings.color = c;
      // When user picks the first palette swatch (index 0), also set black background + white font
      try {
        const idx = palette.indexOf(c);
        if (idx === 0) {
          // set white font on black background immediately for all clocks
          editingSettings.color = '#ffffff';
          editingSettings.bgMode = 'solid';
          if (!editingSettings.bgGrad) editingSettings.bgGrad = ['#000000','#071b14','vertical'];
          editingSettings.bgGrad[0] = '#000000';
          // also apply immediately so main render updates without Confirm
          appliedSettings.color = '#ffffff';
          appliedSettings.bgMode = 'solid';
          if (!appliedSettings.bgGrad) appliedSettings.bgGrad = ['#000000','#071b14','vertical'];
          appliedSettings.bgGrad[0] = '#000000';
          // redraw main canvas and preview
          renderClock();
        }
      } catch (e) {}
      // hide font gradient controls if visible
      const fCtr = document.getElementById('font-gradient-controls'); if (fCtr) fCtr.classList.add('hidden');
      renderColorOptions();
      renderFontHalfSwatch();
      drawPreview();
    });
    colorOptionsDiv.appendChild(div);
  });
}
renderColorOptions();
// update font half-swatch when palette changes
renderFontHalfSwatch();

// (monochrome UI removed)

// Initialize labels to reflect current editingSettings
styleLabel.textContent = clockStyles[editingSettings.styleIndex];
sizeLabel.textContent = editingSettings.size;
// gradient inputs init
if (fontGradC1) fontGradC1.value = editingSettings.fontGrad[0];
if (fontGradC2) fontGradC2.value = editingSettings.fontGrad[1];
if (fontGradPattern) fontGradPattern.value = editingSettings.fontGrad[2];
if (bgGradC1) bgGradC1.value = editingSettings.bgGrad[0];
if (bgGradC2) bgGradC2.value = editingSettings.bgGrad[1];
if (bgGradPattern) bgGradPattern.value = editingSettings.bgGrad[2];

function renderBgOptions() {
  bgColorOptionsDiv.innerHTML = "";
  palette.forEach((c) => {
    const div = document.createElement("div");
    div.classList.add("bg-circle");
    div.style.background = c;
    if (c === editingSettings.bgGrad[0]) div.classList.add('selected');
    div.addEventListener("click", () => {
      // switch to solid background color when user picks a palette swatch
      editingSettings.bgMode = 'solid';
      // ensure bgGrad exists and set first color to chosen
      if (!editingSettings.bgGrad) editingSettings.bgGrad = [c, '#071b14','vertical'];
      else editingSettings.bgGrad[0] = c;
      // hide bg gradient controls if visible
      const bCtr = document.getElementById('bg-gradient-controls'); if (bCtr) bCtr.classList.add('hidden');
      renderBgOptions();
      renderBgHalfSwatch();
      drawPreview();
    });
    bgColorOptionsDiv.appendChild(div);
  });
}
renderBgOptions();
// update bg half-swatch when palette changes
renderBgHalfSwatch();

// Render the half-swatch button for background special swatch
function renderBgHalfSwatch() {
  const btn = document.getElementById('bg-half-swatch');
  if (!btn) return;
  const c = document.createElement('canvas'); c.width = 40; c.height = 40;
  const t = c.getContext('2d');
  const [c1,c2,pat] = editingSettings.bgGrad || ['#C800FF', '#00EBE7','vertical'];
  // draw left half
  t.beginPath(); t.moveTo(20,20); t.arc(20,20,18,Math.PI/2,Math.PI*3/2); t.closePath(); t.fillStyle = c1; t.fill();
  // draw right half
  t.beginPath(); t.moveTo(20,20); t.arc(20,20,18,Math.PI*3/2,Math.PI/2); t.closePath(); t.fillStyle = c2; t.fill();
  btn.style.backgroundImage = `url(${c.toDataURL()})`;
  btn.classList.toggle('selected', editingSettings.bgMode === 'gradient');
  btn.onclick = () => {
    // activate background gradient editing and ensure bgMode=gradient
    editingSettings.bgMode = 'gradient';
    if (!editingSettings.bgGrad || editingSettings.bgGrad.length < 2) editingSettings.bgGrad = [editingSettings.bgGrad && editingSettings.bgGrad[0] ? editingSettings.bgGrad[0] : '#000','#071b14','vertical'];
    const bCtr = document.getElementById('bg-gradient-controls'); if (bCtr) bCtr.classList.remove('hidden');
    // focus first color input for quick editing
    setTimeout(() => { const el = document.getElementById('bg-grad-c1'); if (el) el.focus(); }, 0);
    renderBgHalfSwatch();
    drawPreview();
  };
}
renderBgHalfSwatch();

function updateGradientUI() {
  const fCtr = document.getElementById('font-gradient-controls');
  const bCtr = document.getElementById('bg-gradient-controls');
  if (fCtr) fCtr.classList.toggle('hidden', editingSettings.fontMode !== 'gradient');
  if (bCtr) bCtr.classList.toggle('hidden', editingSettings.bgMode !== 'gradient');
}
// gradient controls are only shown when user activates a half-swatch
if (fontGradC1) fontGradC1.addEventListener('input', (e)=>{ editingSettings.fontGrad[0]=e.target.value; drawPreview(); });
if (fontGradC2) fontGradC2.addEventListener('input', (e)=>{ editingSettings.fontGrad[1]=e.target.value; drawPreview(); });
if (fontGradPattern) fontGradPattern.addEventListener('change', (e)=>{ editingSettings.fontGrad[2]=e.target.value; drawPreview(); });
if (bgGradC1) bgGradC1.addEventListener('input', (e)=>{ editingSettings.bgGrad[0]=e.target.value; drawPreview(); });
if (bgGradC2) bgGradC2.addEventListener('input', (e)=>{ editingSettings.bgGrad[1]=e.target.value; drawPreview(); });
if (bgGradPattern) bgGradPattern.addEventListener('change', (e)=>{ editingSettings.bgGrad[2]=e.target.value; drawPreview(); });
// keep gradient controls hidden by default; they will be shown when user clicks half-swatch
// initialize gradient control visibility
updateGradientUI();

// Render the half-swatch button for font special swatch
function renderFontHalfSwatch() {
  const btn = document.getElementById('font-half-swatch');
  if (!btn) return;
  // create a small canvas to draw half/half circle
  const c = document.createElement('canvas'); c.width = 40; c.height = 40;
  const t = c.getContext('2d');
  const [c1,c2,pat] = editingSettings.fontGrad || ['#C800FF', '#00EBE7','vertical'];
  // draw left half
  t.beginPath(); t.moveTo(20,20); t.arc(20,20,18,Math.PI/2,Math.PI*3/2); t.closePath(); t.fillStyle = c1; t.fill();
  // draw right half
  t.beginPath(); t.moveTo(20,20); t.arc(20,20,18,Math.PI*3/2,Math.PI/2); t.closePath(); t.fillStyle = c2; t.fill();
  btn.style.width = '40px'; btn.style.height = '40px'; btn.style.borderRadius = '50%';
  btn.style.backgroundImage = `url(${c.toDataURL()})`;
  btn.classList.toggle('selected', editingSettings.fontMode === 'gradient');
  btn.onclick = () => {
    // activate font gradient editing and ensure fontMode=gradient
    editingSettings.fontMode = 'gradient';
    // ensure fontGrad has two colors; if not, initialize
    if (!editingSettings.fontGrad || editingSettings.fontGrad.length < 2) editingSettings.fontGrad = [editingSettings.color || '#00ff88','#ffffff','vertical'];
    // open gradient UI
    const fCtr = document.getElementById('font-gradient-controls'); if (fCtr) fCtr.classList.remove('hidden');
    // focus first color input for quick editing
    setTimeout(() => { const el = document.getElementById('font-grad-c1'); if (el) el.focus(); }, 0);
    renderFontHalfSwatch();
    drawPreview();
  };
}
renderFontHalfSwatch();

// helper
function makeGradient(ctx,w,h,c1,c2,pattern) {
  if (pattern === 'split') {
    // paint left half c1, right half c2 via a canvas pattern
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d');
    tctx.fillStyle = c1; tctx.fillRect(0,0,Math.floor(w/2),h);
    tctx.fillStyle = c2; tctx.fillRect(Math.floor(w/2),0,w-Math.floor(w/2),h);
    return ctx.createPattern(tmp, 'no-repeat');
  }
  if (!pattern || pattern === 'vertical') {
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,c1); g.addColorStop(1,c2); return g;
  }
  if (pattern === 'horizontal') {
    const g = ctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,c1); g.addColorStop(1,c2); return g;
  }
  if (pattern === 'diag-tlbr') {
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,c1); g.addColorStop(1,c2); return g;
  }
  if (pattern === 'diag-bltr') {
    const g = ctx.createLinearGradient(0,h,w,0);
    g.addColorStop(0,c1); g.addColorStop(1,c2); return g;
  }
  // radial
  const rg = ctx.createRadialGradient(w/2,h/2,1,w/2,h/2,Math.max(w,h));
  rg.addColorStop(0,c1); rg.addColorStop(1,c2); return rg;
}

// ------------------
// 時計描画関数
// ------------------
function drawDigital(ctx, w, h, color, size) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${size}px 'SF Pro Display', 'Segoe UI', sans-serif`;
  const now = new Date();
  const text = now.toLocaleTimeString("en-GB", { hour12: false });
  ctx.fillText(text, w / 2, h / 2);
}

function drawAnalog(ctx, w, h, color, size) {
  ctx.clearRect(0, 0, w, h);
  const now = new Date();
  const radius = size;
  const cx = w / 2;
  const cy = h / 2;

  // 文字盤
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.stroke();

  // 目盛り
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x1 = cx + Math.cos(angle) * (radius - 10);
    const y1 = cy + Math.sin(angle) * (radius - 10);
    const x2 = cx + Math.cos(angle) * radius;
    const y2 = cy + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours() % 12;

  // 時針
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(
    cx + Math.cos(((hr + min / 60) * Math.PI) / 6 - Math.PI / 2) * (radius * 0.5),
    cy + Math.sin(((hr + min / 60) * Math.PI) / 6 - Math.PI / 2) * (radius * 0.5)
  );
  ctx.stroke();

  // 分針
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(
    cx + Math.cos(((min + sec / 60) * Math.PI) / 30 - Math.PI / 2) * (radius * 0.75),
    cy + Math.sin(((min + sec / 60) * Math.PI) / 30 - Math.PI / 2) * (radius * 0.75)
  );
  ctx.stroke();

  // 秒針
  ctx.strokeStyle = "#e53935";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(
    cx + Math.cos((sec * Math.PI) / 30 - Math.PI / 2) * (radius * 0.9),
    cy + Math.sin((sec * Math.PI) / 30 - Math.PI / 2) * (radius * 0.9)
  );
  ctx.stroke();
}

function drawMinimal(ctx, w, h, color, size) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = modeForContext(ctx) === "dark" ? "#000" : "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.floor(size * 0.9)}px 'Segoe UI', sans-serif`;
  const now = new Date();
  const text = now.toLocaleTimeString("en-GB", { hour12: false });
  ctx.fillText(text, w / 2, h / 2);
}

function drawDots(ctx, w, h, color, size) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = modeForContext(ctx) === "dark" ? "#000" : "#fff";
  ctx.fillRect(0, 0, w, h);
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();
  const secs = now.getSeconds();
  const gap = Math.max(6, Math.floor(size / 6));
  const radius = Math.max(3, Math.floor(size / 12));
  const startX = w / 2 - 3 * (gap + radius);
  const baseY = h / 2;
  ctx.fillStyle = color;
  const drawSeries = (value, offsetY) => {
    const str = value.toString().padStart(2, "0");
    for (let i = 0; i < str.length; i++) {
      const x = startX + i * (gap + radius * 2);
      const y = baseY + offsetY;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  drawSeries(hours, -gap - radius);
  drawSeries(mins, 0);
  drawSeries(secs, gap + radius);
}

function drawBinary(ctx, w, h, color, size) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = modeForContext(ctx) === "dark" ? "#000" : "#fff";
  ctx.fillRect(0, 0, w, h);
  const now = new Date();
  const parts = [now.getHours(), now.getMinutes(), now.getSeconds()];
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.floor(size * 0.12)}px monospace`;
  const pad = Math.max(6, Math.floor(size * 0.08));
  const totalHeight = parts.length * (size * 0.15) + (parts.length - 1) * pad;
  const startY = h / 2 - totalHeight / 2 + (size * 0.15) / 2;
  parts.forEach((p, idx) => {
    const bin = p.toString(2).padStart(6, "0");
    ctx.fillText(bin, w / 2, startY + idx * (size * 0.15 + pad));
  });
}

// Helper to decide background mode for a given context. Preview uses editingSettings, main uses appliedSettings
function modeForContext(ctx) {
  // Background/mode removed; default to dark aesthetics for contexts
  return 'dark';
}

// ------------------
// 時計レンダリング
// ------------------
function renderClock() {
  // If settings panel is open, render preview on the main canvas instead
  if (!settingsPanel.classList.contains("hidden")) {
    drawPreview();
    return;
  }

  const { styleIndex, color, size, mode } = appliedSettings;
  const w = canvas.width;
  const h = canvas.height;

  // paint centralized background first
  if (appliedSettings.bgMode === 'gradient' || appliedSettings.bgMode === 'split') {
    ctx.fillStyle = makeGradient(ctx, w, h, appliedSettings.bgGrad[0], appliedSettings.bgGrad[1], appliedSettings.bgGrad[2]);
  } else {
    ctx.fillStyle = (appliedSettings.bgGrad && appliedSettings.bgGrad[0]) ? appliedSettings.bgGrad[0] : '#000';
  }
  ctx.fillRect(0, 0, w, h);

  // Render the active clock into an offscreen canvas, then composite it on top
  const off = document.createElement('canvas'); off.width = w; off.height = h;
  const offCtx = off.getContext('2d');

  // prepare font paint using the offscreen context
  let fontPaint = color;
  if (appliedSettings.fontMode === 'gradient' || appliedSettings.fontMode === 'split') {
    const fg = appliedSettings.fontGrad || [color, '#ffffff', 'vertical'];
    fontPaint = makeGradient(offCtx, w, h, fg[0], fg[1], fg[2]);
  }

  const style = clockStyles[styleIndex];
  if (style === "Clock 1") {
    if (typeof window.renderClock1 === 'function') window.renderClock1(offCtx,w,h,fontPaint,size,new Date(),{bg:(appliedSettings.bgMode==='solid'?appliedSettings.bgGrad&&appliedSettings.bgGrad[0]:null),bgGradient:(appliedSettings.bgMode==='gradient'||appliedSettings.bgMode==='split'?appliedSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(1);
  } else if (style === "Clock 2") {
    if (typeof window.renderClock2 === 'function') window.renderClock2(offCtx,w,h,fontPaint,size,new Date(),{bg:(appliedSettings.bgMode==='solid'?appliedSettings.bgGrad&&appliedSettings.bgGrad[0]:null),bgGradient:(appliedSettings.bgMode==='gradient'||appliedSettings.bgMode==='split'?appliedSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(2);
  } else if (style === "Clock 3") {
    if (typeof window.renderClock3 === 'function') window.renderClock3(offCtx,w,h,fontPaint,size,new Date(),{bg:(appliedSettings.bgMode==='solid'?appliedSettings.bgGrad&&appliedSettings.bgGrad[0]:null),bgGradient:(appliedSettings.bgMode==='gradient'||appliedSettings.bgMode==='split'?appliedSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(3);
  } else if (style === "Clock 4") {
    if (typeof window.renderClock4 === 'function') window.renderClock4(offCtx,w,h,fontPaint,size,new Date(),{bg:(appliedSettings.bgMode==='solid'?appliedSettings.bgGrad&&appliedSettings.bgGrad[0]:null),bgGradient:(appliedSettings.bgMode==='gradient'||appliedSettings.bgMode==='split'?appliedSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(4);
  } else if (style === "Clock 5") {
    if (typeof window.renderClock5 === 'function') window.renderClock5(offCtx,w,h,fontPaint,size,new Date(),{bg:(appliedSettings.bgMode==='solid'?appliedSettings.bgGrad&&appliedSettings.bgGrad[0]:null),bgGradient:(appliedSettings.bgMode==='gradient'||appliedSettings.bgMode==='split'?appliedSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(5);
  } else if (style === "Clock 6") {
    // lazy-load Clock 6 script once
    if (typeof window.renderClock6 === 'function') {
      const bgArg = (appliedSettings.bgMode === 'solid') ? (appliedSettings.bgGrad && appliedSettings.bgGrad[0] ? appliedSettings.bgGrad[0] : '#000') : null;
      const bgGradArg = (appliedSettings.bgMode === 'gradient' || appliedSettings.bgMode === 'split') ? appliedSettings.bgGrad : null;
      window.renderClock6(offCtx, w, h, fontPaint, size, new Date(), { bg: bgArg, bgGradient: bgGradArg, clock6Speed: appliedSettings.clock6Speed, suppressBg: true });
    } else if (!window._clock6ScriptLoading) {
      window._clock6ScriptLoading = true;
      const s = document.createElement('script');
      s.src = 'clocks/clock6/clock6.js';
      s.onload = () => { window._clock6ScriptLoaded = true; };
      document.body.appendChild(s);
    }
  }

  // Composite offscreen rendering on top of the centralized background
  ctx.drawImage(off, 0, 0);
}

function lazyLoadClock(n) {
  const key = `_clock${n}Loading`;
  if (window[key]) return;
  window[key] = true;
  const s = document.createElement('script');
  s.src = `clocks/clock${n}/${n===1? 'digital' : n===2? 'analog' : n===3? 'minimal' : n===4? 'dots' : 'binary'}.js`;
  s.onload = () => { /* loaded */ };
  document.body.appendChild(s);
}

function drawPreview() {
  const { styleIndex, color, size, mode } = editingSettings;
  const w = canvas.width;
  const h = canvas.height;
  // Render preview background first
  if (editingSettings.bgMode === 'gradient' || editingSettings.bgMode === 'split') {
    ctx.fillStyle = makeGradient(ctx, w, h, editingSettings.bgGrad[0], editingSettings.bgGrad[1], editingSettings.bgGrad[2]);
  } else {
    ctx.fillStyle = editingSettings.bgGrad && editingSettings.bgGrad[0] ? editingSettings.bgGrad[0] : '#000';
  }
  ctx.fillRect(0, 0, w, h);

  // Render clock to offscreen canvas then composite so per-clock clearRect doesn't remove the background
  const off = document.createElement('canvas'); off.width = w; off.height = h;
  const offCtx = off.getContext('2d');

  // prepare font paint for preview
  let fontPaint = color;
  if (editingSettings.fontMode === 'gradient' || editingSettings.fontMode === 'split') {
    const fg = editingSettings.fontGrad || [color, '#ffffff', 'vertical'];
    fontPaint = makeGradient(offCtx, w, h, fg[0], fg[1], fg[2]);
  }

  // Use the chosen `size` directly for preview so the clock doesn't shrink
  const previewSize = size;

  const style = clockStyles[styleIndex];
  if (style === "Clock 1") {
    if (typeof window.renderClock1 === 'function') window.renderClock1(offCtx,w,h,fontPaint,previewSize,new Date(),{bg:(editingSettings.bgMode==='solid'?editingSettings.bgGrad&&editingSettings.bgGrad[0]:null),bgGradient:(editingSettings.bgMode==='gradient'||editingSettings.bgMode==='split'?editingSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(1);
  } else if (style === "Clock 2") {
  if (typeof window.renderClock2 === 'function') window.renderClock2(offCtx,w,h,fontPaint,Math.round(previewSize*0.8),new Date(),{bg:(editingSettings.bgMode==='solid'?editingSettings.bgGrad&&editingSettings.bgGrad[0]:null),bgGradient:(editingSettings.bgMode==='gradient'||editingSettings.bgMode==='split'?editingSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(2);
  } else if (style === "Clock 3") {
  if (typeof window.renderClock3 === 'function') window.renderClock3(offCtx,w,h,fontPaint,previewSize,new Date(),{bg:(editingSettings.bgMode==='solid'?editingSettings.bgGrad&&editingSettings.bgGrad[0]:null),bgGradient:(editingSettings.bgMode==='gradient'||editingSettings.bgMode==='split'?editingSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(3);
  } else if (style === "Clock 4") {
  if (typeof window.renderClock4 === 'function') window.renderClock4(offCtx,w,h,fontPaint,previewSize,new Date(),{bg:(editingSettings.bgMode==='solid'?editingSettings.bgGrad&&editingSettings.bgGrad[0]:null),bgGradient:(editingSettings.bgMode==='gradient'||editingSettings.bgMode==='split'?editingSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(4);
  } else if (style === "Clock 5") {
  if (typeof window.renderClock5 === 'function') window.renderClock5(offCtx,w,h,fontPaint,previewSize,new Date(),{bg:(editingSettings.bgMode==='solid'?editingSettings.bgGrad&&editingSettings.bgGrad[0]:null),bgGradient:(editingSettings.bgMode==='gradient'||editingSettings.bgMode==='split'?editingSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(5);
  } else if (style === "Clock 6") {
    if (typeof window.renderClock6 === 'function') {
      const bgArg = (editingSettings.bgMode === 'solid') ? (editingSettings.bgGrad && editingSettings.bgGrad[0] ? editingSettings.bgGrad[0] : '#000') : null;
      const bgGradArg = (editingSettings.bgMode === 'gradient' || editingSettings.bgMode === 'split') ? editingSettings.bgGrad : null;
      window.renderClock6(offCtx, w, h, fontPaint, previewSize, new Date(), { bg: bgArg, bgGradient: bgGradArg, clock6Speed: editingSettings.clock6Speed, suppressBg: true });
    }
  }

  // composite preview
  ctx.drawImage(off, 0, 0);
}

// ------------------
// イベント設定
// ------------------

// 時計クリック → 設定ボタン表示/非表示
canvas.addEventListener("click", (e) => {
  // If settings panel is open, ignore clicks on canvas so controls remain usable
  if (!settingsPanel.classList.contains("hidden")) {
    return;
  }

  if (settingsBtn.style.opacity === "1") {
    // hide immediately and cancel any pending hide timer
    settingsBtn.style.opacity = "0";
    settingsBtn.style.pointerEvents = "none";
    if (hideSettingsBtnTimeout) { clearTimeout(hideSettingsBtnTimeout); hideSettingsBtnTimeout = null; }
  } else {
    // show and start the hide timer
    settingsBtn.style.opacity = "1";
    settingsBtn.style.pointerEvents = "auto";
    hideSettingsBtnAfterDelay();
  }
});

// Prevent clicks inside the settings panel from bubbling to the canvas
settingsPanel.addEventListener("click", (e) => {
  e.stopPropagation();
});

// 設定ボタンクリック → パネル表示
settingsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  // Cancel any pending hide timer while user opens/settings
  if (hideSettingsBtnTimeout) {
    clearTimeout(hideSettingsBtnTimeout);
    hideSettingsBtnTimeout = null;
  }
  settingsPanel.classList.remove("hidden");
  // Ensure panel receives pointer events (in case parent/other css blocks them)
  settingsPanel.style.pointerEvents = "auto";
  // Keep settings button visible while settings are open
  settingsBtn.style.opacity = "1";
  settingsBtn.style.pointerEvents = "auto";
  drawPreview();
});

// Helper to hide settings button after 10 seconds
let hideSettingsBtnTimeout = null;
function hideSettingsBtnAfterDelay() {
  if (hideSettingsBtnTimeout) clearTimeout(hideSettingsBtnTimeout);
  hideSettingsBtnTimeout = setTimeout(() => {
    settingsBtn.style.opacity = "0";
    settingsBtn.style.pointerEvents = "none";
    hideSettingsBtnTimeout = null;
  }, 10000); // 10 seconds
}

// 時計スタイル切替
stylePrevBtn.addEventListener("click", () => {
  editingSettings.styleIndex =
    (editingSettings.styleIndex - 1 + clockStyles.length) % clockStyles.length;
  styleLabel.textContent = clockStyles[editingSettings.styleIndex];
  drawPreview();
});
styleNextBtn.addEventListener("click", () => {
  editingSettings.styleIndex =
    (editingSettings.styleIndex + 1) % clockStyles.length;
  styleLabel.textContent = clockStyles[editingSettings.styleIndex];
  drawPreview();
});

// サイズ変更
sizeMinusBtn.addEventListener("click", () => {
  editingSettings.size = Math.max(100, editingSettings.size - 20);
  sizeLabel.textContent = editingSettings.size;
  drawPreview();
});
sizePlusBtn.addEventListener("click", () => {
  editingSettings.size = Math.min(400, editingSettings.size + 20);
  sizeLabel.textContent = editingSettings.size;
  drawPreview();
});

// mode toggle removed

// Confirm Change
applyBtn.addEventListener("click", () => {
  appliedSettings = { ...editingSettings, fontMode: editingSettings.fontMode, fontGrad: editingSettings.fontGrad, bgMode: editingSettings.bgMode, bgGrad: editingSettings.bgGrad };
  settingsPanel.classList.add("hidden");
  // Show settings button and start 5s timer to hide
  settingsBtn.style.opacity = "1";
  settingsBtn.style.pointerEvents = "auto";
  hideSettingsBtnAfterDelay();
  // Immediately update main clock rendering and preview
  renderClock();
  drawPreview();
});

// 戻るボタン
function createBackButton() {
  if (!document.getElementById("back-btn")) {
    const btn = document.createElement("button");
    btn.id = "back-btn";
    btn.textContent = "Back to Time";
    settingsPanel.appendChild(btn);

    btn.addEventListener("click", () => {
      if (
        JSON.stringify(editingSettings) !== JSON.stringify(appliedSettings)
      ) {
        showWarning();
      } else {
        settingsPanel.classList.add("hidden");
        // Show settings button and start 5s timer to hide
        settingsBtn.style.opacity = "1";
        settingsBtn.style.pointerEvents = "auto";
        hideSettingsBtnAfterDelay();
      }
    });
  }
}
createBackButton();

// 警告
function showWarning() {
  if (!document.getElementById("warning-div")) {
    const div = document.createElement("div");
    div.id = "warning-div";
    div.innerHTML = `
      <p>Discard changes and go back?</p>
      <button id="discard-btn">Discard</button>
      <button id="stay-btn">Stay</button>
    `;
    settingsPanel.appendChild(div);

    document.getElementById("discard-btn").addEventListener("click", () => {
      editingSettings = { ...appliedSettings };
      settingsPanel.classList.add("hidden");
      // Show settings button and start 5s timer to hide
      settingsBtn.style.opacity = "1";
      settingsBtn.style.pointerEvents = "auto";
      hideSettingsBtnAfterDelay();
      div.remove();
    });
    document.getElementById("stay-btn").addEventListener("click", () => {
      div.remove();
    });
  }
}

// ------------------
// アニメーションループ
// ------------------
function loop() {
  renderClock();
  requestAnimationFrame(loop);
}
loop();
