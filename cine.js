/* cine.js — the homepage reverse-scrub hero (Route B vector scrub, DESIGN.md).
   Vanilla, no dependencies. Scroll runs the brand intro BACKWARD: the tagline
   un-writes (reverse ember trail), the seam glow condenses into the firefly,
   the hexes disperse, the firefly re-blinks twice and flies home to the header
   icon while the wordmark FLIP-docks into the header wordmark slot.

   Fail-open: the assembled scene is the CSS default; this file only perturbs
   it, so any error leaves a complete static banner and a normal header.

   Dev contract (machine verification): ?cine=0.42 pins scrub progress and
   skips the loop; window.__cineReady flips true after init; window.__cineP
   reports the live progress. */
(function () {
  "use strict";
  var root = document.documentElement;
  var section = document.getElementById("cine");
  if (!section || !root.classList.contains("cine-on")) return;

  var stage = section.querySelector(".cine-stage");
  var hexSvg = section.querySelector(".cine-hex");
  var word = section.querySelector(".cine-word");
  var tag = section.querySelector(".cine-tag");
  var fly = section.querySelector(".cine-firefly");
  var hint = section.querySelector(".cine-hint");
  var brand = document.querySelector("header.site .brand");
  var brandWord = document.querySelector("header.site .brand .wordmark");
  var glows = [].slice.call(hexSvg.querySelectorAll(".glow"));
  var hexes = [].slice.call(hexSvg.querySelectorAll(".hx"));

  /* split the tagline into per-word spans holding per-letter spans, so the
     ember can address letters while phones still wrap at word boundaries */
  var letters = [];
  tag.textContent.split(" ").forEach(function (w, i, arr) {
    var ws = document.createElement("span");
    ws.className = "w";
    for (var c = 0; c < w.length; c++) {
      var ls = document.createElement("span");
      ls.className = "l";
      ls.textContent = w[c];
      ws.appendChild(ls);
      letters.push(ls);
    }
    if (i === 0) tag.textContent = "";
    tag.appendChild(ws);
    if (i < arr.length - 1) tag.appendChild(document.createTextNode(" "));
  });
  var N = letters.length;

  /* the firefly's seat = the icon's own hot-spot (14,-82) as a fraction of the
     viewBox (-300 -290 600 580); hex drift vectors ride on data-dx/dy */
  var SEAT_X = (14 + 300) / 600, SEAT_Y = (-82 + 290) / 580;
  var GLOW_TO = { x: 14, y: -82 };            /* condense target, viewBox units */

  /* Geometry: stage children (word base, firefly seat) are measured in STAGE
     space — their layout is static. The header targets (dock, nest) live in
     VIEWPORT space and are converted to stage space per frame in apply(),
     because the stage only coincides with the viewport while its sticky pin
     is engaged (at page load it starts one header-height lower). */
  var m = null;
  function measure() {
    var st = stage.getBoundingClientRect();
    word.style.transform = "";                /* FLIP base must be untransformed */
    var b = word.getBoundingClientRect();
    var t = brandWord.getBoundingClientRect();
    var hx = hexSvg.getBoundingClientRect();
    var br = brand.getBoundingClientRect();
    m = {
      word: { x: b.left - st.left, y: b.top - st.top, h: b.height },
      dock: { x: t.left, y: t.top, h: t.height },                    /* viewport */
      seat: { x: hx.left - st.left + SEAT_X * hx.width, y: hx.top - st.top + SEAT_Y * hx.height },
      nest: { x: br.left + 15, y: br.top + 15 }                      /* viewport */
    };
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
  function ioCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  /* a soft brightness bump centered on c with half-width w — one firefly blink */
  function bump(s, c, w) { var d = Math.abs(s - c); return d >= w ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d / w); }

  function apply(s) {
    /* header targets → stage space, against the stage's live position */
    var sr = stage.getBoundingClientRect();
    var dock = { x: m.dock.x - sr.left, y: m.dock.y - sr.top, h: m.dock.h };
    var nest = { x: m.nest.x - sr.left, y: m.nest.y - sr.top };

    /* hint dies first */
    hint.style.opacity = String(1 - seg(s, 0, 0.1));

    /* A · reverse ember (s 0.02–0.34): the light un-writes the sentence R→L */
    var e = seg(s, 0.02, 0.34);
    var head = (1 - e) * N;                   /* letters at index ≥ head are dark */
    for (var i = 0; i < N; i++) {
      var ls = letters[i].style;
      if (i > head) {                          /* un-written */
        ls.opacity = "0.12"; ls.color = ""; ls.textShadow = "";
      } else if (i > head - 1) {               /* the ember head */
        ls.opacity = "1"; ls.color = "#a6ecbb";
        ls.textShadow = "0 0 14px rgba(125,205,146,.85), 0 0 30px rgba(95,184,119,.45)";
      } else {                                 /* written, resting lit */
        ls.opacity = "0.92"; ls.color = ""; ls.textShadow = "";
      }
    }
    tag.style.opacity = String(1 - seg(s, 0.3, 0.42));

    /* B · seam glow condenses into the firefly point (s 0.30–0.58) */
    var g = ioCubic(seg(s, 0.3, 0.58));
    glows.forEach(function (el) {
      var cx = +(el.getAttribute("cx") || 55), cy = +(el.getAttribute("cy") || -10);
      el.style.transform = "translate(" + (GLOW_TO.x - cx) * g + "px," + (GLOW_TO.y - cy) * g + "px) scale(" + lerp(1, 0.1, g) + ")";
      el.style.opacity = String(1 - g);
    });

    /* C · hexes disperse outward, staggered, center last (s 0.36–0.76) */
    hexes.forEach(function (el, j) {
      var dx = +el.dataset.dx, dy = +el.dataset.dy;
      var ring = dx === 0 && dy === 0;
      var a = ring ? 0.6 : 0.36 + 0.03 * j;
      var h = ioCubic(seg(s, a, a + 0.16));
      el.style.transform = "translate(" + dx * 30 * h + "px," + dy * 30 * h + "px)";
      el.style.opacity = String(1 - h);
    });

    /* D · the firefly: condenses in, re-blinks twice, flies home to the header
       icon (reverse of the intro's wake-up) */
    var born = seg(s, 0.5, 0.58);
    var blink = 0.55 * bump(s, 0.66, 0.045) + 0.85 * bump(s, 0.77, 0.055);
    var travel = ioCubic(seg(s, 0.82, 0.96));
    var fx = lerp(m.seat.x, nest.x, travel), fy = lerp(m.seat.y, nest.y, travel);
    fly.style.transform = "translate(" + fx + "px," + fy + "px) scale(" + (0.9 + 0.45 * blink) + ")";
    fly.style.opacity = String(clamp01(born * (0.35 + 0.65 * blink) * (1 - seg(s, 0.93, 0.99))));

    /* E · wordmark FLIP-docks into the header slot (s 0.70–0.98) */
    var d = ioCubic(seg(s, 0.7, 0.98));
    var k = lerp(1, dock.h / m.word.h, d);
    word.style.transform = "translate(" + (dock.x - m.word.x) * d + "px," + (dock.y - m.word.y) * d + "px) scale(" + k + ")";
    var handoff = seg(s, 0.965, 1);
    word.style.opacity = String(1 - handoff);
    brand.style.opacity = String(s >= 1 ? 1 : handoff);
  }

  function progress() {
    var r = section.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp01(-r.top / span) : 1;
  }

  measure();
  /* DM Sans loads with font-display:swap — metrics shift when it arrives, so
     re-measure the dock geometry once fonts settle */
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(function () { measure(); apply(window.__cineP || 0); });

  /* pinned progress for screenshots / scroll-capture: apply once, no loop */
  var pin = new URLSearchParams(location.search).get("cine");
  if (pin !== null) {
    var p = clamp01(parseFloat(pin) || 0);
    apply(p);
    window.__cineP = p;
    window.__cineReady = true;
    return;
  }

  var shown = progress();                     /* start settled — no catch-up sprint */
  var target = shown;
  apply(shown);

  var raf = null;
  function frame() {
    raf = null;
    target = progress();
    shown += (target - shown) * 0.16;
    if (Math.abs(target - shown) < 0.0005) shown = target;
    apply(shown);
    window.__cineP = shown;
    if (shown !== target) raf = requestAnimationFrame(frame);
  }
  function kick() { if (raf === null) raf = requestAnimationFrame(frame); }

  window.addEventListener("scroll", kick, { passive: true });
  var rsz = null;
  window.addEventListener("resize", function () {
    clearTimeout(rsz);
    rsz = setTimeout(function () { measure(); kick(); }, 120);
  });

  window.__cineP = shown;
  window.__cineReady = true;
})();
