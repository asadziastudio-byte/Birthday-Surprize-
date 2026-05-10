/* ── particles ── */
    const ambientEl = document.getElementById("ambient");
    const pData = [
      { l:"14%", t:"22%", w:4,  dur:8  },
      { l:"70%", t:"17%", w:3,  dur:11 },
      { l:"26%", t:"74%", w:5,  dur:10 },
      { l:"83%", t:"68%", w:4,  dur:13 },
      { l:"50%", t:"11%", w:3,  dur:9  },
      { l:"38%", t:"48%", w:3,  dur:14 },
      { l:"62%", t:"58%", w:4,  dur:12 },
    ];
    pData.forEach(p => {
      const el = document.createElement("div");
      el.className = "particle";
      el.style.cssText = `left:${p.l};top:${p.t};width:${p.w}px;height:${p.w}px;animation-duration:${p.dur}s;animation-delay:${(Math.random()*6).toFixed(1)}s`;
      ambientEl.appendChild(el);
    });

    /* ── dot marks around inner ring ── */
    const dotsRing = document.getElementById("dotsRing");
    const DOT_COUNT = 20;
    const RING_R = 110;     // must match r="110" in the SVG
    const SHELL_HALF = 140; // half of the 280px timer shell
    for (let i = 0; i < DOT_COUNT; i++) {
      const angle = (i / DOT_COUNT) * 2 * Math.PI - Math.PI / 2;
      const x = SHELL_HALF + RING_R * Math.cos(angle) - 2; // -2 = half dot width
      const y = SHELL_HALF + RING_R * Math.sin(angle) - 2;
      const dot = document.createElement("div");
      dot.className = "dot-mark";
      dot.style.cssText = `left:${x}px;top:${y}px;position:absolute;transform:none;transform-origin:unset;`;
      dotsRing.appendChild(dot);
    }

    /* ── element refs ── */
    const envelope       = document.getElementById("envelope");
    const envelopePanel  = document.getElementById("envelopePanel");
    const countdownPanel = document.getElementById("countdownPanel");
    const timerNumber    = document.getElementById("timerNumber");
    const timerSubtext   = document.getElementById("timerSubtext");
    const ringProgress   = document.getElementById("ringProgress");
    const finishBtnWrap  = document.getElementById("finishBtnWrap");
    const nextPageBtn    = document.getElementById("nextPageBtn");
    const restartBtn     = document.getElementById("restartBtn");

    /* ── config ── */
    const START_SECONDS = 8;                  // ← countdown starts from 8
    const CIRCUMFERENCE = 2 * Math.PI * 110;  // full ring length in px

    let remaining        = START_SECONDS;
    let intervalId       = null;
    let countdownStarted = false;

    ringProgress.style.strokeDasharray  = `${CIRCUMFERENCE}`;
    ringProgress.style.strokeDashoffset = "0";

    /* ── colour helpers ──────────────────────────────────────────
       Both the ring AND the digit use the same hue so they always
       match. Hue travels green (130) → pink/red (320) as ratio
       goes from 1 (full time) → 0 (time up).                    */
    function getHue(ratio) {
      return 130 + (1 - ratio) * 190; // 130 = green, 320 = deep pink
    }

    function getRingColor(ratio) {
      return `hsl(${getHue(ratio)}, 90%, 46%)`;
    }

    function getRingGlow(ratio) {
      const hue = getHue(ratio);
      return `drop-shadow(0 0 7px hsla(${hue},100%,56%,.45)) drop-shadow(0 0 18px hsla(${hue},100%,56%,.16))`;
    }

    /* ── update every second ─────────────────────────────────── */
    function updateVisual(secs) {
      const ratio  = secs / START_SECONDS;
      const offset = CIRCUMFERENCE * (1 - ratio);
      const hue    = getHue(ratio);

      /* ring arc */
      ringProgress.style.strokeDashoffset = `${offset}`;
      ringProgress.style.stroke           = getRingColor(ratio);
      ringProgress.style.filter           = getRingGlow(ratio);

      if (secs < 0) {
        /* ── TIME'S UP: small soft CSS glowing heart, pulses until next page ── */
        timerNumber.innerHTML = `
          <span id="cssHeart" style="
            display: inline-block;
            position: relative;
            width: 48px;
            height: 44px;
            animation: heartGlow 1.6s ease-in-out infinite;
          ">
            <!-- Heart shape built from two CSS pseudo-style divs via inline SVG -->
            <svg viewBox="0 0 100 90" width="48" height="44" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="hg" cx="50%" cy="40%" r="60%">
                  <stop offset="0%"   stop-color="#ffb3d1"/>
                  <stop offset="60%"  stop-color="#e87aaa"/>
                  <stop offset="100%" stop-color="#c45480"/>
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <path d="M50 85 C50 85 5 55 5 28 A22 22 0 0 1 50 18 A22 22 0 0 1 95 28 C95 55 50 85 50 85Z"
                    fill="url(#hg)" filter="url(#glow)"/>
            </svg>
          </span>`;
        timerNumber.style.fontSize   = "inherit";
        timerNumber.style.lineHeight = "1";
        timerNumber.style.filter     = "none";
        timerNumber.style.color      = "transparent";
        timerSubtext.textContent     = "";
        timerSubtext.style.opacity   = "0";

        /* inject the pulse keyframe once if not already present */
        if (!document.getElementById("heartGlowStyle")) {
          const s = document.createElement("style");
          s.id = "heartGlowStyle";
          s.textContent = `
            @keyframes heartGlow {
              0%,100% { transform: scale(1);    filter: drop-shadow(0 0  8px rgba(232,122,170,.55)) drop-shadow(0 0 18px rgba(232,122,170,.25)); }
              50%      { transform: scale(1.12); filter: drop-shadow(0 0 14px rgba(255,160,200,.80)) drop-shadow(0 0 30px rgba(232,122,170,.45)); }
            }`;
          document.head.appendChild(s);
        }

      } else {
        /* ── COUNTING: digit colour always matches the ring colour ── */
        timerNumber.innerHTML        = String(secs).padStart(2, "0");
        timerNumber.style.fontSize   = "80px";   // restore default size
        timerNumber.style.lineHeight = "1";
        timerNumber.style.filter     = "none";
        timerNumber.style.color      = `hsl(${hue}, 85%, 74%)`; // ← always in sync with ring
        timerSubtext.textContent     = secs === 1 ? "second left" : "seconds left";
        timerSubtext.style.opacity   = "1";
      }
    }

    /* ── countdown logic ─────────────────────────────────────── */
    function startCountdown() {
      if (countdownStarted) return;
      countdownStarted = true;
      remaining = START_SECONDS;
      finishBtnWrap.classList.remove("show");
      updateVisual(remaining);

      intervalId = setInterval(() => {
        remaining -= 1;
        updateVisual(Math.max(remaining, 0));

        if (remaining <= 0) {
          clearInterval(intervalId);
          intervalId = null;
          /* small delay so the heart renders before the button appears */
          setTimeout(() => finishBtnWrap.classList.add("show"), 400);
        }
      }, 1000);
    }

    function showCountdown() {
      envelope.classList.add("opening");
      setTimeout(() => {
        envelopePanel.classList.add("hidden");
        countdownPanel.classList.remove("hidden");
        startCountdown();
      }, 700);
    }

    /* ── reset / restart ─────────────────────────────────────── */
    function resetExperience() {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      countdownStarted = false;
      remaining = START_SECONDS;
      finishBtnWrap.classList.remove("show");

      /* restore digit defaults before rewinding */
      timerNumber.style.fontSize   = "80px";
      timerNumber.style.filter     = "none";
      timerSubtext.style.opacity   = "1";

      updateVisual(START_SECONDS);
      countdownPanel.classList.add("hidden");
      envelopePanel.classList.remove("hidden");
      envelope.classList.remove("opening");
    }

    /* ── event listeners ─────────────────────────────────────── */
    envelope.addEventListener("click", showCountdown);
    envelope.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showCountdown(); }
    });

    nextPageBtn.addEventListener("click", () => {
      window.location.href = "/HTML/showCake.html";
    });

    restartBtn.addEventListener("click", resetExperience);

    /* initialise display */
    updateVisual(START_SECONDS);