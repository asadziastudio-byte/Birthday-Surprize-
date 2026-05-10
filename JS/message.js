/* particles */
const ambient = document.getElementById("ambient");
[
  {l:"14%",t:"22%",w:4,d:8},{l:"70%",t:"17%",w:3,d:11},
  {l:"26%",t:"74%",w:5,d:10},{l:"83%",t:"68%",w:4,d:13},
  {l:"50%",t:"11%",w:3,d:9},{l:"38%",t:"48%",w:3,d:14},
  {l:"62%",t:"58%",w:4,d:12},{l:"88%",t:"35%",w:3,d:9.5},
].forEach(p => {
  const el = document.createElement("div");
  el.className = "particle";
  el.style.cssText = `left:${p.l};top:${p.t};width:${p.w}px;height:${p.w}px;animation-duration:${p.d}s;animation-delay:${(Math.random()*6).toFixed(1)}s`;
  ambient.appendChild(el);
});

/* star field */
(function(){
  const c = document.getElementById("stars");
  const x = c.getContext("2d");
  const rs = () => { c.width = innerWidth; c.height = innerHeight; };
  rs(); addEventListener("resize", rs);
  const stars = Array.from({length:180}, () => ({
    px: Math.random(), py: Math.random(),
    r: Math.random()*1.2+.25,
    spd: Math.random()*.012+.004,
    phase: Math.random()*Math.PI*2
  }));
  let t = 0;
  (function draw(){
    x.clearRect(0,0,c.width,c.height);
    t += .016;
    stars.forEach(s => {
      const a = .2 + .65*(.5+.5*Math.sin(t*s.spd*6+s.phase));
      x.beginPath();
      x.arc(s.px*c.width, s.py*c.height, s.r, 0, Math.PI*2);
      x.fillStyle = `rgba(255,215,235,${a})`;
      x.fill();
    });
    requestAnimationFrame(draw);
  })();
})();

/* inner card star dots */
(function(){
  const card = document.getElementById("card");
  for(let i=0;i<16;i++){
    const d = document.createElement("div");
    d.className = "star-dot";
    d.style.left = Math.random()*100 + "%";
    d.style.top  = Math.random()*100 + "%";
    d.style.setProperty("--t", (Math.random()*2+1.5)+"s");
    d.style.animationDelay = (Math.random()*3)+"s";
    card.appendChild(d);
  }
})();

/* subtle cursor sparkle */
(function(){
  const cols = ["#e59ab8","#f0b0ca","rgba(229,154,184,.6)","#fde8f6"];
  document.addEventListener("mousemove", e => {
    if(Math.random() > .38) return;
    const s = document.createElement("div");
    const sz = Math.random()*5+2.5;
    s.style.cssText = `
      position:fixed;pointer-events:none;z-index:999;
      width:${sz}px;height:${sz}px;border-radius:50%;
      left:${e.clientX}px;top:${e.clientY}px;
      background:${cols[Math.floor(Math.random()*cols.length)]};
      transform:translate(-50%,-50%);
      animation:sparkFade .65s ease-out forwards;
    `;
    document.body.appendChild(s);
    setTimeout(()=>s.remove(), 650);
  });
  const style = document.createElement("style");
  style.textContent = `@keyframes sparkFade{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(.1);opacity:0}}`;
  document.head.appendChild(style);
})();



const blocks = document.querySelectorAll(".letter-block");

async function startLetterAnimation(){

  for(const block of blocks){

    const textEl = block.querySelector(".typing-text");

    const text = textEl.dataset.text;

    // reveal block
    block.classList.add("show");

    // show text container only now
    textEl.style.visibility = "visible";

    // typing cursor
    textEl.classList.add("typing");

    // clear text
    textEl.innerHTML = "";

    // type
    await typeText(textEl, text);

    // remove cursor
    textEl.classList.remove("typing");

    // wait before next block
    await wait(700);
  }
}

function typeText(element, html) {
  return new Promise(resolve => {
    let i = 0;

    function type() {
      if (i >= html.length) { resolve(); return; }

      if (html[i] === "<") {
        const endTag = html.indexOf(">", i);
        const fullTag = html.slice(i, endTag + 1);

        // Check if it's an opening tag (not closing)
        if (!fullTag.startsWith("</")) {
          // Find the matching closing tag
          const tagName = fullTag.match(/<(\w+)/)?.[1];
          const closeTag = `</${tagName}>`;
          const closeIdx = html.indexOf(closeTag, endTag);
          const innerContent = html.slice(endTag + 1, closeIdx);

          // Insert the full span with inner content at once
          element.innerHTML += fullTag + innerContent + closeTag;
          i = closeIdx + closeTag.length;
        } else {
          i = endTag + 1;
        }

        type();
        return;
      }

      element.innerHTML += html[i];
      let speed = 32;
      if (html[i] === ".") speed = 180;
      else if (html[i] === ",") speed = 90;
      else if (html[i] === "—") speed = 220;
      i++;
      setTimeout(type, speed);
    }

    type();
  });
}

function wait(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* wait until everything is painted */

window.addEventListener("load", ()=>{

  setTimeout(()=>{

    startLetterAnimation();

  }, 600);

});