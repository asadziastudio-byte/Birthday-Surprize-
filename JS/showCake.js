// ============================================================
//  showCake.js  –  Birthday Cake · Mic Blow Detection
// ============================================================

const messageBtnWrap = document.getElementById("messageBtnWrap");
const ambient         = document.getElementById("ambient");
const cakeWrap        = document.getElementById("cakeWrap");
const candle          = document.getElementById("candle");
const hintText        = document.getElementById("hintText");
const blowBar         = document.getElementById("blowBar");
const micStatus       = document.getElementById("micStatus");

const fwOutside = document.getElementById("fwOutside");
const fwInside  = document.getElementById("fwInside");

// ── Ambient floating particles ──────────────────────────────
[
  { l: "14%", t: "22%", w: 4, d: 8  },
  { l: "70%", t: "17%", w: 3, d: 11 },
  { l: "26%", t: "74%", w: 5, d: 10 },
  { l: "83%", t: "68%", w: 4, d: 13 },
  { l: "50%", t: "11%", w: 3, d: 9  },
  { l: "38%", t: "48%", w: 3, d: 14 },
  { l: "62%", t: "58%", w: 4, d: 12 }
].forEach((p) => {
  const el = document.createElement("div");
  el.className = "particle";
  el.style.cssText = `
    left:${p.l};top:${p.t};
    width:${p.w}px;height:${p.w}px;
    animation-duration:${p.d}s;
    animation-delay:${(Math.random()*6).toFixed(1)}s
  `;
  ambient.appendChild(el);
});

// ── State ───────────────────────────────────────────────────
let blown          = false;
let blowProgress   = 0;       // 0 – 100 (fill amount)
let animFrameId    = null;
let analyserNode   = null;
let audioCtx       = null;
let micStream      = null;
let dataArray      = null;
let isListening    = false;

// ── Blow-detection tunables ──────────────────────────────────
const VOLUME_THRESHOLD   = 7;    // RMS floor — low enough that a gentle blow registers
const FILL_RATE          = 8.8;  // progress units added per frame (bar fills in ~1–2 s of blowing)
const SUCCESS_THRESHOLD  = 100;  // progress needed to blow out candle


// ============================================================
//  FIREWORK ENGINE
// ============================================================

function fitCanvas(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = window.innerWidth  * ratio;
  canvas.height = window.innerHeight * ratio;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

// Both canvases are now position:fixed / full-viewport, so we size them
// to the full window instead of a bounding rect.
const outsideCtx = fitCanvas(fwOutside);
const insideCtx  = fitCanvas(fwInside);

window.addEventListener("resize", () => {
  fitCanvas(fwOutside);
  fitCanvas(fwInside);
});

class Rocket {
  constructor(x, y, targetY, color) {
    this.x = x; this.y = y; this.targetY = targetY; this.color = color;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = -(7 + Math.random() * 2.4);
    this.done  = false;
    this.trail = [];
  }
  update() {
    this.trail.push({ x: this.x, y: this.y, a: 1 });
    if (this.trail.length > 8) this.trail.shift();
    this.x += this.vx; this.y += this.vy; this.vy += 0.05;
    if (this.y <= this.targetY || this.vy >= -0.2) { this.done = true; return true; }
    return false;
  }
  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i], alpha = i / this.trail.length;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35})`;
      ctx.arc(t.x, t.y, 1.8, 0, Math.PI*2); ctx.fill();
    }
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 14; ctx.shadowColor = this.color;
    ctx.arc(this.x, this.y, 2.4, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class FireParticle {
  constructor(x, y, angle, speed, color, gravityScale = 1) {
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.color   = color;
    this.life    = 1;
    this.decay   = 0.012 + Math.random() * 0.01;
    this.gravity = 0.045 * gravityScale;
    this.friction= 0.985;
    this.size    = 1.8 + Math.random() * 2.2;
    this.trail   = [];
  }
  update() {
    this.trail.push({ x: this.x, y: this.y, life: this.life });
    if (this.trail.length > 6) this.trail.shift();
    this.vx *= this.friction; this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx; this.y += this.vy;
    this.life -= this.decay;
  }
  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i], alpha = (i/this.trail.length)*this.life*0.45;
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(this.color, alpha);
      ctx.arc(t.x, t.y, this.size*0.6, 0, Math.PI*2); ctx.fill();
    }
    ctx.beginPath();
    ctx.fillStyle = hexToRgba(this.color, this.life);
    ctx.shadowBlur = 16; ctx.shadowColor = this.color;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#","");
  const bigint = parseInt(clean,16);
  const r=(bigint>>16)&255, g=(bigint>>8)&255, b=bigint&255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function createFireworkSystem(canvas, ctx, mode="outside") {
  const rockets=[], particles=[];
  const colors=["#ff4d6d","#ffd166","#f7b2ff","#7bdff2","#caffbf","#ffffff","#ffa94d"];

  function launch(x, startY, targetY, burstSize=42) {
    const color = colors[Math.floor(Math.random()*colors.length)];
    const r = new Rocket(x, startY, targetY, color);
    r.burstSize = burstSize; r.burstColor = color;
    rockets.push(r);
  }

  function explode(x, y, color, burstSize) {
    for (let i=0; i<burstSize; i++) {
      const angle = (Math.PI*2*i)/burstSize + Math.random()*0.12;
      const speed = 1.8 + Math.random()*3.8;
      particles.push(new FireParticle(x,y,angle,speed,color, mode==="inside"?0.8:1));
    }
    for (let i=0; i<burstSize*0.35; i++) {
      const angle = Math.random()*Math.PI*2;
      const speed = 0.8 + Math.random()*1.6;
      particles.push(new FireParticle(x,y,angle,speed,"#ffffff", mode==="inside"?0.8:1));
    }
  }

  function tick() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i=rockets.length-1; i>=0; i--) {
      const r = rockets[i];
      const shouldExplode = r.update();
      r.draw(ctx);
      if (shouldExplode) { explode(r.x, r.y, r.burstColor, r.burstSize); rockets.splice(i,1); }
    }
    for (let i=particles.length-1; i>=0; i--) {
      const p = particles[i]; p.update(); p.draw(ctx);
      if (p.life <= 0) particles.splice(i,1);
    }
    requestAnimationFrame(tick);
  }
  tick();
  return { launch };
}

const outsideSystem = createFireworkSystem(fwOutside, fwOutside.getContext("2d"), "outside");
const insideSystem  = createFireworkSystem(fwInside,  fwInside.getContext("2d"),  "inside");

// ============================================================
//  LAUNCH SHOW
//  Now uses the card's real viewport position (getBoundingClientRect)
//  so rockets launch from BELOW the card and burst inside it.
//  Since fwInside is position:fixed over the full viewport, coordinates
//  map directly to viewport pixels — no offset math needed.
// ============================================================

function launchShow() {
  // Get the card's real position in the viewport
  const cardEl   = document.querySelector(".card");
  const cardRect = cardEl.getBoundingClientRect();

  const padX    = 70;
  const padTop  = 55;

  // Horizontal launch points mapped to viewport X
  const leftX   = cardRect.left + padX;
  const centerX = cardRect.left + cardRect.width / 2;
  const rightX  = cardRect.right - padX;

  // Burst target Y positions — inside the upper portion of the card
  const upperY  = cardRect.top + padTop + 35;
  const midY    = cardRect.top + padTop + 85;

  // Rockets launch from just below the bottom edge of the card
  const startY  = cardRect.bottom + 20;

  const sequence = [
    { x: leftX,       targetY: upperY + 20, size: 24 },
    { x: centerX,     targetY: upperY,      size: 22 },
    { x: rightX,      targetY: upperY + 20, size: 24 },
    { x: leftX + 28,  targetY: midY,        size: 20 },
    { x: rightX - 28, targetY: midY,        size: 20 },
    { x: centerX,     targetY: midY - 10,   size: 26 },
  ];

  sequence.forEach((shot, i) => {
    setTimeout(() => {
      insideSystem.launch(
        shot.x + (Math.random() * 6 - 3),
        startY,
        shot.targetY + (Math.random() * 6 - 3),
        shot.size
      );
    }, i * 500);
  });
}


// ============================================================
//  MICROPHONE SETUP
// ============================================================

async function setupMicrophone() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.4;
    const source = audioCtx.createMediaStreamSource(micStream);
    source.connect(analyserNode);
    dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    isListening = true;
    startBlowLoop();
  } catch (err) {
    console.warn("Microphone access denied or unavailable:", err);
    micStatus.textContent = "⚠ Mic access denied – tap the cake instead";
    cakeWrap.style.cursor = "pointer";
    cakeWrap.addEventListener("click", triggerBlowOut);
  }
}

// ============================================================
//  BLOW DETECTION LOOP
// ============================================================

function startBlowLoop() {
  function loop() {
    if (blown) return;

    analyserNode.getByteTimeDomainData(dataArray);

    let sumSq = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const s = dataArray[i] - 128;
      sumSq += s * s;
    }
    const rms = Math.sqrt(sumSq / dataArray.length);

    const isBlowing = rms > VOLUME_THRESHOLD;

    if (isBlowing) {
      const intensity = Math.min(rms / 20, 2.0);
      blowProgress = Math.min(blowProgress + FILL_RATE * intensity, 100);

      if (blowProgress < 50) micStatus.textContent = "Keep going… 💨";
      else if (blowProgress < 80) micStatus.textContent = "Almost there! 💨💨";
      else micStatus.textContent = "Almost! 💨💨💨";
    } else {
      if (blowProgress === 0) micStatus.textContent = "Listening...";
    }

    blowBar.style.width = blowProgress + "%";

    const hue  = Math.round(40 - blowProgress * 0.4);
    const sat  = 80 + Math.round(blowProgress * 0.2);
    blowBar.style.background = `hsl(${hue}, ${sat}%, 60%)`;

    if (blowProgress >= SUCCESS_THRESHOLD) {
      triggerBlowOut();
      return;
    }

    animFrameId = requestAnimationFrame(loop);
  }

  animFrameId = requestAnimationFrame(loop);
}


// ============================================================
//  CANDLE BLOW-OUT SEQUENCE
// ============================================================

function triggerBlowOut() {
  if (blown) return;
  blown = true;

  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (micStream)  micStream.getTracks().forEach(t => t.stop());
  if (audioCtx)   audioCtx.close();

  blowProgress = 100;
  blowBar.style.width = "100%";
  micStatus.textContent = "🎉 Happy Birthday!";

  const micUi = document.querySelector(".mic-ui");
  if (micUi) {
    micUi.style.transition = "opacity 0.6s ease";
    micUi.style.opacity    = "0";
    setTimeout(() => { micUi.style.display = "none"; }, 650);
  }

  candle.classList.add("flickering");

  setTimeout(() => {
    candle.classList.remove("flickering");
    candle.classList.add("blown");
    if (hintText) hintText.style.opacity = "0";

    setTimeout(() => {
      launchShow();
      messageBtnWrap.classList.add("show");
    }, 650);
  }, 500);
}


// ============================================================
//  PAGE INIT
// ============================================================

window.addEventListener("load", () => {
  const micUi = document.querySelector(".mic-ui");
  if (micUi) {
    micUi.style.opacity    = "0";
    micUi.style.transition = "opacity 0.8s ease";
  }

  setTimeout(() => {
    if (hintText) hintText.classList.add("reveal");
    if (micUi)   micUi.style.opacity = "1";
  }, 6000);

  setTimeout(() => {
    setupMicrophone();
  }, 7000);
});

window.addEventListener("load", () => {
  setTimeout(() => {
    document.querySelector(".mic-ui").classList.add("show");
  }, 5500);
});