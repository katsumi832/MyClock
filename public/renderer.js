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

const sizeMinusBtn = document.getElementById("size-minus");
const sizePlusBtn = document.getElementById("size-plus");
const sizeLabel = document.getElementById("size-label");

const modeToggleBtn = document.getElementById("mode-toggle");
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
  color: "#00ff88",
  size: 180,
  mode: "dark",
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
      editingSettings.color = c;
      renderColorOptions();
      drawPreview();
    });
    colorOptionsDiv.appendChild(div);
  });
}
renderColorOptions();

// Initialize labels to reflect current editingSettings
styleLabel.textContent = clockStyles[editingSettings.styleIndex];
sizeLabel.textContent = editingSettings.size;
modeToggleBtn.textContent = editingSettings.mode === "dark" ? "Dark Mode" : "Light Mode";

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
  // If settings panel is open, preview uses editingSettings.mode
  if (!settingsPanel.classList.contains("hidden")) return editingSettings.mode;
  return appliedSettings.mode;
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

  ctx.fillStyle = mode === "dark" ? "#000" : "#fff";
  ctx.fillRect(0, 0, w, h);
  const style = clockStyles[styleIndex];
  if (style === "Clock 1") {
    if (typeof window.renderClock1 === 'function') window.renderClock1(ctx,w,h,color,size,new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(1);
  } else if (style === "Clock 2") {
    if (typeof window.renderClock2 === 'function') window.renderClock2(ctx,w,h,color,size,new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(2);
  } else if (style === "Clock 3") {
    if (typeof window.renderClock3 === 'function') window.renderClock3(ctx,w,h,color,size,new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(3);
  } else if (style === "Clock 4") {
    if (typeof window.renderClock4 === 'function') window.renderClock4(ctx,w,h,color,size,new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(4);
  } else if (style === "Clock 5") {
    if (typeof window.renderClock5 === 'function') window.renderClock5(ctx,w,h,color,size,new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(5);
  } else if (style === "Clock 6") {
    // lazy-load Clock 6 script once
    if (typeof window.renderClock6 === 'function') {
      window.renderClock6(ctx, w, h, color, size, new Date(), { bg: mode === 'dark' ? '#000' : '#fff', clock6Speed: appliedSettings.clock6Speed });
    } else if (!window._clock6ScriptLoading) {
      window._clock6ScriptLoading = true;
  const s = document.createElement('script');
  s.src = 'clocks/clock6/clock6.js';
  s.onload = () => { window._clock6ScriptLoaded = true; };
      document.body.appendChild(s);
    }
  }
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
  // Render preview on main canvas
  ctx.fillStyle = mode === "dark" ? "#000" : "#fff";
  ctx.fillRect(0, 0, w, h);

  // Use the chosen `size` directly for preview so the clock doesn't shrink
  const previewSize = size;

  const style = clockStyles[styleIndex];
  if (style === "Clock 1") {
    if (typeof window.renderClock1 === 'function') window.renderClock1(ctx,w,h,color,previewSize,new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(1);
  } else if (style === "Clock 2") {
    if (typeof window.renderClock2 === 'function') window.renderClock2(ctx,w,h,color,Math.round(previewSize*0.8),new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(2);
  } else if (style === "Clock 3") {
    if (typeof window.renderClock3 === 'function') window.renderClock3(ctx,w,h,color,previewSize,new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(3);
  } else if (style === "Clock 4") {
    if (typeof window.renderClock4 === 'function') window.renderClock4(ctx,w,h,color,previewSize,new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(4);
  } else if (style === "Clock 5") {
    if (typeof window.renderClock5 === 'function') window.renderClock5(ctx,w,h,color,previewSize,new Date(),{bg:mode==='dark'?'#000':'#fff'});
    else lazyLoadClock(5);
  } else if (style === "Clock 6") {
    if (typeof window.renderClock6 === 'function') {
      window.renderClock6(ctx, w, h, color, size, new Date(), { bg: mode === 'dark' ? '#000' : '#fff', clock6Speed: editingSettings.clock6Speed });
    }
  }
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
    settingsBtn.style.opacity = "0";
    settingsBtn.style.pointerEvents = "none";
  } else {
    settingsBtn.style.opacity = "1";
    settingsBtn.style.pointerEvents = "auto";
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

// Helper to hide settings button after 5 seconds
let hideSettingsBtnTimeout = null;
function hideSettingsBtnAfterDelay() {
  if (hideSettingsBtnTimeout) clearTimeout(hideSettingsBtnTimeout);
  hideSettingsBtnTimeout = setTimeout(() => {
    settingsBtn.style.opacity = "0";
    settingsBtn.style.pointerEvents = "none";
  }, 5000);
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

// ダーク/ライトモード
modeToggleBtn.addEventListener("click", () => {
  editingSettings.mode = editingSettings.mode === "dark" ? "light" : "dark";
  modeToggleBtn.textContent =
    editingSettings.mode === "dark" ? "Dark Mode" : "Light Mode";
  drawPreview();
});

// Confirm Change
applyBtn.addEventListener("click", () => {
  appliedSettings = { ...editingSettings };
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
