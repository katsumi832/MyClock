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
// removed background color panel element to hide background controls from settings
// const bgColorOptionsDiv = document.getElementById("bg-color-options");

// gradient controls
const fontGradC1 = document.getElementById('font-grad-c1');
const fontGradC2 = document.getElementById('font-grad-c2');
const fontGradPattern = document.getElementById('font-grad-pattern');
// background gradient inputs are no longer used; keep variables only if DOM exists but do not use them
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
const clockStyles = ["Clock 1", "Clock 2", "Clock 3", "Clock 4", "Clock 5", "Clock 6", "Clock 7"];
let currentStyleIndex = 0;

// 選択状態（未保存の編集）
let editingSettings = {
  styleIndex: currentStyleIndex,
  color: "#ffffffff",
  size: 180,
  // font/bg modes: 'solid' | 'gradient' | 'split' | 'transparent'
  fontMode: 'solid',
  fontGrad: ['#fff700ff', '#00e5ffff', 'vertical'],
  // make background transparent by default and remove bg swatches from UI
  bgMode: 'transparent',
  bgGrad: [],
  clock6Speed: 1,
};

// 適用済み状態
let appliedSettings = { ...editingSettings };

// カラーパレット (expanded)
const palette = [
  "#2196f3","#ff4081","#ff9800","#ffffff","#00ff88",
  "#ffd600","#8e24aa","#00bcd4","#4caf50","#e91e63",
  "#9e9d24","#795548","#607d8b","#f06292","#ff7043",
  "#c2185b","#7c4dff","#03a9f4","#388e3c","#ffeb3b",
  "#ad1457","#00c853","#b388ff","#ff8a65","#d500f9",
  "#263238","#ff5252","#ffab00","#304ffe","#69f0ae"
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
      // removed automatic background-setting behavior to keep background transparent
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
// removed background gradient input initializers to avoid creating/using background controls

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
  // removed filling a background color so canvas remains transparent
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
  // removed background fill to preserve transparency
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
  // removed background fill to preserve transparency
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

  // Do not paint a solid background — clear canvas to transparent so the wall shows through
  ctx.clearRect(0, 0, w, h);

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
    // Flip clock (local implementation)
    renderClock3(offCtx, w, h, fontPaint, size, new Date(), { suppressBg: true });
  } else if (style === "Clock 4") {
    // Use the local renderClock4 implementation (no lazy-load)
    renderClock4(offCtx, w, h, fontPaint, size, new Date(), { suppressBg: true });
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
  } else if (style === "Clock 7") {
    // lazy-load Clock 7 script once
    if (typeof window.renderClock7 === 'function') {
      window.renderClock7(offCtx, w, h, fontPaint, size, new Date(), { suppressBg: true });
    } else if (!window._clock7ScriptLoading) {
      window._clock7ScriptLoading = true;
      const s = document.createElement('script');
      s.src = 'clocks/clock7/clock7.js';
      s.onload = () => { window._clock7ScriptLoaded = true; };
      document.body.appendChild(s);
    }
  }

  // Composite offscreen rendering on top of the centralized background
  ctx.drawImage(off, 0, 0);
}

function lazyLoadClock(n) {
  // Clock 4 uses local renderClock4; no external file to load
  if (n === 4) return;
  const key = `_clock${n}Loading`;
  if (window[key]) return;
  window[key] = true;
  const s = document.createElement('script');
  s.src = `clocks/clock${n}/${n===1? 'digital' : n===2? 'analog' : n===3? 'minimal' : n===4? 'dots' : n===5? 'binary' : n===6? 'clock6' : 'clock7'}.js`;
  s.onload = () => { /* loaded */ };
  document.body.appendChild(s);
}

// New: Clock 4 implementation (big ring + orbiting small dot + HH:MM center text)
function renderClock4(ctx, w, h, fontPaint, size, now, opts) {
	// draw on provided context (offscreen)
	ctx.clearRect(0, 0, w, h);

	const cx = w / 2;
	const cy = h / 2;

	// Big circle radius (use size but keep within canvas)
	const radius = Math.min(w, h) * 0.38;

	// Ring stroke — made thinner
	const ringWidth = Math.max(1, Math.floor(size * 0.02));
	ctx.lineWidth = ringWidth;
	try { ctx.strokeStyle = fontPaint; } catch (e) { ctx.strokeStyle = '#ffffff'; }
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.stroke();

	// Orbiting small dot (smooth using ms)
	const sec = now.getSeconds() + (now.getMilliseconds() / 1000);
	const angle = (sec / 60) * Math.PI * 2 - Math.PI / 2; // start at top
	const dotRadius = Math.max(4, Math.floor(size * 0.055));
	const sx = cx + Math.cos(angle) * radius;
	const sy = cy + Math.sin(angle) * radius;

	try { ctx.fillStyle = fontPaint; } catch (e) { ctx.fillStyle = '#ffffff'; }
	ctx.beginPath();
	ctx.arc(sx, sy, dotRadius, 0, Math.PI * 2);
	ctx.fill();

	// Center time: single line "HH:MM"
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	const hh = String(now.getHours()).padStart(2, '0');
	const mm = String(now.getMinutes()).padStart(2, '0');
	const timeText = `${hh}:${mm}`;

	// choose a single font size that fits comfortably in the circle
	// start from a larger size and shrink until it fits within the ring
	// use a thinner font-weight for a lighter look
	const fontWeight = '300';
	const family = "'Segoe UI', sans-serif";
	// increased initial size to make the font bigger
	let fontSize = Math.max(18, Math.floor(size * 1.25));
	ctx.font = `${fontWeight} ${fontSize}px ${family}`;
	let metrics = ctx.measureText(timeText);
	const maxWidth = radius * 1.6; // allow some padding inside the ring
	// shrink loop (keeps text from overflowing) — allow slightly larger cap relative to radius
	while ((metrics.width > maxWidth || fontSize > radius * 0.8) && fontSize > 8) {
		fontSize--;
		ctx.font = `${fontWeight} ${fontSize}px ${family}`;
		metrics = ctx.measureText(timeText);
	}

	// draw the single-line time centered
	ctx.fillText(timeText, cx, cy);
}

// ------------------
// Clock 3: Flip clock (HHMM) split-flap style (bigger + single-color when solid)
// ------------------
let _flip3State = {
  shown: null,                 // currently displayed digits ['H','H','M','M']
  anims: [null, null, null, null], // per index: { from, to, start, dur }
  dur: 800                     // ms per digit flip (smoother)
};
function renderClock3(ctx, w, h, paint, size, now, opts) {
  now = now || new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const digits = [hh[0], hh[1], mm[0], mm[1]]; // no colon
  if (!_flip3State.shown) _flip3State.shown = digits.slice();
  const ts = now.getTime();

  // Bigger layout: nearly full height; adjust to fit width
  let tileH = Math.floor(h * 0.95);
  let tileW = Math.floor(tileH * 0.56);
  const gap = Math.max(2, Math.floor(tileH * 0.03));
  let totalW = tileW * 4 + gap * 3;
  const maxW = Math.floor(w * 0.96);
  if (totalW > maxW) {
    const scale = maxW / totalW;
    tileW = Math.floor(tileW * scale);
    tileH = Math.floor(tileH * scale);
    totalW = tileW * 4 + gap * 3;
  }
  const cx = Math.floor((w - totalW) / 2);
  const cy = Math.floor((h - tileH) / 2);

  function roundRectFill(c, x, y, rw, rh, r, fill) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + rw, y, x + rw, y + rh, r);
    c.arcTo(x + rw, y + rh, x, y + rh, r);
    c.arcTo(x, y + rh, x, y, r);
    c.arcTo(x, y, x + rw, y, r);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  }

  // Plate drawing with hinge exactly at the middle (no center line)
  function drawPlate(c, x, y, rw, rh) {
    const plate = 'rgba(0,0,0,0.40)';
    const radius = Math.floor(rw * 0.08);
    // single fill — no top/bottom overlays (prevents middle line)
    roundRectFill(c, x, y, rw, rh, radius, plate);
  }

  // Smooth easing (sine in-out) for gentler motion
  function easeInOutSine(t) {
    return 0.5 * (1 - Math.cos(Math.PI * Math.max(0, Math.min(1, t))));
  }

  // Font helper (Oswald)
  function getFont(rh) {
    const weight = 700;
    const family = '"Oswald", "Bebas Neue", "Roboto Condensed", "Segoe UI", system-ui, sans-serif';
    const fontSize = Math.floor(rh * 0.92);
    return { font: `${weight} ${fontSize}px ${family}`, weight, family, fontSize };
  }

  // Compute baseline offset so the digit visual center lands exactly on the hinge
  function getBaselineOffset(c, font, digit, fontSize) {
    c.save(); c.font = font;
    const m = c.measureText(digit);
    c.restore();
    const asc = (m.actualBoundingBoxAscent != null) ? m.actualBoundingBoxAscent : fontSize * 0.8;
    const dsc = (m.actualBoundingBoxDescent != null) ? m.actualBoundingBoxDescent : fontSize * 0.2;
    return (asc - dsc) / 2;
  }

  // Render a digit into an offscreen bitmap once (avoids seam from double glyph draws)
  function renderDigitBitmap(rw, rh, digit, color, font, hingeY, baseOff) {
    const g = document.createElement('canvas');
    g.width = rw; g.height = rh;
    const gc = g.getContext('2d');
    gc.textAlign = 'center';
    gc.textBaseline = 'alphabetic';
    gc.fillStyle = color;
    gc.font = font;
    gc.fillText(digit, rw / 2, hingeY + baseOff);
    return g;
  }

  // Static digit render (no middle line — split by precise clips with half-pixel guard)
  function drawTileStatic(c, x, y, rw, rh, digit, color) {
    drawPlate(c, x, y, rw, rh);
    const { font, fontSize } = getFont(rh);
    const hingeY = y + rh / 2;
    const baseOff = getBaselineOffset(c, font, digit, fontSize);
    const bmp = renderDigitBitmap(rw, rh, digit, color, font, hingeY - y, baseOff);

    const hingeLine = Math.floor(hingeY) + 0.5; // half-pixel to avoid overdraw

    // top half
    c.save();
    c.beginPath();
    c.rect(x, y, rw, hingeLine - y);
    c.clip();
    c.drawImage(bmp, x, y);
    c.restore();

    // bottom half
    c.save();
    c.beginPath();
    c.rect(x, hingeLine, rw, y + rh - hingeLine);
    c.clip();
    c.drawImage(bmp, x, y);
    c.restore();
  }

  // Animated digit render (image-based transform around the hinge, no middle line)
  function drawTileAnimated(c, x, y, rw, rh, fromDigit, toDigit, color, progress) {
    drawPlate(c, x, y, rw, rh);
    const { font, fontSize } = getFont(rh);
    const hingeY = y + rh / 2;
    const hingeLocal = hingeY - y;
    const t = Math.max(0, Math.min(1, progress));
    const tTopRaw = Math.min(1, t * 2);
    const tBotRaw = Math.max(0, (t - 0.5) * 2);
    const t1 = easeInOutSine(tTopRaw);
    const t2 = easeInOutSine(tBotRaw);
    const baseOffFrom = getBaselineOffset(c, font, fromDigit, fontSize);
    const baseOffTo = getBaselineOffset(c, font, toDigit, fontSize);

    const fromBmp = renderDigitBitmap(rw, rh, fromDigit, color, font, hingeLocal, baseOffFrom);
    const toBmp   = renderDigitBitmap(rw, rh, toDigit,   color, font, hingeLocal, baseOffTo);

    const hingeLine = Math.floor(hingeY) + 0.5;

    // Static layers
    if (t < 0.5) {
      // bottom remains FROM
      c.save();
      c.beginPath(); c.rect(x, hingeLine, rw, y + rh - hingeLine); c.clip();
      c.drawImage(fromBmp, x, y);
      c.restore();
    } else {
      // top switches to TO
      c.save();
      c.beginPath(); c.rect(x, y, rw, hingeLine - y); c.clip();
      c.drawImage(toBmp, x, y);
      c.restore();
    }

    // Animated flap
    if (t < 0.5) {
      // Phase 1: top of FROM flips down
      const sy = Math.max(0.0001, 1 - t1);
      const skewMax = 0.18;
      const skew = (1 - sy) * skewMax;
      c.save();
      c.beginPath(); c.rect(x, y, rw, hingeLine - y); c.clip();
      c.translate(0, hingeY);
      c.transform(1, 0, skew, 1, 0, 0);
      c.scale(1, sy);
      c.drawImage(fromBmp, x, -hingeY + y);
      // shading
      const g = c.createLinearGradient(0, -rh, 0, 0);
      g.addColorStop(0, `rgba(0,0,0,${0.25 * (1 - sy)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = g;
      c.fillRect(x - 2, -rh, rw + 4, rh);
      c.restore();
    } else {
      // Phase 2: bottom of TO flips down
      const sy = Math.max(0.0001, t2);
      const skewMax = 0.18;
      const skew = (1 - sy) * skewMax;
      c.save();
      c.beginPath(); c.rect(x, hingeLine, rw, y + rh - hingeLine); c.clip();
      c.translate(0, hingeY);
      c.transform(1, 0, skew, 1, 0, 0);
      c.scale(1, sy);
      c.drawImage(toBmp, x, -hingeY + y);
      // shading
      const g = c.createLinearGradient(0, 0, 0, rh);
      g.addColorStop(0, `rgba(0,0,0,${0.20 * (1 - sy)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = g;
      c.fillRect(x - 2, 0, rw + 4, rh);
      c.restore();
    }
  }

  // positions: D0 D1 D2 D3 (no colon)
  const x0 = cx;
  const x1 = x0 + tileW + gap;
  const x2 = x1 + tileW + gap;
  const x3 = x2 + tileW + gap;

  // Helpers for color and lightening
  function isHex(cstr){ return typeof cstr==='string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(cstr.trim()); }
  function toRgb(hex){ hex = hex.replace('#',''); if (hex.length===3) hex = hex.split('').map(ch=>ch+ch).join(''); return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16) }; }
  function lightenHex(hex, amt){ try{ const {r,g,b}=toRgb(hex); const nr=Math.min(255,Math.round(r+(255-r)*amt)); const ng=Math.min(255,Math.round(g+(255-g)*amt)); const nb=Math.min(255,Math.round(b+(255-b)*amt)); return `rgb(${nr},${ng},${nb})`; }catch(e){ return hex; } }
  function darkenHex(hex, amt){ try{ const {r,g,b}=toRgb(hex); const nr=Math.max(0,Math.round(r-(r)*amt)); const ng=Math.max(0,Math.round(g-(g)*amt)); const nb=Math.max(0,Math.round(b-(b)*amt)); return `rgb(${nr},${ng},${nb})`; }catch(e){ return hex; } }
  function lumaFromRGB(r,g,b){ return (0.2126*r + 0.7152*g + 0.0722*b) / 255; }

  // Base color (solid) or gradient/pattern from paint
  let baseColor = '#ffffff';
  if (typeof paint === 'string' && paint.trim()) baseColor = paint;
  else if (typeof window !== 'undefined' && window.appliedSettings && window.appliedSettings.color) baseColor = window.appliedSettings.color;

  const uniformColor = (paint && typeof paint !== 'string') ? paint : baseColor;
  const colorFor0 = uniformColor;
  const colorFor1 = uniformColor;
  const colorFor2 = uniformColor;
  const colorFor3 = uniformColor;

  // Kick off animations for changed digits
  for (let i = 0; i < 4; i++) {
    if (_flip3State.shown[i] !== digits[i] && !_flip3State.anims[i]) {
      _flip3State.anims[i] = { from: _flip3State.shown[i], to: digits[i], start: ts, dur: _flip3State.dur };
    }
  }

  // draw digit tiles
  const tiles = [
    { x: cx,                       color: uniformColor, i: 0 },
    { x: cx + tileW + gap,         color: uniformColor, i: 1 },
    { x: cx + (tileW + gap) * 2,   color: uniformColor, i: 2 },
    { x: cx + (tileW + gap) * 3,   color: uniformColor, i: 3 },
  ];
  tiles.forEach(({ x, color, i }) => {
    const anim = _flip3State.anims[i];
    if (anim) {
      const p = Math.min(1, (ts - anim.start) / anim.dur);
      drawTileAnimated(ctx, x, cy, tileW, tileH, anim.from, anim.to, color, p);
      if (p >= 1) { _flip3State.shown[i] = anim.to; _flip3State.anims[i] = null; }
    } else {
      drawTileStatic(ctx, x, cy, tileW, tileH, _flip3State.shown[i], color);
    }
  });
}

function drawPreview() {
  const { styleIndex, color, size, mode } = editingSettings;
  const w = canvas.width;
  const h = canvas.height;
  // Do not paint a preview background — keep preview transparent
  ctx.clearRect(0, 0, w, h);

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
    // Flip clock preview (local)
    renderClock3(offCtx, w, h, fontPaint, previewSize, new Date(), { suppressBg: true });
  } else if (style === "Clock 4") {
		// preview uses same local renderer for Clock 4
		renderClock4(offCtx, w, h, fontPaint, previewSize, new Date(), { suppressBg: true });
	} else if (style === "Clock 5") {
  if (typeof window.renderClock5 === 'function') window.renderClock5(offCtx,w,h,fontPaint,previewSize,new Date(),{bg:(editingSettings.bgMode==='solid'?editingSettings.bgGrad&&editingSettings.bgGrad[0]:null),bgGradient:(editingSettings.bgMode==='gradient'||editingSettings.bgMode==='split'?editingSettings.bgGrad:null),suppressBg:true});
    else lazyLoadClock(5);
  } else if (style === "Clock 6") {
    if (typeof window.renderClock6 === 'function') {
      const bgArg = (editingSettings.bgMode === 'solid') ? (editingSettings.bgGrad && editingSettings.bgGrad[0] ? editingSettings.bgGrad[0] : '#000') : null;
      const bgGradArg = (editingSettings.bgMode === 'gradient' || editingSettings.bgMode === 'split') ? editingSettings.bgGrad : null;
      window.renderClock6(offCtx, w, h, fontPaint, previewSize, new Date(), { bg: bgArg, bgGradient: bgGradArg, clock6Speed: editingSettings.clock6Speed, suppressBg: true });
    } else {
      lazyLoadClock(6);
    }
  } else if (style === "Clock 7") {
    if (typeof window.renderClock7 === 'function') {
      window.renderClock7(offCtx, w, h, fontPaint, previewSize, new Date(), { suppressBg: true });
    } else {
      lazyLoadClock(7);
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

// Start rendering only after rounded fonts are requested and (ideally) loaded.
// Replace the previous Poppins-only guard with this:
(function startWhenRoundedReady(){
  // Inject Google Fonts for rounded families if not already present
  if (!document.querySelector('link[data-rounded]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-rounded', '1');
    // M PLUS Rounded 1c (700/800) + Nunito (700/800). Poppins already injected earlier is OK too.
    link.href = 'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@700;800&family=Nunito:wght@700;800&display=swap';
    document.head.appendChild(link);
  }
  // Inject sharp-cornered font for Clock 3 only
  if (!document.querySelector('link[data-cornered]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-cornered', '1');
    link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap';
    document.head.appendChild(link);
  }
  // Optionally keep existing Poppins link (harmless). Now wait for the rounded font.
  const wants = [
    '800 32px "M PLUS Rounded 1c"',
    '800 32px "Nunito"',
    '800 32px "Poppins"',
    '700 32px "Oswald"' // ensure cornered font is ready for Clock 3
  ];
  if (document.fonts && document.fonts.load) {
    const loads = Promise.all(wants.map(f => document.fonts.load(f)));
    const timeout = new Promise(res => setTimeout(res, 1500));
    Promise.race([loads, timeout]).then(() => {
      loop();
    });
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => loop());
    } else {
      loop();
    }
  }
})();
