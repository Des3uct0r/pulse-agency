/* ============ PULSE™ — рух, який оживає під курсором ============ */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------- 1. Кастомний курсор ---------- */
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  const label = ring.querySelector(".cursor-label");

  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { x: mouse.x, y: mouse.y };

  if (!isTouch && !reduced) {
    addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      dot.style.transform = `translate(${mouse.x}px,${mouse.y}px) translate(-50%,-50%)`;
    }, { passive: true });

    addEventListener("mousedown", () => ring.classList.add("pressing"));
    addEventListener("mouseup", () => ring.classList.remove("pressing"));

    // магнітні елементи — курсор росте й показує підпис
    document.querySelectorAll("a, button, input, select, textarea, .tilt").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        ring.classList.add("hovering");
        const text = el.dataset.cursor;
        if (text) { label.textContent = text; ring.classList.add("hovered-link"); }
      });
      el.addEventListener("mouseleave", () => {
        ring.classList.remove("hovering", "hovered-link");
      });
    });
  } else {
    dot.style.display = "none";
    ring.style.display = "none";
    document.body.style.cursor = "auto";
  }

  /* ---------- 2. Магнітні кнопки ---------- */
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    if (isTouch || reduced) return;
    const strength = 0.35;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * strength}px,${dy * strength}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "transform .5s cubic-bezier(.2,.9,.2,1.3)";
      el.style.transform = "";
      setTimeout(() => (el.style.transition = ""), 500);
    });
  });

  /* ---------- 3. Canvas: сузір'я, яке тягнеться до курсора ---------- */
  const canvas = document.getElementById("field");
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  const resize = () => {
    W = canvas.width = innerWidth * devicePixelRatio;
    H = canvas.height = innerHeight * devicePixelRatio;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
  };
  resize();
  addEventListener("resize", () => { resize(); initParticles(); });

  const COUNT = isTouch ? 55 : 110;
  function initParticles() {
    particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
      r: (Math.random() * 1.6 + 0.6) * devicePixelRatio,
    }));
  }
  initParticles();

  let cx = -9999, cy = -9999;
  addEventListener("mousemove", (e) => {
    cx = e.clientX * devicePixelRatio;
    cy = e.clientY * devicePixelRatio;
  }, { passive: true });
  addEventListener("mouseout", () => { cx = cy = -9999; });

  const LINK = 130 * devicePixelRatio;
  const CURSOR_PULL = 190 * devicePixelRatio;

  function drawField() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      // м'яке тяжіння до курсора
      const dx = cx - p.x, dy = cy - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < CURSOR_PULL && dist > 1) {
        const f = (1 - dist / CURSOR_PULL) * 0.045;
        p.vx += (dx / dist) * f;
        p.vy += (dy / dist) * f;
      }
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.985; p.vy *= 0.985;
      // легкий дрейф, щоб не зупинялися
      if (Math.abs(p.vx) < 0.02) p.vx += (Math.random() - 0.5) * 0.01;
      if (Math.abs(p.vy) < 0.02) p.vy += (Math.random() - 0.5) * 0.01;

      // відбивання від країв
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));
    }

    // лінії між частинками
    ctx.lineWidth = 0.6 * devicePixelRatio;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          const alpha = (1 - d / LINK) * 0.16;
          ctx.strokeStyle = `rgba(232,255,71,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // лінія від курсора
      const dc = Math.hypot(a.x - cx, a.y - cy);
      if (dc < CURSOR_PULL) {
        const alpha = (1 - dc / CURSOR_PULL) * 0.4;
        ctx.strokeStyle = `rgba(122,92,255,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(242,241,238,.6)";
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!reduced) requestAnimationFrame(drawField);
  }
  if (!reduced) requestAnimationFrame(drawField);

  /* ---------- 4. Кінетичний заголовок: літери тікають від курсора ---------- */
  document.querySelectorAll(".kinetic-line").forEach((line) => {
    const text = line.textContent.trim();
    line.textContent = "";
    [...text].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "k-char";
      span.textContent = ch === " " ? "\u00A0" : ch;
      line.appendChild(span);
    });
  });

  if (!isTouch && !reduced) {
    const chars = [...document.querySelectorAll(".k-char")];
    addEventListener("mousemove", (e) => {
      chars.forEach((c) => {
        const r = c.getBoundingClientRect();
        const dy = r.top + r.height / 2 - e.clientY;
        const dist = Math.hypot(r.left + r.width / 2 - e.clientX, dy);
        if (dist < 130) {
          const f = (1 - dist / 130) * 26;
          const ang = Math.atan2(dy, r.left + r.width / 2 - e.clientX);
          c.style.transform = `translate(${Math.cos(ang) * f}px,${Math.sin(ang) * f}px)`;
          c.style.color = "var(--accent)";
        } else {
          c.style.transform = "";
          c.style.color = "";
        }
      });
    }, { passive: true });
  }

  /* ---------- 5. Паралакс-шари від позиції миші ---------- */
  if (!isTouch && !reduced) {
    const layers = [
      { el: document.querySelector(".hero-inner"), k: 10 },
      { el: document.querySelector(".blob-1"), k: -34 },
      { el: document.querySelector(".blob-2"), k: -22 },
    ];
    addEventListener("mousemove", (e) => {
      const nx = (e.clientX / innerWidth - 0.5);
      const ny = (e.clientY / innerHeight - 0.5);
      layers.forEach(({ el, k }) => {
        if (!el) return;
        el.style.transform = `translate(${nx * k}px,${ny * k}px)`;
      });
    }, { passive: true });
  }

  /* ---------- 6. 3D-тилт карток ---------- */
  if (!isTouch && !reduced) {
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${nx * 8}deg) rotateX(${-ny * 8}deg) translateZ(6px)`;
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform .6s cubic-bezier(.2,.9,.2,1.2)";
        card.style.transform = "";
        setTimeout(() => (card.style.transition = ""), 600);
      });
    });
  }

  /* ---------- 7. Scroll reveal + прогрес + каунтери ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        en.target.querySelectorAll?.("[data-count]").forEach(runCounter);
        if (en.target.hasAttribute("data-count")) runCounter(en.target);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    const target = +el.dataset.count;
    const dur = 1200;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const progress = document.querySelector(".scroll-progress");
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${(scrollY / max) * 100}%`;
  }, { passive: true });

  /* ---------- 8. Форма (демо) ---------- */
  const form = document.querySelector(".contact-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const done = form.querySelector(".form-done");
    done.hidden = false;
    form.querySelector("button").textContent = "Надіслано ✓";
    form.querySelectorAll("input, textarea, select, button").forEach((f) => (f.disabled = true));
  });
})();
