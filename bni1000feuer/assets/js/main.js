/* BNI Tausend Feuer · Interaktionen (ohne Abhängigkeiten) */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Header beim Scrollen */
  const header = $("[data-header]");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile Navigation */
  const toggle = $("[data-nav-toggle]");
  const list = $("[data-nav-list]");
  if (toggle && list) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      list.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    list.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  /* Aktiver Menüpunkt */
  const navLinks = $$('.nav-list a[href^="#"]');
  if ("IntersectionObserver" in window && navLinks.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach((a) => { const t = $(a.getAttribute("href")); if (t) spy.observe(t); });
  }

  /* Reveal beim Scrollen, gestaffelt */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.filter((en) => en.isIntersecting).forEach((en, i) => {
        en.target.style.setProperty("--d", Math.min(i * 0.07, 0.42) + "s");
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* Zähler */
  const fmt = new Intl.NumberFormat("de-DE");
  const counters = $$("[data-count]");
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = fmt.format(target); return; }
    const dur = 2200;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach((c) => { if (!reduceMotion) c.textContent = "0"; cio.observe(c); });
  }

  /* Nächstes Treffen: jeden Mittwoch, 6:45 Uhr (deutsche Zeit) */
  const nextMeeting = () => {
    const now = new Date();
    const d = new Date(now);
    d.setHours(6, 45, 0, 0);
    let add = (3 - d.getDay() + 7) % 7;
    if (add === 0 && now > d) add = 7;
    d.setDate(d.getDate() + add);
    return d;
  };
  const dateEl = $("[data-next-meeting-date]");
  const cd = $("[data-countdown]");
  const updateMeeting = () => {
    const next = nextMeeting();
    if (dateEl) {
      dateEl.textContent = next.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }) + ", 6:45 Uhr";
    }
    if (cd) {
      const diff = Math.max(0, next - new Date());
      const days = Math.floor(diff / 864e5);
      const hours = Math.floor((diff % 864e5) / 36e5);
      const mins = Math.floor((diff % 36e5) / 6e4);
      $('[data-cd="d"]', cd).textContent = days;
      $('[data-cd="h"]', cd).textContent = hours;
      $('[data-cd="m"]', cd).textContent = mins;
      cd.hidden = false;
    }
  };
  updateMeeting();
  setInterval(updateMeeting, 30000);

  /* Google Maps erst nach Klick laden */
  const map = $("[data-map]");
  const mapBtn = $("[data-map-load]");
  if (map && mapBtn) {
    mapBtn.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = "https://www.google.com/maps?q=Bistro+auf+Schalke,+Parkallee+1,+45891+Gelsenkirchen&output=embed";
      f.title = "Karte: Bistro auf Schalke, Parkallee 1, Gelsenkirchen";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      map.innerHTML = "";
      map.appendChild(f);
    });
  }

  /* Mitglieder: Suche und Filter */
  const grid = $("[data-member-grid]");
  if (grid) {
    const cards = $$(".member", grid);
    const search = $("[data-member-search]");
    const chips = $$("[data-member-filters] .chip");
    const count = $("[data-member-count]");
    const empty = $("[data-member-empty]");
    let filter = "all";
    const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

    const apply = () => {
      const q = norm(search ? search.value.trim() : "");
      let shown = 0;
      cards.forEach((c) => {
        const ok = (filter === "all" || c.dataset.cat === filter) && (!q || norm(c.dataset.search).includes(q));
        c.hidden = !ok;
        if (ok) { shown++; c.classList.add("is-visible"); }
      });
      if (count) count.textContent = shown === cards.length ? `${shown} Mitglieder` : `${shown} von ${cards.length} Mitgliedern`;
      if (empty) empty.hidden = shown > 0;
    };

    chips.forEach((chip) => chip.addEventListener("click", () => {
      filter = chip.dataset.filter;
      chips.forEach((c) => { const on = c === chip; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); });
      apply();
    }));
    if (search) search.addEventListener("input", apply);
    apply();

    /* Lichtschein folgt der Maus */
    if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
      grid.addEventListener("pointermove", (e) => {
        const c = e.target.closest(".member");
        if (!c) return;
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", `${e.clientX - r.left}px`);
        c.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    }
  }

  /* Leichter 3D-Tilt fürs Hero-Bild */
  const tilt = $("[data-tilt]");
  if (tilt && !reduceMotion && window.matchMedia("(hover: hover) and (min-width: 961px)").matches) {
    tilt.addEventListener("pointermove", (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    tilt.addEventListener("pointerleave", () => { tilt.style.transform = ""; });
  }

  /* Funkenflug: tausend kleine Feuer */
  const startEmbers = (canvas) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, parts = [], running = false, raf = 0, inView = false;

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 14000));
      parts = Array.from({ length: n }, () => spawn(true));
    };
    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 1.8 + 0.6,
      vy: Math.random() * 0.55 + 0.25,
      vx: (Math.random() - 0.5) * 0.25,
      swing: Math.random() * Math.PI * 2,
      life: Math.random() * 0.5 + 0.5,
      hue: 28 + Math.random() * 22,
    });
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        p.swing += 0.02;
        p.x += p.vx + Math.sin(p.swing) * 0.3;
        p.y -= p.vy;
        const fade = Math.max(0, Math.min(1, p.y / h)) * p.life;
        if (p.y < -10 || fade <= 0.02) Object.assign(p, spawn(false));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue}, 100%, 75%, ${fade})`);
        g.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const play = () => { if (!running) { running = true; raf = requestAnimationFrame(draw); } };
    const pause = () => { running = false; cancelAnimationFrame(raf); };

    resize();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; inView ? play() : pause(); }).observe(canvas);
    document.addEventListener("visibilitychange", () => (document.hidden || !inView ? pause() : play()));
  };
  if (!reduceMotion && "IntersectionObserver" in window) $$("[data-embers]").forEach(startEmbers);

  /* Jahr im Footer */
  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
