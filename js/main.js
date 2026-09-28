/* Duo site — subtle scroll motion on the hero phone, feature reveals, and the
 * line that threads the features together as you scroll past them.
 * Transform / stroke only, so nothing reflows and nothing shifts layout.
 */

const MILESTONE_BURSTS = {
  groups: ["🫂", "✨", "💛", "⭐"],
  nudges: ["👋", "✨", "🔔", "💛"],
  widget: ["📲", "✨", "⚡", "⭐"],
  voice: ["🎙️", "✨", "🔊", "💛"],
  chat: ["💬", "✨", "💛", "⭐"],
};

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/* One celebratory beat per milestone: a sticker pops off the dot, and a
 * short emoji-and-spark burst arcs out, then falls. */
function celebrateMilestone(node) {
  if (!node || node.dataset.celebrated) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  node.dataset.celebrated = "1";

  const feature = node.closest(".feature");
  if (feature) feature.classList.add("is-celebrating");
  node.classList.add("is-celebrating");

  const burst = document.createElement("div");
  burst.className = "milestone-burst";
  burst.setAttribute("aria-hidden", "true");

  const sticker = document.createElement("span");
  sticker.className = "milestone-sticker";
  sticker.innerHTML =
    '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">' +
    '<path fill="#1a1406" d="M12 2.2l2.15 6.35h6.6l-5.35 4.05 2.05 6.4L12 15.15 6.55 19l2.05-6.4L3.25 8.55h6.6z"/>' +
    "</svg>";
  burst.appendChild(sticker);

  const glyphs = MILESTONE_BURSTS[(feature && feature.dataset.feature) || "groups"] || MILESTONE_BURSTS.groups;
  const bits = [];
  const count = 11;
  const textOnRight = feature ? !feature.matches(":nth-of-type(even)") : true;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    const kind = i % 3;
    const emoji = kind === 0;
    el.className = emoji
      ? "burst-bit"
      : "burst-bit burst-spark" + (kind === 1 ? " is-star" : i % 2 ? " is-ink" : "");
    if (emoji) el.textContent = glyphs[i % glyphs.length];
    burst.appendChild(el);

    // Fountain upward, biased away from the copy so the words stay clear.
    const spread = (i / (count - 1) - 0.5) * Math.PI * 0.95;
    const angle = -Math.PI / 2 + spread + (textOnRight ? -0.35 : 0.35) + (Math.random() - 0.5) * 0.2;
    const speed = (emoji ? 180 : 230) + Math.random() * 120;
    bits.push({
      el,
      x: 0,
      y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (emoji ? 30 : 8),
      rot: (Math.random() - 0.5) * 40,
      vr: (Math.random() - 0.5) * 280,
      scale: emoji ? 0.82 + Math.random() * 0.5 : 0.65 + Math.random() * 0.7,
    });
  }

  node.appendChild(burst);

  let avoid = null;
  if (feature) {
    const title = feature.querySelector("h3");
    const copy = feature.querySelector("p");
    if (title && copy) {
      const a = title.getBoundingClientRect();
      const b = copy.getBoundingClientRect();
      const origin = node.getBoundingClientRect();
      const ox = origin.left + origin.width / 2;
      const oy = origin.top + origin.height / 2;
      const pad = 36;
      avoid = {
        left: Math.min(a.left, b.left) - ox - pad,
        right: Math.max(a.right, b.right) - ox + pad,
        top: Math.min(a.top, b.top) - oy - pad,
        bottom: Math.max(a.bottom, b.bottom) - oy + pad,
      };
    }
  }

  const start = performance.now();
  const duration = 900;
  let last = start;

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const dt = Math.min(0.034, (now - last) / 1000);
    last = now;

    bits.forEach((bit) => {
      bit.vy += 380 * dt;
      bit.vx *= Math.pow(0.08, dt);
      bit.vy *= Math.pow(0.16, dt);
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      if (avoid && bit.x > avoid.left && bit.x < avoid.right && bit.y > avoid.top && bit.y < avoid.bottom) {
        bit.el.style.opacity = "0";
        return;
      }
      bit.rot += bit.vr * dt;
      const pop = t < 0.16 ? easeOutBack(t / 0.16) : 1;
      const fade = t < 0.34 ? 1 : 1 - (t - 0.34) / 0.66;
      bit.el.style.transform =
        "translate(-50%, -50%) translate(" +
        bit.x.toFixed(1) + "px," + bit.y.toFixed(1) + "px) rotate(" +
        bit.rot.toFixed(1) + "deg) scale(" + (bit.scale * Math.max(0, pop)).toFixed(3) + ")";
      bit.el.style.opacity = String(Math.max(0, fade));
    });

    if (t < 1) {
      requestAnimationFrame(frame);
      return;
    }

    burst.remove();
    node.classList.remove("is-celebrating");
    if (feature) feature.classList.remove("is-celebrating");
  }

  requestAnimationFrame(frame);
}

(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function clamp01(n) {
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  /* The header sits clear over the hero art and only picks up a background
   * once the page has scrolled, so it stays readable over the sections below. */
  function stickyHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let ticking = false;

    function update() {
      ticking = false;
      header.classList.toggle("is-stuck", window.scrollY > 24);
    }

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  function heroParallax() {
    const shell = document.querySelector(".phone-shell");
    if (!shell || reduced.matches) return;

    let ticking = false;

    function update() {
      ticking = false;
      // Only the first viewport of scrolling drives the effect.
      const p = Math.min(window.scrollY / window.innerHeight, 1);
      shell.style.transform =
        "translate3d(0," + (-34 * p).toFixed(2) + "px,0) scale(" + (1 - 0.04 * p).toFixed(4) + ")";
    }

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  /* Vertical switcher for the hero illustrations. Three states per slide:
   * active (in frame), out (riding up and away) and parked (waiting below with
   * transitions off). Parking is what lets a slide jump from the top back to
   * the bottom without being seen crossing the frame. */
  function heroCarousel() {
    const stage = document.querySelector("[data-hero-carousel]");
    if (!stage) return;

    const slides = Array.from(stage.querySelectorAll(".hero-slide"));
    if (slides.length < 2) return;

    const HOLD = 4200;
    let current = Math.max(0, slides.findIndex((el) => el.classList.contains("is-active")));
    let timer = null;

    function step() {
      const next = (current + 1) % slides.length;
      slides.forEach((el, i) => {
        el.classList.remove("is-active", "is-out", "is-parked");
        if (i === next) el.classList.add("is-active");
        else if (i === current) el.classList.add("is-out");
        else el.classList.add("is-parked");
      });
      current = next;
    }

    function start() {
      if (!timer) timer = setInterval(step, HOLD);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    // don't burn a timer on a tab nobody is looking at
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    start();
  }

  function revealOnScroll() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduced.matches || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );

    items.forEach((el) => io.observe(el));
  }

  /* The connector is measured from the real DOM: the dots own their position
   * in CSS (centre on desktop, left margin on narrow screens), and the path is
   * drawn through wherever they actually ended up. So the line follows the
   * layout instead of guessing at it. */
  function featureFlow() {
    const list = document.querySelector("[data-feature-flow]");
    if (!list) return;

    const svg = list.querySelector(".feature-line");
    const track = list.querySelector(".feature-line-track");
    const flow = list.querySelector(".feature-line-flow");
    const nodes = Array.from(list.querySelectorAll(".feature-node"));
    if (!svg || !track || !flow || nodes.length < 2) return;

    let length = 0;
    let stops = [];
    let ticking = false;
    let armed = false;
    const seenAt = new Map();

    function buildPath(points) {
      let d = "M " + points[0].x.toFixed(1) + " " + points[0].y.toFixed(1);
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const ease = (b.y - a.y) * 0.45; // vertical tangents => smooth S-curves
        d +=
          " C " + a.x.toFixed(1) + " " + (a.y + ease).toFixed(1) +
          ", " + b.x.toFixed(1) + " " + (b.y - ease).toFixed(1) +
          ", " + b.x.toFixed(1) + " " + b.y.toFixed(1);
      }
      return d;
    }

    // Where along the drawn stroke each dot sits, so it lights up exactly as
    // the line arrives (the curves make this slightly longer than its y ratio).
    function lengthStops(total) {
      const SAMPLES = 240;
      const ys = [];
      for (let i = 0; i <= SAMPLES; i++) {
        ys.push(flow.getPointAtLength((total * i) / SAMPLES).y);
      }
      return nodes.map((node) => {
        const y = Number(node.dataset.flowY);
        for (let i = 0; i <= SAMPLES; i++) {
          if (ys[i] >= y) return i / SAMPLES;
        }
        return 1;
      });
    }

    function measure() {
      const box = list.getBoundingClientRect();
      if (!box.height || !box.width) return;

      const points = nodes.map((node) => {
        const r = node.getBoundingClientRect();
        const point = {
          x: r.left - box.left + r.width / 2,
          y: r.top - box.top + r.height / 2,
        };
        node.dataset.flowY = point.y;
        return point;
      });

      // run the line in from the top edge of the list and out the bottom
      const d = buildPath([
        { x: points[0].x, y: 0 },
        ...points,
        { x: points[points.length - 1].x, y: box.height },
      ]);

      svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
      track.setAttribute("d", d);
      flow.setAttribute("d", d);

      length = flow.getTotalLength();
      flow.style.strokeDasharray = length;
      stops = lengthStops(length);
      paint();
    }

    function paint(fromScroll) {
      if (!length) return;

      let p = 1;
      let box = null;
      if (!reduced.matches) {
        box = list.getBoundingClientRect();
        // The reading line sits at mid-viewport so a snapped feature,
        // its dot, and the celebration all land together.
        p = clamp01((window.innerHeight * 0.5 - box.top) / box.height);
      }

      const center = window.innerHeight * 0.5;
      let hold = -1;
      let holdDist = 110;

      if (box) {
        nodes.forEach((node, i) => {
          const y = box.top + Number(node.dataset.flowY);
          const dist = Math.abs(y - center);
          if (dist < holdDist && y <= center + 28) {
            holdDist = dist;
            hold = i;
          }

          const prev = seenAt.has(node) ? seenAt.get(node) : y;
          seenAt.set(node, y);
          if (!fromScroll || reduced.matches) return;
          const crossed = prev > center - 8 && y <= center + 8 && prev > y;
          const resting = dist < 64 && y <= center + 24;
          if (y > center + 150) delete node.dataset.paused;
          if (armed && (crossed || resting)) celebrateMilestone(node);
        });

        if (hold >= 0) p = Math.max(p, stops[hold]);
      }

      flow.style.strokeDashoffset = (length * (1 - p)).toFixed(2);
      nodes.forEach((node, i) => {
        const was = node.classList.contains("lit");
        const lit = was ? p >= stops[i] - 0.04 : p >= stops[i] - 0.005;
        node.classList.toggle("lit", lit);
      });
    }

    /* Notched mouse wheels pause briefly on the milestone the next notch would
     * cross, so the sticker reads. Trackpads and touch scroll freely: their
     * momentum stream can't be held without feeling stuck. */
    function isNotchedWheel(event) {
      if (event.deltaMode !== 0) return true;
      const dy = Math.abs(event.deltaY);
      return event.deltaX === 0 && Number.isInteger(event.deltaY) && dy >= 50;
    }

    function bindMilestonePause() {
      const fine = window.matchMedia("(pointer: fine)");
      if (!fine.matches || reduced.matches) return;

      let lockUntil = 0;

      window.addEventListener(
        "wheel",
        (event) => {
          if (reduced.matches || event.ctrlKey || !isNotchedWheel(event)) return;
          const now = performance.now();
          if (now < lockUntil) {
            if (event.deltaY < 0) {
              lockUntil = 0;
              nodes.forEach((node) => {
                const rect = node.getBoundingClientRect();
                if (rect.top + rect.height / 2 > window.innerHeight * 0.5) {
                  delete node.dataset.paused;
                }
              });
              return;
            }
            event.preventDefault();
            return;
          }
          let delta = event.deltaY;
          if (event.deltaMode === 1) delta *= 16;
          else if (event.deltaMode === 2) delta *= window.innerHeight;
          if (delta <= 0) return;

          const center = window.innerHeight * 0.5;
          const reach = Math.min(88, Math.max(42, Math.abs(delta) + 12));
          let target = null;
          let targetY = Infinity;

          nodes.forEach((node) => {
            if (node.dataset.paused) return;
            const rect = node.getBoundingClientRect();
            const y = rect.top + rect.height / 2;
            if (y < center - 16 || y > center + reach) return;
            if (y < targetY) {
              target = node;
              targetY = y;
            }
          });

          if (!target) return;

          target.dataset.paused = "1";
          lockUntil = now + 420;
          armed = true;
          event.preventDefault();
          window.scrollTo({ top: window.scrollY + targetY - center, behavior: "auto" });
          celebrateMilestone(target);
        },
        { passive: false }
      );
    }

    window.addEventListener(
      "scroll",
      () => {
        armed = true;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          paint(true);
        });
      },
      { passive: true }
    );

    bindMilestonePause();

    // Lazy-loaded feature art changes the list height as it arrives, so keep
    // re-measuring instead of trusting the first pass.
    if ("ResizeObserver" in window) {
      new ResizeObserver(measure).observe(list);
    } else {
      window.addEventListener("resize", measure);
      window.addEventListener("load", measure);
    }

    measure();
  }

  function heroPhoneVideo() {
    const video = document.querySelector("[data-phone-video]");
    const toggle = document.querySelector("[data-phone-audio]");
    if (!video || !toggle) return;

    function label(key, fallback) {
      const dict = window.DuoI18n && window.DuoI18n.dict;
      return (dict && dict[key]) || fallback;
    }

    function syncUi() {
      const unmuted = !video.muted;
      toggle.setAttribute("aria-pressed", unmuted ? "true" : "false");
      toggle.setAttribute(
        "aria-label",
        unmuted ? label("hero.mute", "Mute demo") : label("hero.unmute", "Unmute demo")
      );
    }

    function fitScreenToVideo() {
      const screen = video.closest(".phone-screen");
      if (!screen || !video.videoWidth || !video.videoHeight) return;
      screen.style.aspectRatio = video.videoWidth + " / " + video.videoHeight;
    }

    function ensurePlaying() {
      if (!video.paused) return;
      const play = video.play();
      if (play && typeof play.catch === "function") play.catch(() => {});
    }

    toggle.addEventListener("click", () => {
      video.muted = !video.muted;
      if (!video.muted) ensurePlaying();
      syncUi();
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) ensurePlaying();
    });

    video.addEventListener("pause", () => {
      if (!document.hidden) ensurePlaying();
    });

    video.addEventListener("loadedmetadata", fitScreenToVideo);
    if (video.readyState >= 1) fitScreenToVideo();

    video.muted = true;
    syncUi();
    ensurePlaying();
  }

  document.addEventListener("DOMContentLoaded", () => {
    stickyHeader();
    heroParallax();
    heroCarousel();
    heroPhoneVideo();
    revealOnScroll();
    featureFlow();
  });
})();
