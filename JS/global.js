(function () {
  const container = document.getElementById("bubbleBg");
  if (!container) return;

  const BUBBLE_COUNT = 25; // change if you want more or less
  const bubbles = [];
  const card = document.querySelector(".card");

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rectsOverlap(a, b) {
    return !(
      a.right < b.left ||
      a.left > b.right ||
      a.bottom < b.top ||
      a.top > b.bottom
    );
  }

  function getCardRect() {
    return card ? card.getBoundingClientRect() : null;
  }

  function makeBubbleSafeRect(size) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cardRect = getCardRect();

    let x, y, tries = 0;
    const maxTries = 120;

    do {
      x = rand(0, w - size);
      y = rand(0, h - size);

      const safeGap = 24;

        const bubbleRect = {
        left: x,
        top: y,
        right: x + size,
        bottom: y + size
        };

const protectedCardRect = cardRect
  ? {
      left: cardRect.left - safeGap,
      top: cardRect.top - safeGap,
      right: cardRect.right + safeGap,
      bottom: cardRect.bottom + safeGap
    }
  : null;

      if (!protectedCardRect || !rectsOverlap(bubbleRect, protectedCardRect))  {
        return { x, y };
      }

      tries++;
    } while (tries < maxTries);

    return { x, y };
  }

  function createBubble(index) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const size = rand(18, 72); // little + bigger bubbles
    const { x, y } = makeBubbleSafeRect(size);

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubble.style.opacity = `${rand(0.25, 0.75)}`;

    bubble.style.setProperty("--fx1", `${rand(-8, 8)}px`);
    bubble.style.setProperty("--fy1", `${rand(-14, 14)}px`);
    bubble.style.setProperty("--fx2", `${rand(-14, 14)}px`);
    bubble.style.setProperty("--fy2", `${rand(-18, 18)}px`);
    bubble.style.setProperty("--fx3", `${rand(-10, 10)}px`);
    bubble.style.setProperty("--fy3", `${rand(-12, 12)}px`);

    bubble.style.animation = `bubbleFloat ${rand(7, 16).toFixed(2)}s ease-in-out infinite`;
    bubble.style.animationDelay = `${rand(0, 5).toFixed(2)}s`;

    container.appendChild(bubble);

    const bubbleObj = {
      el: bubble,
      size,
      x,
      y,
      baseX: x,
      baseY: y,
      dragging: false,
      pointerId: null,
      offsetX: 0,
      offsetY: 0
    };

    setupDrag(bubbleObj);
    bubbles.push(bubbleObj);
  }

  function setupDrag(bubbleObj) {
    const el = bubbleObj.el;

    el.addEventListener("pointerdown", (e) => {
      bubbleObj.dragging = true;
      bubbleObj.pointerId = e.pointerId;
      bubbleObj.offsetX = e.clientX - bubbleObj.x;
      bubbleObj.offsetY = e.clientY - bubbleObj.y;

      el.classList.add("dragging");
      el.style.animationPlayState = "paused";
      el.setPointerCapture(e.pointerId);
    });

    el.addEventListener("pointermove", (e) => {
      if (!bubbleObj.dragging || bubbleObj.pointerId !== e.pointerId) return;

      const maxX = window.innerWidth - bubbleObj.size;
      const maxY = window.innerHeight - bubbleObj.size;

      bubbleObj.x = clamp(e.clientX - bubbleObj.offsetX, 0, maxX);
      bubbleObj.y = clamp(e.clientY - bubbleObj.offsetY, 0, maxY);

      el.style.left = `${bubbleObj.x}px`;
      el.style.top = `${bubbleObj.y}px`;
    });

    function endDrag(e) {
      if (!bubbleObj.dragging || bubbleObj.pointerId !== e.pointerId) return;

      bubbleObj.dragging = false;
      bubbleObj.pointerId = null;
      bubbleObj.baseX = bubbleObj.x;
      bubbleObj.baseY = bubbleObj.y;

      el.classList.remove("dragging");
      el.style.animationPlayState = "running";
    }

    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
  }

  function buildBubbles() {
    container.innerHTML = "";
    bubbles.length = 0;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      createBubble(i);
    }
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildBubbles, 120);
  });

  buildBubbles();
})();



// animations....................


(function() {
    const canvas = document.createElement('canvas');
    canvas.id = 'touch-effects-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let particles = [];
    let ripples = [];

    // Resize canvas to fit window
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type; // 'heart' or 'sparkle'
            this.size = type === 'heart' ? Math.random() * 15 + 10 : Math.random() * 3 + 1;
            this.speedX = (Math.random() - 0.5) * 3;
            this.speedY = (Math.random() - 0.5) * 3;
            this.opacity = 1;
            this.color = type === 'heart' ? `hsla(340, 100%, 75%,` : `hsla(50, 100%, 80%,`;
        }

        draw() {
            ctx.globalAlpha = this.opacity;
            if (this.type === 'heart') {
                this.drawHeart(this.x, this.y, this.size);
            } else {
                ctx.fillStyle = '#FFF5A5'; // Sparkle color
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        drawHeart(x, y, size) {
            ctx.fillStyle = '#FF85A1';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FF85A1';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(x, y - size / 2, x - size, y - size / 2, x - size, y);
            ctx.bezierCurveTo(x - size, y + size / 2, x, y + size, x, y + size);
            ctx.bezierCurveTo(x, y + size, x + size, y + size / 2, x + size, y);
            ctx.bezierCurveTo(x + size, y - size / 2, x, y - size / 2, x, y);
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.opacity -= 0.02;
            this.size *= 0.96;
        }
    }

    class Ripple {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 1;
            this.opacity = 0.5;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 182, 193, ${this.opacity})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        update() {
            this.radius += 4;
            this.opacity -= 0.015;
        }
    }

    function handleTouch(e) {
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const y = e.touches ? e.touches[0].clientY : e.clientY;

        // 1. Heart Trail
        particles.push(new Particle(x, y, 'heart'));

        // 2. Sparkle Burst (Only on initial tap/click)
        if (e.type === 'touchstart' || e.type === 'mousedown') {
            ripples.push(new Ripple(x, y)); // 3. Glow Ripple
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(x, y, 'sparkle'));
            }
        }
    }

    window.addEventListener('mousemove', handleTouch);
    window.addEventListener('touchstart', handleTouch);
    window.addEventListener('touchmove', handleTouch);

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Process Particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].opacity <= 0) {
                particles.splice(i, 1);
                i--;
            }
        }

        // Process Ripples
        for (let i = 0; i < ripples.length; i++) {
            ripples[i].update();
            ripples[i].draw();
            if (ripples[i].opacity <= 0) {
                ripples.splice(i, 1);
                i--;
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
})();

// ============================================================
//  GLOBAL.JS  –  Falling Hearts
//  Soft, cute, colorful, glowing hearts that fall top → bottom
//  continuously across every page. Paste into your global.js.
// ============================================================

// ============================================================
//  GLOBAL.JS  –  Falling Hearts
//  Soft, cute, colorful, glowing hearts that fall top → bottom
//  continuously across every page. Paste into your global.js.
// ============================================================

(function () {

  // ── Create & insert canvas ───────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.id = "heartCanvas";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  // ── Resize handler ───────────────────────────────────────
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // ── Heart colours — soft romantic palette ───────────────
  // Each entry: [fillColor, glowColor]
  const PALETTES = [
    ["#ff85a1", "#ff85a1"],   // rose pink
    ["#ffaec0", "#ffaec0"],   // baby pink
    ["#ff6fa8", "#ff6fa8"],   // hot pink
    ["#ffc2d4", "#ffc2d4"],   // blush
    ["#e88ef7", "#e88ef7"],   // soft lavender
    ["#c77dff", "#c77dff"],   // light purple
    ["#f7b2e0", "#f7b2e0"],   // petal pink
    ["#ff9de2", "#ff9de2"],   // orchid
    ["#ffb3c6", "#ffb3c6"],   // peach pink
    ["#d4a5ff", "#d4a5ff"],   // lilac
  ];

  // ── Tuning ───────────────────────────────────────────────
  const HEART_COUNT   = 34;    // total hearts alive at once
  const MIN_SIZE      = 5;     // px — smallest heart radius
  const MAX_SIZE      = 14;    // px — largest heart radius
  const MIN_SPEED     = 1.0;   // px/frame fall speed
  const MAX_SPEED     = 2.2;
  const MIN_DRIFT     = -0.35; // horizontal sway per frame
  const MAX_DRIFT     = 0.35;
  const SWAY_AMP      = 0.55;  // swinging amplitude (extra x offset)
  const SWAY_FREQ     = 0.018; // how fast it sways
  const MIN_OPACITY   = 0.45;
  const MAX_OPACITY   = 0.92;
  const GLOW_BLUR     = 18;    // ctx.shadowBlur value
  const ROTATE_SPEED  = 0.008; // gentle spin per frame (radians)

  // ── Heart path helper (drawn centred at 0,0, radius r) ──
  // Classic heart using bezier curves.
  function heartPath(r) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.35);
    ctx.bezierCurveTo( r,       -r * 1.05,  r * 1.6,   r * 0.35,  0,          r);
    ctx.bezierCurveTo(-r * 1.6,  r * 0.35, -r,         -r * 1.05, 0,         -r * 0.35);
    ctx.closePath();
  }

  // ── Factory: create one heart with random properties ────
  function makeHeart(fromTop) {
    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    return {
      x:       Math.random() * window.innerWidth,
      y:       fromTop
               ? -Math.random() * window.innerHeight   // stagger initial positions
               : -MAX_SIZE * 2,                         // fresh hearts start above
      r:       MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
      speed:   MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED),
      drift:   MIN_DRIFT + Math.random() * (MAX_DRIFT - MIN_DRIFT),
      opacity: MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY),
      fill:    palette[0],
      glow:    palette[1],
      angle:   Math.random() * Math.PI * 2,
      spin:    (Math.random() > 0.5 ? 1 : -1) * ROTATE_SPEED * (0.4 + Math.random()),
      swayOffset: Math.random() * Math.PI * 2,  // phase offset for sine sway
      tick:    0,
    };
  }

  // ── Initialise pool ──────────────────────────────────────
  const hearts = [];
  for (let i = 0; i < HEART_COUNT; i++) {
    hearts.push(makeHeart(true)); // spread across screen on load
  }

  // ── Respawn a heart that fell off the bottom ─────────────
  function resetHeart(h) {
    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    h.x       = Math.random() * window.innerWidth;
    h.y       = -MAX_SIZE * 2;
    h.r       = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE);
    h.speed   = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    h.drift   = MIN_DRIFT + Math.random() * (MAX_DRIFT - MIN_DRIFT);
    h.opacity = MIN_OPACITY + Math.random() * (MAX_OPACITY - MIN_OPACITY);
    h.fill    = palette[0];
    h.glow    = palette[1];
    h.angle   = Math.random() * Math.PI * 2;
    h.spin    = (Math.random() > 0.5 ? 1 : -1) * ROTATE_SPEED * (0.4 + Math.random());
    h.swayOffset = Math.random() * Math.PI * 2;
    h.tick    = 0;
  }

  // ── Main animation loop ──────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const h of hearts) {

      // Move downward + gentle horizontal sway
      h.y += h.speed;
      h.x += h.drift + Math.sin(h.tick * SWAY_FREQ + h.swayOffset) * SWAY_AMP;
      h.angle += h.spin;
      h.tick++;

      // Respawn when off bottom (or strayed far off sides)
      if (
        h.y > canvas.height + h.r * 2 ||
        h.x < -canvas.width * 0.3 ||
        h.x > canvas.width * 1.3
      ) {
        resetHeart(h);
        continue;
      }

      // Draw
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.angle);
      ctx.globalAlpha = h.opacity;

      // Outer glow
      ctx.shadowBlur  = GLOW_BLUR;
      ctx.shadowColor = h.glow;

      ctx.fillStyle = h.fill;
      heartPath(h.r);
      ctx.fill();

      // Second pass: softer inner glow for depth
      ctx.shadowBlur  = GLOW_BLUR * 0.5;
      ctx.shadowColor = "#ffffff";
      ctx.globalAlpha = h.opacity * 0.25;
      heartPath(h.r * 0.6);
      ctx.fill();

      ctx.restore();
    }

    requestAnimationFrame(draw);
  }

  draw();

})();