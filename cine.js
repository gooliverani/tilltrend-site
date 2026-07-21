/* cine.js: the homepage firefly hero (founder's Claude Design pair, 2026-07-20;
   supersedes the D-079 reverse-scrub). The scene rests ASSEMBLED and alive:
   the seam glow and every unburned tagline letter flicker like fireflies on a
   shared multi-sine clock. Scroll burns the sentence out letter by letter in a
   golden-ratio scatter (never reading order), fades the wordmark out with it,
   settles the glow to a dimmer flicker, then shrinks the mark into the
   header's 30px brand icon while the header brand crossfades in: the light
   goes home to the logo.

   Fail-open: the assembled scene is the CSS default; this file only perturbs
   it, so any error leaves a complete static banner and a normal header.

   Dev contract (machine verification): ?cine=0.42 pins scrub progress and
   skips the loop; pinned frames use a FIXED flicker clock so screenshots are
   deterministic; window.__cineReady flips true after init; window.__cineP
   reports the live progress.

   Twin file: app/server/static/intro.js (branch feat/onboarding-intro) plays
   this same DNA on a ~5.6s clock as the once-ever dashboard intro. The shared
   math, letter-split, burn offsets, and tuned levels are pinned identical by
   app/tests/test_motion_sync.py: tune BOTH or the suite fails. */
(function () {
  "use strict";
  var root = document.documentElement;
  var section = document.getElementById("cine");
  if (!section || !root.classList.contains("cine-on")) return;

  var stage = section.querySelector(".cine-stage");
  var lockup = section.querySelector(".cine-lockup");
  var hexSvg = section.querySelector(".cine-hex");
  var tag = section.querySelector(".cine-tag");
  var word = section.querySelector(".cine-word");
  var hint = section.querySelector(".cine-hint");
  var brand = document.querySelector("header.site .brand");
  var glowMain = hexSvg.querySelector('[data-glow="main"]');
  var glowBloom = hexSvg.querySelector('[data-glow="bloom"]');

  /* split the tagline into per-word spans holding per-letter spans, so the
     burn-out can address letters while phones still wrap at word boundaries */
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

  /* per-letter burn offsets: a golden-ratio scatter, so neighbours never burn
     in reading order yet the pattern is deterministic frame to frame */
  var OFF = [];
  for (var oi = 0; oi < N; oi++) OFF.push(0.08 + 0.72 * ((oi * 0.618 + 0.317) % 1));

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
  function ioCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  /* the firefly clock: three incommensurate sines, clamped so the light never
     quite dies and never clips */
  function flick(t) {
    var v = 0.55 + 0.28 * Math.sin(t * 1.7) + 0.22 * Math.sin(t * 3.1 + 1.3) +
            0.12 * Math.sin(t * 5.3 + 0.7);
    return Math.min(1, Math.max(0.05, v));
  }

  /* Drawer-over-scene without :has(): mirror the nav checkbox into a body
     class so the z-drop + scroll-lock rules have a selector every engine
     can match (style.css body.nav-open). */
  var navCb = document.getElementById("nav-toggle");
  if (navCb) {
    var syncNav = function () {
      document.body.classList.toggle("nav-open", navCb.checked);
    };
    navCb.addEventListener("change", syncNav);
    syncNav();
  }

  /* Geometry: the lockup and mark rest where CSS lays them out; only the dock
     needs measurements. Base rects are taken in STAGE space with the lockup
     untransformed. The header icon target lives in VIEWPORT space and is
     converted to stage space per frame in apply(), because the stage only
     coincides with the viewport while its sticky pin is engaged. The 30px is
     the .brand::before icon box (style.css); a pseudo-element has no rect of
     its own, so it is derived from the brand's left edge. */
  var ICON_H = 30;
  var m = null;
  function measure() {
    lockup.style.transform = "";              /* dock base must be untransformed */
    var st = stage.getBoundingClientRect();
    var lr = lockup.getBoundingClientRect();
    var hx = hexSvg.getBoundingClientRect();
    var br = brand.getBoundingClientRect();
    m = {
      lock: { x: lr.left - st.left, y: lr.top - st.top },
      mark: { x: hx.left - st.left, y: hx.top - st.top, h: hx.height },
      icon: { x: br.left, y: br.top + (br.height - ICON_H) / 2 }   /* viewport */
    };
  }

  function apply(p, tc) {
    /* header target to stage space, against the stage's live position */
    var sr = stage.getBoundingClientRect();
    var icon = { x: m.icon.x - sr.left, y: m.icon.y - sr.top };

    hint.style.opacity = String(Math.max(0, 1 - p / 0.06));

    /* phases: burn-out rides p 0..0.58, the dock 0.58..0.9, the header
       handoff 0.9..1 (the founder's Claude Design timing) */
    var p1 = Math.min(1, p / 0.58);
    var dp = ioCubic(seg(p, 0.58, 0.9));
    var hp = seg(p, 0.9, 1);
    var f = flick(tc);

    /* glow law: full firefly flicker while the lockup rests, settling to a
       dimmer flicker as the sentence burns out; the bloom rides at half */
    var glow = f * (1 - p1) + (0.3 + 0.25 * f) * p1;
    glowMain.style.opacity = String(glow);
    glowBloom.style.opacity = String(0.5 * glow);

    /* letters: alive and flickering until their offset comes up, then a short
       dying sputter, then burned out to a faint trace */
    for (var i = 0; i < N; i++) {
      var u = (p1 - OFF[i]) / 0.07;
      var o;
      if (u <= 0) o = 0.7 + 0.3 * flick(tc * 1.5 + i * 1.13);
      else if (u < 1) o = Math.max(0.05, 0.85 * (1 - u) * (Math.sin(u * 32 + i) > -0.3 ? 1 : 0.15));
      else o = 0.05;
      letters[i].style.opacity = String(o);
    }

    /* wordmark: burns out with the tagline, so only the mark docks home */
    if (word) word.style.opacity = String(1 - seg(p1, 0.55, 0.95));

    /* dock: shrink the WHOLE lockup so the mark lands exactly on the header
       icon box, then crossfade lockup out / header brand in */
    var s = lerp(1, ICON_H / m.mark.h, dp);
    var mrx = m.mark.x - m.lock.x, mry = m.mark.y - m.lock.y;
    var tx = lerp(m.mark.x, icon.x, dp) - m.lock.x - s * mrx;
    var ty = lerp(m.mark.y, icon.y, dp) - m.lock.y - s * mry;
    lockup.style.transform = dp > 0
      ? "translate(" + tx + "px," + ty + "px) scale(" + s + ")" : "";
    lockup.style.opacity = String(1 - hp);
    brand.style.opacity = String(p >= 1 ? 1 : hp);
  }

  function progress() {
    var r = section.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp01(-r.top / span) : 1;
  }

  measure();
  /* DM Sans loads with font-display:swap; metrics shift when it arrives, so
     re-measure the dock geometry once fonts settle */
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(function () {
      measure();
      apply(window.__cineP || 0, PIN_TC);
    });

  /* pinned progress for screenshots / scroll-capture: apply once at a frozen
     flicker clock, no loop */
  var PIN_TC = 2.0;
  var pin = new URLSearchParams(location.search).get("cine");
  var pinned = pin !== null;

  /* a resize moves the dock base and target, so re-measure either way; the
     screenshot pipeline resizes the viewport once after first layout, which
     is exactly the pinned case, so pinned frames re-apply here too */
  var rsz = null;
  window.addEventListener("resize", function () {
    clearTimeout(rsz);
    rsz = setTimeout(function () {
      measure();
      if (pinned) apply(window.__cineP || 0, PIN_TC);
    }, 120);
  });

  if (pinned) {
    var p = clamp01(parseFloat(pin) || 0);
    apply(p, PIN_TC);
    window.__cineP = p;
    window.__cineReady = true;
    return;
  }

  var shown = progress();                     /* start settled: no catch-up sprint */
  var target = shown;
  apply(shown, 0);

  /* touch devices catch up more gently: a fling teleports scrollY, and the
     lower ease spreads that jump over more frames so the burn-out stays
     readable (mouse wheels feed small steady deltas, so desktop keeps the
     snappier ease) */
  var COARSE = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  var EASE = COARSE ? 0.10 : 0.16;

  /* the flicker is a clock, not a scroll response, so the loop runs
     continuously (rAF pauses in hidden tabs on its own) */
  var collapsed = false;
  var raf = requestAnimationFrame(function frame(now) {
    raf = requestAnimationFrame(frame);
    target = progress();
    /* sticky-failure fallback: mid-scrub the stage must be pinned (top around
       0). If it scrolled away instead (an engine where an ancestor clip kills
       position:sticky), collapse the track to a one-viewport static banner,
       never a blank scroll run. */
    if (!collapsed && target > 0.08 && target < 0.9 &&
        stage.getBoundingClientRect().top < -80) {
      collapsed = true;
      section.style.height = "auto";
      apply(0, PIN_TC);
      hint.style.opacity = "0";
      brand.style.opacity = "";
      cancelAnimationFrame(raf);
      return;
    }
    shown += (target - shown) * EASE;
    if (Math.abs(target - shown) < 0.0005) shown = target;
    /* park the per-frame work while the story is over and scrolled past: the
       flicker is invisible there; scrolling back resumes it */
    if (shown === 1 && target === 1 &&
        section.getBoundingClientRect().bottom <= 0) return;
    apply(shown, now / 1000);
    window.__cineP = shown;
  });

  window.__cineP = shown;
  window.__cineReady = true;
})();
